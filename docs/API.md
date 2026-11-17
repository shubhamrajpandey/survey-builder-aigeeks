# REST API Specification (OpenAPI-Lite)

Base URL: `/api/v1`

## Standard Error Response Format
All errors return HTTP status $\ge 400$ with a consistent JSON body:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Response validation failed",
    "details": {
      "q2": "This question is required"
    }
  }
}
```

### Standard Error Codes
- `VALIDATION_ERROR`: Schema validation or business rule check failed
- `UNAUTHORIZED`: Bearer token missing, malformed, or expired
- `FORBIDDEN`: Insufficient permissions
- `SURVEY_NOT_FOUND`: No survey matches the provided rootId
- `SURVEY_DRAFT`: Public requested a survey still in draft mode (HTTP 404)
- `SURVEY_CLOSED`: Public requested a closed survey (HTTP 404)
- `RATE_LIMIT_EXCEEDED`: Too many requests submitted within the rate limit window (HTTP 429)
- `SPAM_DETECTED`: Duplicate submission detected within the configured spam window (HTTP 400)
- `INVALID_CREDENTIALS`: Email or password incorrect (HTTP 401)
- `INVALID_JSON`: Malformed JSON body in HTTP request
- `INTERNAL_SERVER_ERROR`: Unhandled exception on server (HTTP 500)

---

## 1. Authentication

### `POST /api/v1/auth/login`
Authenticates administrator credentials and returns a signed JWT.

**Rate limit**: 10 attempts per 15 minutes per IP.

**Request Body**:
```json
{
  "email": "admin@aigeeks.io",
  "password": "AdminPassword123!"
}
```

**Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "6739cf9b1689255a1098e9b1",
    "email": "admin@aigeeks.io",
    "createdAt": "2026-11-17T12:00:00.000Z"
  }
}
```

---

### `GET /api/v1/auth/me`
Retrieves currently logged-in administrator profile.

**Headers**: `Authorization: Bearer <token>`

**Response (200 OK)**:
```json
{
  "admin": {
    "id": "6739cf9b1689255a1098e9b1",
    "email": "admin@aigeeks.io",
    "createdAt": "2026-11-17T12:00:00.000Z"
  }
}
```

---

## 2. Surveys (Admin - Protected)
All routes require header `Authorization: Bearer <token>`.

### `POST /api/v1/surveys`
Creates a new survey. Validates all cross-question conditions and options using `@survey/shared`.

**Request Body**:
```json
{
  "title": "Customer Feedback",
  "description": "Tell us about your product experience",
  "status": "draft",
  "questions": [
    {
      "id": "q1",
      "type": "single_choice",
      "label": "Do you use our application?",
      "required": true,
      "options": ["Yes", "No"]
    },
    {
      "id": "q2",
      "type": "rating",
      "label": "How would you rate it? (1-5)",
      "required": true,
      "condition": {
        "questionId": "q1",
        "operator": "equals",
        "value": "Yes"
      }
    },
    {
      "id": "q3",
      "type": "text",
      "label": "Why not?",
      "required": true,
      "condition": {
        "questionId": "q1",
        "operator": "equals",
        "value": "No"
      }
    }
  ]
}
```

**Response (201 Created)**:
```json
{
  "survey": {
    "rootId": "4c3b53a0-72f3-4d43-a61f-d7488e175ff4",
    "version": 1,
    "isLatest": true,
    "title": "Customer Feedback",
    "description": "Tell us about your product experience",
    "status": "draft",
    "questions": [...],
    "createdAt": "2026-11-17T12:00:00.000Z",
    "updatedAt": "2026-11-17T12:00:00.000Z"
  }
}
```

---

### `GET /api/v1/surveys`
Lists all latest survey versions with total response counts.

**Response (200 OK)**:
```json
{
  "surveys": [
    {
      "survey": {
        "rootId": "4c3b53a0-72f3-4d43-a61f-d7488e175ff4",
        "version": 1,
        "isLatest": true,
        "title": "Customer Feedback",
        "description": "...",
        "status": "published",
        "createdAt": "2026-11-17T12:00:00.000Z",
        "updatedAt": "2026-11-17T12:00:00.000Z"
      },
      "responseCount": 42
    }
  ]
}
```

---

### `GET /api/v1/surveys/:rootId`
Retrieves the latest survey document for viewing or editing.

**Response (200 OK)**:
```json
{
  "survey": {
    "rootId": "4c3b53a0-72f3-4d43-a61f-d7488e175ff4",
    "version": 1,
    "isLatest": true,
    "title": "Customer Feedback",
    "description": "...",
    "status": "published",
    "questions": [...]
  }
}
```

---

### `PUT /api/v1/surveys/:rootId`
Updates a survey.
- **If survey has 0 responses**: Updated in place (version stays unchanged).
- **If survey has $\ge 1$ response**: Implements automatic versioning. Sets old document `isLatest=false`, creates new document with `version = oldVersion + 1` and `isLatest=true`. Existing responses stay matched with their original version.

**Request Body**:
```json
{
  "title": "Customer Feedback 2026",
  "questions": [...]
}
```

**Response (200 OK)**: Returns the updated / newly versioned survey object.

---

### `PATCH /api/v1/surveys/:rootId/status`
Updates survey lifecycle status.

**Request Body**:
```json
{
  "status": "published" // or "closed"
}
```

**Response (200 OK)**:
```json
{
  "survey": {
    "rootId": "4c3b53a0-72f3-4d43-a61f-d7488e175ff4",
    "status": "published",
    "version": 1,
    ...
  }
}
```

---

### `DELETE /api/v1/surveys/:rootId`
Deletes a survey, all of its historical version documents, and all submitted responses.

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Survey and all versions deleted successfully"
}
```

---

### `GET /api/v1/surveys/:rootId/analytics?version=`
Retrieves aggregated response metrics.
- `version` query parameter: defaults to latest version. Pass `version=all` to aggregate across all versions.

**Response (200 OK)**:
```json
{
  "surveyId": "6739cf9b1689255a1098e9b1",
  "rootId": "4c3b53a0-72f3-4d43-a61f-d7488e175ff4",
  "version": 1,
  "totalResponses": 42,
  "questions": [
    {
      "questionId": "q1",
      "type": "single_choice",
      "label": "Do you use our application?",
      "answered": 42,
      "counts": [
        { "option": "Yes", "count": 32 },
        { "option": "No", "count": 10 }
      ]
    },
    {
      "questionId": "q2",
      "type": "rating",
      "label": "How would you rate it? (1-5)",
      "answered": 32,
      "average": 4.65,
      "distribution": {
        "1": 0,
        "2": 1,
        "3": 2,
        "4": 5,
        "5": 24
      }
    },
    {
      "questionId": "q3",
      "type": "text",
      "label": "Why not?",
      "answered": 10,
      "answers": ["Price is too high", "Missing mobile app"],
      "hasMore": false
    }
  ]
}
```

---

### `GET /api/v1/surveys/:rootId/responses?page=1&limit=20`
Returns paginated raw responses submitted for this survey.

**Query Parameters**:
- `page`: default 1
- `limit`: default 20 (max 100)

**Response (200 OK)**:
```json
{
  "responses": [
    {
      "_id": "6739d4011689255a1098ea02",
      "surveyId": "6739cf9b1689255a1098e9b1",
      "rootId": "4c3b53a0-72f3-4d43-a61f-d7488e175ff4",
      "version": 1,
      "answers": {
        "q1": "Yes",
        "q2": 5
      },
      "submittedAt": "2026-11-17T12:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

## 3. Public Survey API (No Login Required)

### `GET /api/v1/public/surveys/:rootId`
Retrieves published survey schema for rendering public form.
- If survey is draft $\rightarrow$ Returns 404 with `code: "SURVEY_DRAFT"`
- If survey is closed $\rightarrow$ Returns 404 with `code: "SURVEY_CLOSED"`

**Response (200 OK)**:
```json
{
  "survey": {
    "rootId": "4c3b53a0-72f3-4d43-a61f-d7488e175ff4",
    "version": 1,
    "title": "Customer Feedback",
    "description": "Tell us about your experience",
    "questions": [
      {
        "id": "q1",
        "type": "single_choice",
        "label": "Do you use our application?",
        "required": true,
        "options": ["Yes", "No"]
      },
      {
        "id": "q2",
        "type": "rating",
        "label": "How would you rate it? (1-5)",
        "required": true,
        "condition": {
          "questionId": "q1",
          "operator": "equals",
          "value": "Yes"
        }
      }
    ]
  }
}
```

---

### `POST /api/v1/public/surveys/:rootId/responses`
Submits a public response.
- **Strict Rate Limit**: 10 requests per minute per IP.
- **Honeypot protection**: Optional `website` field. If populated, request returns HTTP 201 without saving response.
- **Validation**: Evaluates conditional visibility. Hidden questions: `required` is ignored AND any submitted answers are dropped.

**Request Body**:
```json
{
  "answers": {
    "q1": "Yes",
    "q2": 5
  },
  "website": ""
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Response submitted successfully",
  "responseId": "6739d4011689255a1098ea02"
}
```

---

## 4. Utility

### `GET /health` or `GET /api/v1/health`
Health check endpoint.

**Response (200 OK)**:
```json
{
  "status": "ok",
  "timestamp": "2026-11-17T12:00:00.000Z"
}
```
