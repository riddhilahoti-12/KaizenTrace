# KaizenTrace — Evidence-Based Software Incident Investigation Tool

KaizenTrace is a lightweight, evidence-based software incident investigation tool integrated with **TeamFlow**, a full-stack project management application.

When code regressions or runtime failures occur in TeamFlow, KaizenTrace captures real application evidence, correlates it against a known-good Git baseline and MongoDB events, isolates the root cause file and line, recommends a targeted patch, and automatically reruns verification tests to prove recovery.

---

## 🏛️ Monorepo Architecture & Directory Structure

Both applications reside in a single repository with clear separation:

```text
kaizentrace/
├── apps/
│   ├── teamflow/               # Target application in which bugs occur
│   │   ├── backend/            # Express, Node.js, TypeScript, Mongoose (Port 5000)
│   │   ├── frontend/           # React, Vite, TypeScript (Port 5173)
│   │   ├── docs/               # Architecture and scenario documentation
│   │   └── package.json
│   └── kaizentrace/            # Investigation & diagnostic tool
│       ├── backend/            # Express, TypeScript, Mongoose, Git engine (Port 5050)
│       ├── frontend/           # Clean, light-only React investigation UI (Port 5174)
│       └── package.json
├── package.json                # Root orchestration scripts
├── .env.example                # Unified environment template
├── .gitignore                  # Clean exclusions (node_modules, dist, logs, etc.)
└── README.md                   # System documentation & live demo guide
```

### Communication Architecture
- **TeamFlow** runs on `http://localhost:5000` (Backend API) and `http://localhost:5173` (Frontend).
- **KaizenTrace** runs on `http://localhost:5050` (Backend API) and `http://localhost:5174` (Frontend Dashboard).
- **Telemetry Layer**: TeamFlow includes an isolated, non-blocking telemetry reporter (`telemetryReporter.ts`). If an error, database failure, or unhandled exception occurs, it asynchronously notifies `POST http://localhost:5050/api/events`. If KaizenTrace is offline, TeamFlow remains completely unaffected and will not crash.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ or v20+
- **Git**: Installed and available in PATH
- **MongoDB**: MongoDB Atlas connection string (or use the built-in zero-config in-memory MongoDB)

### 2. Installation
Run from repository root:
```powershell
npm install
npm --prefix apps/teamflow/backend install
npm --prefix apps/teamflow/frontend install
npm --prefix apps/kaizentrace/backend install
npm --prefix apps/kaizentrace/frontend install
```

### 3. Running All Services
Start all 4 services concurrently in one command:
```powershell
npm run dev
```

Or run individual applications:
```powershell
# Run TeamFlow only
npm run dev:teamflow

# Run KaizenTrace only
npm run dev:kaizentrace
```

### 4. Port Allocations
| Service | Role | Local URL |
| :--- | :--- | :--- |
| **KaizenTrace Dashboard** | RCA & Incident Investigation UI | `http://localhost:5174` |
| **KaizenTrace Backend** | Git Engine & Telemetry Collector | `http://localhost:5050` |
| **TeamFlow Frontend** | Project Management App | `http://localhost:5173` |
| **TeamFlow Backend** | Express REST API | `http://localhost:5000` |

---

## 🍃 MongoDB Atlas Configuration

KaizenTrace supports MongoDB Atlas as well as an automatic embedded fallback for local testing.

1. Copy `.env.example` to `.env`:
   ```powershell
   cp .env.example .env
   ```
2. In `apps/kaizentrace/backend/.env`:
   ```env
   PORT=5050
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/kaizentrace?retryWrites=true&w=majority
   ```
3. If `MONGODB_URI` is omitted or set to `memory`, KaizenTrace automatically launches an embedded in-memory MongoDB instance and marks the status in the UI as:
   `In-Memory Test Mode (Atlas Not Configured)`

---

## 🧪 Running Automated Tests

Run the complete test suite across both applications:
```powershell
npm test
```

Or run tests individually:
```powershell
# Run TeamFlow Vitest suite (11 scenario tests)
npm run test:teamflow

# Run KaizenTrace Vitest suite (diagnostic & API tests)
npm run test:kaizentrace
```

---

## 🎬 Live Demonstration Workflow (Step-by-Step)

Follow this sequence to demonstrate live incident detection, root-cause investigation, and verified auto-recovery:

### Scenario A: Permission Regression
1. **Healthy State**:
   - Open KaizenTrace at `http://localhost:5174`.
   - Click **Run Diagnostics**. KaizenTrace runs the test suite; all tests pass cleanly (**PASS** status recorded in timeline).
2. **Introduce Regression**:
   - In KaizenTrace UI, click **Demo Scenarios** in the header.
   - Click **Inject Permission Bypass** (or toggle `TEST_DISABLE_PERMISSIONS=true` in `apps/teamflow/backend/.env`).
   - This bypasses the role check in `apps/teamflow/backend/src/middleware/auth.ts`, allowing Viewers to perform unauthorized task updates.
3. **Detect Incident**:
   - Click **Run Diagnostics** on the KaizenTrace dashboard.
   - TeamFlow's regression test fails: `Should reject Viewer updating a task with 403 FORBIDDEN and preserve task state`.
   - KaizenTrace detects the regression, correlates working Git diffs against the baseline, and creates an incident.
4. **Inspect Root Cause**:
   - The UI displays:
     - **Observed Symptom**: `expected: 403, received: 200`
     - **Leading Hypothesis**: *Authorization check in apps/teamflow/backend/src/middleware/auth.ts was modified or bypassed.*
     - **Confidence Score**: `95%` (Rule-based stack trace and Git diff intersection).
     - **Target Suspect**: `apps/teamflow/backend/src/middleware/auth.ts:51`
     - **Live Git Diff**: Shows the modified lines in `auth.ts`.
     - **Supporting Evidence**: Vitest assertion error, captured stack frame, and Git hunk details.
5. **Review & Apply Fix**:
   - Click **Review & Apply Fix**. A preview modal opens showing the proposed patch.
   - Click **Confirm & Apply Fix**. KaizenTrace safely updates `auth.ts` and clears failure flags.
6. **Automatic Verification**:
   - Click **Run Verification Test**.
   - KaizenTrace executes the targeted Vitest command on TeamFlow.
   - The test passes with exit code 0.
   - The UI updates to **PASS**, and the incident status transitions to **RESOLVED**.

---

### Scenario B: Database Persistence Failure
1. In the **Demo Scenarios** drawer, click **Inject Persistence Failure**.
2. Click **Run Diagnostics**.
3. TeamFlow test fails with `500 DATABASE_ERROR`.
4. KaizenTrace correlates the database telemetry event (`DB_OPERATION: ERROR`) with `taskService.ts`.
5. Apply the fix and verify recovery.

---

### Scenario C: Background Job Failure
1. In the **Demo Scenarios** drawer, click **Inject Job Failure**.
2. Click **Run Diagnostics**.
3. Vitest catches the simulated network partition in `deadlineReminderJob.ts`.
4. KaizenTrace pinpoints `deadlineReminderJob.ts:45`.
5. Apply the fix and verify recovery.

---

## 🔒 Baseline & Safety Guarantees
- **TeamFlow-Scoped Git Diff**: Git analysis only inspects paths matching `apps/teamflow/`. Modifications to KaizenTrace or documentation are ignored during root-cause diagnosis.
- **No Destructive Operations**: KaizenTrace never executes `git reset --hard`, `git push`, or destructive file deletions.
- **Zero Simulation**: Every status (PASS/FAIL), stack trace, diff, and verification result displayed in the UI comes from actual process execution and MongoDB records.
