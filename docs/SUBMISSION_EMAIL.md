# AiGeeks Full-Stack Developer Assessment Submission

**Subject:** Full-Stack Developer Intern Assessment Submission — Dynamic Survey Builder — Shubham Raj Pandey

Dear AiGeeks Hiring Team,

I have completed the Full-Stack Developer Intern take-home assessment (Dynamic Survey Application). The project has been built from scratch, thoroughly audited, and verified across all core requirements and bonus architectural criteria.

---

### 🔗 Project Links & Credentials

- **GitHub Repository**: `https://github.com/shubhamrajpandey/survey-builder-aigeeks`
- **Live Application URL**: `<INSERT_LIVE_FRONTEND_URL>` *(e.g. https://survey-builder-aigeeks.vercel.app)*
- **Live API Endpoint**: `<INSERT_LIVE_API_URL>/api/v1` *(e.g. https://survey-builder-api.onrender.com/api/v1)*
- **API Health Check**: `<INSERT_LIVE_API_URL>/health`
- **Loom / Demo Video**: `<INSERT_DEMO_VIDEO_URL>`

#### Demo Admin Credentials
- **Email:** `admin@aigeeks.io`
- **Password:** `AdminPassword123!`

---

### 📋 Executive Summary (What Was Built)
1. **Core Features**: A monorepo architecture (`@survey/shared`, `backend`, `frontend`) featuring an admin survey builder (all 4 input types: single_choice, checkbox, rating, text), drag-and-drop reordering with cycle-safe conditional branching, dynamic public survey rendering with client/server validation and stale-answer dropping, and real-time analytical chart visualizations.
2. **Bonus Capabilities Delivered**: JWT authentication (12h expiry, bcrypt hashing), immutable survey schema versioning (existing responses stay permanently linked to original version schemas), and multi-layer anti-spam protection (honeypot trap, HMAC-SHA256 IP rate limiting, rapid duplicate suppression, and NoSQL injection protection).
3. **Quality & Engineering Bar**: 100% TypeScript strict mode, zero `any` types, zero lint errors, and 61 automated tests passing across 10 test suites (shared Zod schemas, backend in-memory Mongo integration tests, and frontend React Testing Library suites).

---

### 💻 Quick Local Run (Zero Friction)

```bash
git clone https://github.com/shubhamrajpandey/survey-builder-aigeeks.git
cd survey-builder-aigeeks
npm install
npm run seed     # Automatically creates admin and demo survey with 25 realistic responses
npm run dev:backend   # Starts API on port 5001 (auto in-memory Mongo fallback if local Mongo is not running)
npm run dev:frontend  # Starts React frontend on port 5173
```

Thank you for your time and review. I look forward to discussing the architecture and trade-offs during the interview!

Best regards,  
**Shubham Raj Pandey**  
Full-Stack Developer Intern Candidate
