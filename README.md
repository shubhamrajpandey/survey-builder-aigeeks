# Dynamic Survey Application

A dynamic, full-stack survey platform built with **TypeScript**, **Node.js/Express**, **MongoDB**, and **React 18**. Designed with clean architecture, strict type safety, real-time conditional logic branching, survey versioning, and analytics visualization.

---

## 🌐 Live URLs & Demo Credentials

- **Live Application**: `https://LIVE_FRONTEND_URL.vercel.app` *(Replace with deployed Vercel URL)*
- **Live API Endpoint**: `https://LIVE_API_URL.onrender.com/api/v1` *(Replace with deployed Render URL)*
- **Health Check**: `https://LIVE_API_URL.onrender.com/health`
- **Demo Admin Credentials**:
  - **Email**: `admin@aigeeks.io`
  - **Password**: `AdminPassword123!`

---

## ✨ Features

### Core Capabilities
- **Admin Survey Builder**:
  - Title & description configuration.
  - 4 Question Types: **Single Choice** (radio), **Multiple Choice** (checkboxes), **Rating** (1–5 stars), and **Open Text** (textarea).
  - Drag-and-drop question reordering with accessible Up/Down keyboard controls.
  - Interactive conditional branching (*"Show Question B only if Question A = 'Yes'"*).
  - In-editor dependency cycle protection (conditions strictly reference earlier questions).
  - Deletion safeguard: alerts when other questions depend on a deleted question and clears dependent conditions.
  - Real-time **Live Preview Modal** using the exact public form component.
- **Public Survey Form (`/s/:rootId`)**:
  - Zero authentication required for respondents.
  - Mobile-first, responsive layout (optimized down to 375px mobile viewports).
  - Dynamic rendering based on the survey JSON schema.
  - Real-time conditional question visibility engine.
  - **Stale answer dropping**: When a question becomes hidden, its answer is automatically purged from state so hidden data is never submitted.
  - Client-side and server-side validation with automatic scroll and focus to the first invalid field.
  - Real-time progress bar (answered visible questions / total visible questions).
  - Clean thank-you confirmation screen upon submission.
- **Analytics & Reporting Dashboard (`/admin/surveys/:rootId/analytics`)**:
  - Total response counter.
  - Horizontal bar charts for single_choice and checkbox distributions with vote counts and percentages.
  - Average rating score badge + 1–5 star distribution histogram.
  - Scrollable text feedback list with `hasMore` indicator (capped at latest 200).
  - Paginated raw response submissions table with timestamps and answers.
  - Multi-version filter dropdown (inspect specific version or aggregate all versions).

### 🎁 Bonus Features
- **JWT Authentication**: 12h expiry, bcrypt password hashing, token verification middleware, and automated session expiration handling.
- **Survey Versioning**:
  - Editing a survey with **0 responses** updates it in-place.
  - Editing a survey with **$\ge 1$ response** creates a new version (`vN+1`) and archives the old version (`isLatest: false`). Historical responses stay permanently linked to their exact original schema version.
- **Spam & Security Protection**:
  - Strict rate limiters on login (10 attempts / 15 min) and survey submissions (10 / min).
  - Honeypot anti-bot protection (hidden `website` field silently drops bot submissions).
  - Salted HMAC-SHA256 IP hashing (no raw IPs stored or logged).
  - NoSQL injection guards: rejects answer keys with `$` or `.`.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Monorepo** | npm workspaces, TypeScript 5.6 (strict mode) |
| **Shared Logic** | Pure TypeScript, Zod 3.23, Vitest |
| **Backend** | Node.js 20+, Express 4, TypeScript, Mongoose 8, JWT, bcryptjs, Helmet, CORS, express-rate-limit |
| **Frontend** | React 18, Vite 5, TypeScript, Tailwind CSS 3, React Router DOM 6, TanStack Query v5, @dnd-kit, Recharts 2, Lucide React, react-hot-toast |
| **Testing** | Vitest, Supertest, mongodb-memory-server, React Testing Library, jsdom |

---

## 📁 Repository Structure

```
survey-builder-aigeeks/
├── shared/                         # Single source of truth (pure TS, Zod)
│   ├── src/
│   │   ├── types.ts                # Shared TypeScript models
│   │   ├── schemas.ts              # Zod validation schemas
│   │   ├── visibility.ts           # isQuestionVisible & getVisibleQuestions
│   │   ├── survey-validation.ts    # validateSurveySchema (cross-field & dependency rules)
│   │   └── response-validation.ts  # validateResponse (visibility, drop rules, bounds)
│   └── tests/                      # 27 unit tests (Vitest)
├── backend/                        # Node.js + Express REST API
│   ├── src/
│   │   ├── app.ts / server.ts      # Express setup & HTTP bootstrap
│   │   ├── config/                 # Zod env validation & Mongoose connection
│   │   ├── models/                 # Admin, Survey (versioned), Response
│   │   ├── middleware/             # requireAuth, rateLimiter, errorHandler
│   │   ├── services/               # auth, survey, response, analytics services
│   │   ├── controllers/            # Thin HTTP controllers
│   │   ├── routes/                 # Express routers (/api/v1)
│   │   └── scripts/seed.ts         # Admin + demo survey + 25 sample responses
│   └── tests/                      # 22 integration tests (Supertest + mongodb-memory-server)
├── frontend/                       # Vite + React 18 + Tailwind SPA
│   ├── src/
│   │   ├── api/                    # Typed API client, auth, surveys, public API
│   │   ├── context/                # AuthContext (JWT session management)
│   │   ├── components/
│   │   │   ├── ui/                 # Accessible primitives (Button, Input, Modal, etc.)
│   │   │   ├── survey-builder/     # Dnd-kit list, QuestionCard, ConditionEditor
│   │   │   ├── survey-form/        # SurveyForm, QuestionRenderer, RatingInput
│   │   │   └── analytics/          # Recharts QuestionChart & ResponsesTable
│   │   └── pages/                  # Login, Surveys, Builder, Analytics, Public, Thanks
│   └── tests/                      # 11 component & client unit tests (Testing Library)
├── docs/
│   ├── API.md                      # OpenAPI-lite REST API specification
│   ├── DEPLOYMENT.md               # Step-by-step Atlas + Render + Vercel deployment guide
│   ├── DEMO_SCRIPT.md              # 4-minute demo video recording script
│   ├── PHASE1_HANDOFF.md           # Phase 1 architecture & verification notes
│   └── SUBMISSION_CHECKLIST.md     # Assignment checklist & email template
├── render.yaml                     # Render backend deployment blueprint
└── vercel.json                     # Vercel frontend SPA rewrite configuration
```

---

## 🚀 Quick Start (Local Setup)

### 1. Clone & Install
```bash
git clone https://github.com/<YOUR_USER>/survey-builder-aigeeks.git
cd survey-builder-aigeeks
npm install
```

### 2. Configure Environment
```bash
# Copy backend environment template
cp backend/.env.example backend/.env

# Copy frontend environment template
cp frontend/.env.example frontend/.env
```

### 3. Build & Run Tests
```bash
# Build all packages (shared, backend, frontend)
npm run build

# Run all 60 automated tests across workspaces
npm test
```

### 4. Seed Database
Make sure MongoDB is running locally (or supply a cloud `MONGODB_URI` in `backend/.env`):
```bash
# Creates admin (admin@aigeeks.io / AdminPassword123!) + "Customer Feedback" Demo Survey + 25 Sample Responses
npm run seed
```

### 5. Start Development Servers
Open two terminal tabs:
```bash
# Tab 1: Start Backend API (runs on port 5000 with tsx watch)
npm run dev:backend

# Tab 2: Start Frontend Application (runs on port 5173 with Vite)
npm run dev:frontend
```
- Open `http://localhost:5173/login` in your browser.

---

## 📡 REST API Summary

Full API specification with request/response examples is documented in [docs/API.md](docs/API.md).

| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | None | API health status |
| `POST` | `/api/v1/auth/login` | None | Admin login $\rightarrow$ `{ token, admin }` |
| `GET` | `/api/v1/auth/me` | Bearer JWT | Current admin profile |
| `POST` | `/api/v1/surveys` | Bearer JWT | Create survey |
| `GET` | `/api/v1/surveys` | Bearer JWT | List surveys with response counts |
| `GET` | `/api/v1/surveys/:rootId` | Bearer JWT | Get survey schema for editing |
| `PUT` | `/api/v1/surveys/:rootId` | Bearer JWT | Update survey (in-place or auto-version) |
| `PATCH` | `/api/v1/surveys/:rootId/status` | Bearer JWT | Change status (`published` / `closed`) |
| `DELETE`| `/api/v1/surveys/:rootId` | Bearer JWT | Delete survey, all versions & responses |
| `GET` | `/api/v1/surveys/:rootId/analytics` | Bearer JWT | Aggregated analytics (`?version=all` or specific) |
| `GET` | `/api/v1/surveys/:rootId/responses` | Bearer JWT | Paginated raw responses |
| `GET` | `/api/v1/public/surveys/:rootId` | None | Public survey schema (404 for draft/closed) |
| `POST` | `/api/v1/public/surveys/:rootId/responses` | None | Submit public response |

---

## 🏛️ Architecture Decisions

### 1. Monorepo with Single Source of Truth (`shared/`)
- **Decision**: Schema validation (`validateSurveySchema`), conditional visibility evaluation (`isQuestionVisible`), and response payload verification (`validateResponse`) are written once in a pure TypeScript package (`@survey/shared`).
- **Why**: Eliminates logic duplication between client and server. The frontend uses the shared engine for instant user feedback and stale answer removal, while the backend executes the exact same engine to guarantee data integrity.

### 2. Schema as JSON + Separate Response Collection
- **Decision**: Survey schemas are stored as JSON arrays in MongoDB documents under the `Survey` collection. Responses are stored as individual documents in a separate `Response` collection keyed by `rootId` and `version`.
- **Why**: Allows flexible, nested survey structures without rigid SQL migrations, while keeping response queries fast, indexable, and horizontally scalable.

### 3. Survey Versioning Strategy
- **Decision**: If a survey has **zero responses**, updates modify the existing document in place. Once a survey receives **$\ge 1$ response**, any schema edit sets the current document's `isLatest` flag to `false` and creates a new document with `version = currentVersion + 1` and `isLatest = true`.
- **Why**: Prevents breaking historical analytics. Responses submitted under version 1 remain matched with version 1's questions, while future respondents receive version 2.

### 4. DAG Conditional Dependency Model
- **Decision**: Question conditions are restricted to referencing questions that appear **earlier** in the survey question array.
- **Why**: Mathematically guarantees a Directed Acyclic Graph (DAG), making circular dependencies ($A \rightarrow B \rightarrow A$) impossible. Reordering is re-validated instantly, preventing broken execution chains.

### 5. Layered Backend Architecture
- **Decision**: Strict separation of concerns: `Routes $\rightarrow$ Controllers $\rightarrow$ Services $\rightarrow$ Models`. Controllers remain thin request parsers; business logic lives entirely inside service modules.
- **Why**: Maximizes testability, readability, and maintainability.

### 6. React Query for Server State
- **Decision**: `@tanstack/react-query` manages server state, caching, and background invalidation on the frontend.
- **Why**: Avoids boilerplate Redux stores, eliminates out-of-sync UI states, and automatically refetches fresh analytics upon submission.

---

## ⚖️ Assumptions & Trade-offs

1. **At Most One Condition Per Question**:
   - *Trade-off*: Questions support a single condition `{ questionId, operator, value }`.
   - *Rationale*: Keeps the builder UI clean and accessible for non-technical admins while preventing complex boolean logic trees ($AND/OR$ nesting).
2. **No Partial-Response Draft Saving**:
   - *Trade-off*: Public survey responses must be submitted in full. Partial drafts are intentionally not persisted.
   - *Rationale*: Eliminates orphaned records and keeps public submissions privacy-friendly and spam-resistant.
3. **Analytics Text Capping**:
   - *Trade-off*: Text question analytics returns the latest 200 responses with a `hasMore: boolean` indicator.
   - *Rationale*: Protects server memory and network bandwidth from unbounded payload sizes. Raw historical submissions can be queried via paginated API endpoints.
4. **In-Memory Rate Limiting**:
   - *Trade-off*: `express-rate-limit` runs in Node.js process memory.
   - *Rationale*: Avoids an external Redis dependency for single-instance review and local evaluation. (In a multi-instance production cluster, backing the limiter with Redis is recommended).
5. **JWT in `localStorage`**:
   - *Trade-off*: JWT tokens are stored in `localStorage` rather than an `httpOnly` cookie.
   - *Rationale*: Simplifies cross-origin deployment between decoupled hosting providers (e.g. Vercel frontend + Render backend) without requiring shared apex domains.

---

## 🔮 Future Improvements

- **Redis-Backed Rate Limiting**: Centralized sliding-window counters for multi-instance horizontal scaling.
- **CSV & Excel Export**: One-click download of all raw survey responses in spreadsheet format.
- **Rich Media Questions**: Image and file upload question types via S3/Cloudflare R2.
- **Nested Branching Logic**: Composite $AND/OR$ condition groups for advanced enterprise workflows.
- **Webhook Integrations**: Real-time notifications dispatched to Slack or Zapier on survey completion.

---

## 🧪 Testing Summary

Run the comprehensive test suite from the repository root:
```bash
npm test
```
- **Shared Logic**: 27 unit tests verifying condition evaluation, visibility chains ($A \rightarrow B \rightarrow C$), reordering cycles, and response dropping.
- **Backend API**: 22 integration tests verifying JWT authentication, CRUD operations, survey versioning, draft/closed status guards, submit rate limits, and analytics calculations using an in-memory MongoDB server.
- **Frontend**: 11 unit and component tests verifying `SurveyForm` dynamic visibility, error focus management, builder condition logic, and 401 token purging.

---

## 📄 License
MIT
