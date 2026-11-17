# Phase 1 Handoff Documentation

This document summarizes the deliverables, architecture, contract, and execution guidelines for Phase 1 of the Dynamic Survey Application take-home assessment for AiGeeks.

---

## 1. How to Run Backend + Tests + Seed

### Prerequisites
- Node.js $\ge 20$ (Verified on v24.22.0)
- npm $\ge 10$ (Verified on 11.19.1)
- MongoDB instance (Local or Atlas URI) or in-memory MongoDB for tests

### Commands
```bash
# 1. Install dependencies from root
npm install

# 2. Setup environment variables
cp backend/.env.example backend/.env

# 3. Build shared package & backend
npm run build

# 4. Run entire test suite (49 unit & integration tests)
npm test

# 5. Seed database with Admin user only
npm run seed:admin

# 6. Seed database with Admin + "Customer Feedback" Demo Survey + 25 Realistic Responses
npm run seed

# 7. Start backend development server (with tsx watch & hot reload)
npm run dev:backend
```

---

## 2. Repository Folder Tree
```
survey-builder-aigeeks/
├── .editorconfig
├── .gitignore
├── README.md
├── package.json
├── docs/
│   ├── API.md                      # Complete OpenAPI-lite REST API specification
│   └── PHASE1_HANDOFF.md           # Phase 1 documentation & Phase 2 transition plan
├── frontend/
│   └── README.md                   # Placeholder reserved for Phase 2 (Vite + React + Tailwind)
├── shared/                         # Pure TypeScript package (only Zod dep)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── src/
│   │   ├── index.ts                # Package exports
│   │   ├── types.ts                # Survey, Question, Condition, AnswersMap, Analytics types
│   │   ├── schemas.ts              # Zod validation schemas
│   │   ├── visibility.ts           # isQuestionVisible & getVisibleQuestions engine
│   │   ├── survey-validation.ts    # validateSurveySchema with cross-field & dependency rules
│   │   └── response-validation.ts  # validateResponse evaluating visibility, drop rules, bounds
│   └── tests/
│       ├── survey-validation.test.ts # 12 unit tests (cycle prevention, options, operators)
│       ├── visibility.test.ts        # 7 unit tests (chains A->B->C, multi-select includes)
│       └── response-validation.test.ts# 8 unit tests (drop hidden answers, required visible)
└── backend/                        # Node.js + Express + TypeScript + Mongoose API
    ├── .env.example
    ├── package.json
    ├── tsconfig.json
    ├── vitest.config.ts
    ├── src/
    │   ├── app.ts                  # Express application configuration
    │   ├── server.ts               # HTTP bootstrap with graceful shutdown
    │   ├── config/
    │   │   ├── database.ts         # Mongoose connection manager
    │   │   └── env.ts              # Zod-validated environment config
    │   ├── models/
    │   │   ├── Admin.ts            # Admin user schema (bcrypt hash)
    │   │   ├── Survey.ts           # Versioned survey schema (rootId, version, isLatest)
    │   │   └── Response.ts         # Response schema (meta.ipHash, submittedAt)
    │   ├── middleware/
    │   │   ├── auth.ts             # JWT Bearer token authentication
    │   │   ├── errorHandler.ts     # Central error format: { error: { code, message, details } }
    │   │   └── rateLimiter.ts      # General, strict submit (10/min), strict login (10/15min)
    │   ├── utils/
    │   │   ├── errors.ts           # Standard AppError classes
    │   │   └── hash.ts             # Password bcrypt & HMAC-SHA256 IP hashing
    │   ├── services/
    │   │   ├── auth.service.ts     # Login & admin token generation
    │   │   ├── survey.service.ts   # Survey CRUD & in-place / version-bump logic
    │   │   ├── response.service.ts # Honeypot check, spam window, validation & submission
    │   │   └── analytics.service.ts# Aggregations for choice, rating avg/dist, text capping
    │   ├── controllers/
    │   │   ├── auth.controller.ts
    │   │   ├── survey.controller.ts
    │   │   └── response.controller.ts
    │   ├── routes/
    │   │   ├── index.ts            # API router (/api/v1) & /health
    │   │   ├── auth.routes.ts
    │   │   ├── survey.routes.ts
    │   │   └── public.routes.ts
    │   └── scripts/
    │       └── seed.ts             # Admin + demo survey + 25 realistic responses
    └── tests/
        ├── setup.ts                # In-memory MongoDB lifecycle for isolated tests
        ├── helpers.ts              # Admin & auth token creation fixtures
        ├── auth.test.ts            # 4 tests: login, wrong pass, protected routes, token expiry
        ├── survey.test.ts          # 8 tests: CRUD, invalid schema, versioning, status, delete
        ├── public.test.ts          # 8 tests: draft/closed 404, valid/invalid/drop submit, honeypot, rate limit
        └── analytics.test.ts       # 2 tests: dataset verification, avg/dist/counts, pagination
```

---

## 3. Full API Contract

See [API.md](file:///Users/shubhamrajpandey/Projects/survey-builder-aigeeks/docs/API.md) for full request/response schemas.

| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` / `/api/v1/health` | None | System uptime and health status |
| `POST` | `/api/v1/auth/login` | None | Admin authentication -> `{ token, admin }` |
| `GET` | `/api/v1/auth/me` | Bearer JWT | Returns current authenticated admin |
| `POST` | `/api/v1/surveys` | Bearer JWT | Creates new survey (validates with `@survey/shared`) |
| `GET` | `/api/v1/surveys` | Bearer JWT | Lists latest version of surveys with `responseCount` |
| `GET` | `/api/v1/surveys/:rootId` | Bearer JWT | Retrieves latest survey schema for editor |
| `PUT` | `/api/v1/surveys/:rootId` | Bearer JWT | Updates survey (in place if 0 responses, new version if $\ge 1$) |
| `PATCH` | `/api/v1/surveys/:rootId/status` | Bearer JWT | Updates status to `published` or `closed` |
| `DELETE`| `/api/v1/surveys/:rootId` | Bearer JWT | Deletes survey, historical versions, and responses |
| `GET` | `/api/v1/surveys/:rootId/analytics` | Bearer JWT | Aggregated metrics (`?version=` or `?version=all`) |
| `GET` | `/api/v1/surveys/:rootId/responses` | Bearer JWT | Paginated raw responses (`?page=&limit=`) |
| `GET` | `/api/v1/public/surveys/:rootId` | None | Public published survey schema (404 for draft/closed) |
| `POST` | `/api/v1/public/surveys/:rootId/responses`| None | Submits answers (honeypot + rate limit + visibility drop) |

---

## 4. Exact Exports of `@survey/shared` for Frontend (Phase 2)

The frontend will import directly from `@survey/shared`:

### Functions
- `isQuestionVisible(question, answers, questionsById)`:
  Evaluates whether a single question should be rendered in the UI based on conditional dependencies. Automatically traverses dependency chains ($A \rightarrow B \rightarrow C$).
- `getVisibleQuestions(questions, answers)`:
  Accepts the array of survey questions and current form values, returning only the questions that are currently active and visible.
- `validateResponse(survey, answers)`:
  Runs client-side pre-submission validation. Returns `{ ok: true, cleanedAnswers }` or `{ ok: false, errors: { [questionId]: string } }`.
- `validateSurveySchema(survey)`:
  Used in the Admin Survey Builder to validate question uniqueness, minimum choices ($\ge 2$), and forward-referencing condition rules in real-time.

### TypeScript Types
- `Survey`, `Question`, `QuestionType`, `Condition`, `ConditionOperator`, `SurveyStatus`
- `AnswerValue`, `AnswersMap`, `SubmitResponsePayload`, `StoredResponse`
- `SurveyAnalyticsResponse`, `QuestionAnalytics`, `RatingQuestionAnalytics`, etc.

### Zod Schemas
- `QuestionSchema`, `ConditionSchema`, `CreateSurveySchema`, `UpdateSurveySchema`, `SubmitResponsePayloadSchema`

---

## 5. Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | HTTP port for Express server | `5000` |
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `development` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://localhost:27017/survey_app` |
| `JWT_SECRET` | Secret key for JWT signing ($\ge 32$ chars required) | Enforced by Zod |
| `JWT_EXPIRES_IN` | Expiration time for admin tokens | `12h` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated or `*`) | `http://localhost:5173,http://localhost:3000` |
| `IP_SALT` | Salt for hashing client IPs ($\ge 16$ chars required) | Enforced by Zod |
| `SPAM_PROTECTION_ENABLED`| Flag to reject duplicate IP submissions | `false` |
| `SPAM_WINDOW_SECONDS` | Window duration for duplicate submission checks | `60` |
| `ADMIN_EMAIL` | Default email for admin seeding script | `admin@aigeeks.io` |
| `ADMIN_PASSWORD` | Default password for admin seeding script | `AdminPassword123!` |

---

## 6. Assumptions, Known Limitations & Trade-Offs

1. **At Most One Condition per Question**:
   - *Design Choice*: As requested in the specification, each question has at most one condition `{ questionId, operator, value }`.
   - *Advantage*: Extremely fast graph evaluation, no complex boolean AST, easy to visualize in admin UI.
2. **Survey Versioning Strategy**:
   - If a survey has 0 responses, edits happen in place.
   - If a survey has $\ge 1$ response, any edit automatically creates a new version doc (`version + 1`) and flags `isLatest: true`, setting old versions to `isLatest: false`. Old responses stay tied to their original schema version.
   - *Trade-off*: Admin status updates (e.g. publish/close) update the latest version in place rather than bumping the version.
3. **No Partial-Response Draft Saving**:
   - Public survey respondents submit complete answers in one go. Partial unfinished submissions are omitted by design to keep public storage clean and spam-free.
4. **Privacy & IP Hashing**:
   - In compliance with privacy regulations (GDPR), raw client IP addresses are never logged or persisted. Only salted HMAC-SHA256 hashes are stored for spam prevention.
5. **NoSQL Injection Prevention**:
   - All answer keys are inspected; any key containing `.` or starting with `$` is rejected before query processing.

---

## 7. Checklist for Phase 2

- [ ] Initialize `frontend/` using Vite + React 18 + TypeScript + Tailwind CSS
- [ ] Connect `@survey/shared` workspace dependency in `frontend/package.json`
- [ ] Setup React Router (`/login`, `/admin/surveys`, `/admin/surveys/new`, `/admin/surveys/:rootId/edit`, `/admin/surveys/:rootId/analytics`, `/s/:rootId`)
- [ ] Build Admin Survey Builder:
  - Add / remove / reorder questions
  - Drag-and-drop or reorder buttons
  - Question types: text, single_choice, checkbox, rating
  - Conditional logic builder (only allows referencing earlier questions)
  - Real-time client validation using `validateSurveySchema`
- [ ] Build Public Survey Form:
  - Clean, responsive UI with zero login requirements
  - Dynamic field rendering based on question schema
  - Real-time conditional question visibility using `isQuestionVisible`
  - Client-side error handling using `validateResponse`
  - Honeypot hidden input field
- [ ] Build Analytics Dashboard:
  - Total response counter
  - Bar / Pie charts for single choice & checkbox
  - Average score badge and distribution histogram for rating questions
  - Paginated / scrollable list for text feedback
- [ ] Create Root README with architecture write-up, setup guide, and demo video script.
