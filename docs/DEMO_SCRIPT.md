# Demo Video Script (4 Minutes)

This script provides a concise walkthrough designed for recording the take-home assessment demo video.

**Recommended Setup**:
- Browser window with two tabs: Tab 1 for Admin Console (`/admin`), Tab 2 for Public Form (`/s/:rootId`).
- Chrome DevTools toggle device toolbar (iPhone 14 / 375px width) ready for Tab 2.
- Seed data loaded via `npm run seed`.

---

## ⏱️ Timeline & Segment Breakdown

### [0:00 - 0:30] Segment 1: Introduction & Admin Authentication
- **Action**:
  - Open `http://localhost:5173/login`.
  - Enter credentials: `admin@aigeeks.io` / `AdminPassword123!`.
  - Click "Sign In to Console".
- **Narrative**:
  > *"Hi, I'm presenting the dynamic survey application built for AiGeeks. The project is structured as an npm workspaces monorepo containing a shared TypeScript package, an Express & MongoDB REST API, and a React Vite frontend. I'll start by logging into the admin console with JWT authentication."*

---

### [0:30 - 1:15] Segment 2: Survey Builder & All 4 Question Types
- **Action**:
  - From the Dashboard, click "New Survey".
  - Change title to "Product Feedback 2026".
  - Add Description: "Gathering insights on our developer tooling."
  - Showcase the 4 question types:
    1. Q1: **Single Choice**: "Do you use our application daily?" $\rightarrow$ "Yes", "No".
    2. Q2: **Rating**: "Rate your satisfaction (1-5)".
    3. Q3: **Multi-Select (Checkbox)**: "Which features do you value?" $\rightarrow$ "Real-time Analytics", "Survey Builder", "Export".
    4. Q4: **Open Text**: "What can we improve?".
- **Narrative**:
  > *"In the survey builder, we can customize survey metadata and assemble questions across all four supported types: Single Choice with radio options, 1 to 5 Star Rating, Multi-Select Checkboxes, and Open-ended Text."*

---

### [1:15 - 1:45] Segment 3: Conditional Logic & Reordering Guard
- **Action**:
  - On Q2 (Rating), toggle "Show only conditionally...".
  - Set condition: Show if **Q1 equals Yes**.
  - On Q4 (Text), toggle "Show only conditionally...".
  - Set condition: Show if **Q1 equals No**.
  - Grab the drag handle on Q2 and drag it above Q1:
    - Point out the inline warning: *"Target question now appears after this question. Conditions can only depend on earlier questions."*
    - Notice that saving is blocked by the shared schema validation engine.
  - Drag Q2 back down below Q1: warning clears immediately.
- **Narrative**:
  > *"Now let's add conditional branching. Q2 should only be displayed if Q1 equals 'Yes'. Our validation engine enforces that conditions can strictly reference questions appearing earlier in the survey. If I drag Q2 above Q1, our engine detects the forward reference, highlights an error, and prevents invalid states from being saved."*

---

### [1:45 - 2:10] Segment 4: Live Preview Mode
- **Action**:
  - Click the "Live Preview" button in the top action bar.
  - In the preview modal, test clicking "Yes" on Q1 $\rightarrow$ Q2 appears instantly.
  - Switch Q1 to "No" $\rightarrow$ Q2 disappears and Q3 appears.
  - Close preview.
- **Narrative**:
  > *"Without having to leave the builder, admins can launch the Live Preview modal. This renders the exact same responsive SurveyForm component used on public pages, allowing instant verification of conditional flows."*

---

### [2:10 - 2:40] Segment 5: Publish & Mobile Public Form
- **Action**:
  - Click "Publish Survey". Toast confirms publication.
  - On the dashboard, click "Copy Link" for the new survey.
  - Open new browser tab or incognito window at `http://localhost:5173/s/:rootId`.
  - Press `Cmd + Shift + M` to switch to 375px mobile viewport.
- **Narrative**:
  > *"Once published, the survey is accessible to the public with zero login required. Opening the link in mobile viewport, notice the clean, responsive layout designed for small screens, along with an interactive progress bar."*

---

### [2:40 - 3:15] Segment 6: Public Submission, Drop Stale Answers & Validation
- **Action**:
  - Click "Submit Response" without selecting anything $\rightarrow$ shows inline error *"This question is required"*, scrolls to and focuses Q1.
  - Select Q1: "Yes" $\rightarrow$ Q2 rating reveals.
  - Rate 5 stars on Q2.
  - Now change Q1 to "No" $\rightarrow$ Q2 rating is hidden.
  - Fill Q4 text: "Waiting for mobile app".
  - Click "Submit Response".
  - Redirects to `/s/:rootId/thanks`.
  - Explain that Q2's 5-star rating was automatically dropped and never sent to the server.
- **Narrative**:
  > *"When submitting, our shared validation engine checks required visible fields. When we switch Q1 from 'Yes' to 'No', Q2 is hidden and its answer is dropped from state to avoid submitting stale data. The response submits successfully, displaying the thank-you screen."*

---

### [3:15 - 3:40] Segment 7: Real-Time Analytics & Raw Responses
- **Action**:
  - Return to Admin tab $\rightarrow$ navigate to Analytics for the seeded "Customer Feedback" survey.
  - Showcase:
    - Total Responses counter (26).
    - Horizontal bar chart with vote counts and percentage for choice questions.
    - Rating average (4.62 / 5.0) and 1-5 star distribution histogram.
    - Scrollable list of open text answers.
  - Click on the "Raw Submissions" tab to show the paginated response table.
- **Narrative**:
  > *"In the Analytics dashboard, metrics aggregate live. We see horizontal charts for single and multi-select questions, a star rating average with full distribution histogram, and a scrollable list of text responses. The raw submissions tab provides paginated records with timestamps."*

---

### [3:40 - 4:00] Segment 8: Architecture & Code Tour
- **Action**:
  - Briefly switch to IDE / code editor.
  - Highlight `shared/src/visibility.ts` and `shared/src/survey-validation.ts`.
  - Highlight `backend/src/services/survey.service.ts` versioning logic (`version + 1` if responses exist).
  - Conclude the demo.
- **Narrative**:
  > *"Under the hood, all visibility and validation logic lives in the @survey/shared package as a single source of truth used by both backend and frontend. Survey versioning preserves historical response integrity, and over 60 unit and integration tests verify the entire stack. Thank you!"*
