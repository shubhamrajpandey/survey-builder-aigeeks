# Dynamic Survey Application

A dynamic survey application built with Node.js/TypeScript, MongoDB, and React.

## Monorepo Architecture
- `shared/`: Pure TypeScript package containing core types, Zod schemas, visibility engine, and validation logic.
- `backend/`: Node.js + Express + TypeScript + Mongoose REST API.
- `frontend/`: (Phase 2) Vite + React + TypeScript + Tailwind CSS application.
- `docs/`: API specifications and phase handoff guides.

## Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp backend/.env.example backend/.env

# 3. Run shared unit tests and backend integration tests
npm test

# 4. Seed database (creates admin and demo survey with sample responses)
npm run seed:admin --workspace=backend
# or full seed:
npm run seed --workspace=backend

# 5. Start backend in development mode
npm run dev:backend
```
