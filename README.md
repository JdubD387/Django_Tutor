# Django Tutor

A full-stack browser application for learning Django through a guided polling project. React, TypeScript, CodeMirror, IndexedDB, and an Express backend. The educational core does not require an API key or AI.

## Run locally

Use Node.js 22.12 or newer and npm. From this directory:

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The single Node server serves both the frontend and API. To stop it, press Ctrl+C in that terminal.

Production build for local review:

```powershell
npm run build
npm start
```

Checks:

```powershell
npm run typecheck
npm test
```

No Python installation, Docker engine, account, cloud service, or AI key is necessary to use the lessons and editor. Python code execution requires a separate isolated runtime, described below.

## Use the learning environment

1. Open **Learning paths** and select **Introduction to Django**.
2. Read the objectives and explanations, inspect the polling project's files, and complete its knowledge check.
3. Review feedback, correct any answers, and check again. This initial activity can be completed with AI disabled and without executing Python.
4. Open the workspace to edit the project in CodeMirror. Use Save or Ctrl/Cmd+S; autosave also records changes in this browser.
5. Continue through URLs and Views, Templates, and Models and Databases. Their programming assignments remain pending until actual Django tests run through a verified external service. A knowledge check never substitutes for a passing code exercise.
6. Refresh to recover saved files, answers, and progress. Appearance and editor settings are available in Settings.

The editor supports undo/redo (Ctrl+Z / Ctrl+Y on Windows), file tabs, indentation, and Python/HTML highlighting. Use one editing tab at a time: cross-tab conflict resolution is not implemented.

Work is stored in IndexedDB for this browser profile and origin. It does not sync between devices, ports, or `localhost` and `127.0.0.1`. Private browsing, clearing site data, or browser eviction may remove it. Storage failures are shown rather than reporting a successful save. Keep important work copied elsewhere until project export is added.

## Integration status

| Capability | Status |
| --- | --- |
| Dashboard, learning paths, lesson content, editor, local progress | Implemented locally |
| Initial deterministic knowledge activity | Implemented; AI independent |
| Django execution, behavioral tests, migrations, live project preview | External adapter only; no isolated runner is provisioned or verified |
| AI Disabled mode | Default; no provider requests |
| Cloud AI | Optional session-only Gemini BYOK adapter; live credentials/service not verified here |
| Local AI | Explicitly unavailable until a secure local companion is implemented |
| Google AI Studio live preview | Not verified; no AI Studio project was connected in this session |

There is no fake terminal, Python interpreter, preview, or behavioral result. The runtime UI explains unavailability. See [runtime contract and isolation requirements](docs/RUNTIME.md), [optional AI and credentials](docs/AI.md), [curriculum](docs/CURRICULUM.md), and [development plan and review record](docs/DEVELOPMENT.md).

## Optional AI

Leave AI disabled for the full core experience. To try cloud assistance, explicitly select Cloud API in Settings, enter your own Gemini model and API key, and enable it. Connection testing uses provider metadata; sending a question may incur provider charges. Keys are held only in that server session's memory, never learner storage or the frontend bundle. Reload resets AI to Disabled. Sending the selected file requires a separate context opt-in. Assistant responses cannot edit files or run commands.

Local Model mode explains the remaining secure connection work. A hosted server cannot automatically reach Ollama on a learner's computer. Do not expose an unrestricted local endpoint to make it reachable.

## Architecture and deployment preparation

- `src/data/`: curriculum and the deliberately unfinished learner starter project.
- `src/lib/`: versioned browser persistence and deterministic knowledge checks.
- `src/components/` and `src/App.tsx`: learning interface and code workspace.
- `shared/types.ts`: common data and runtime contracts.
- `server/`: session/CSRF protections, request validation, runtime adapter, and optional provider mediation.

Learner files stay in the browser unless the learner explicitly starts a runtime action or shares the selected file with AI. The Node application never imports or executes learner Python. Runtime tests must be controlled by the external service and unavailable for editing in the file explorer.

Use HTTPS for any future hosted credential flow. Set the exact `APP_ORIGIN` and appropriate platform host/port. Runtime service endpoints and credentials are administrator configuration; learners cannot supply arbitrary backend fetch URLs. Review service isolation and preview origin requirements before enabling execution. In-memory anonymous sessions are for a single-process first version, not durable authenticated accounts or horizontally scaled deployment.

Nothing is deployed, published, provisioned, or pushed by the scripts in this repository. See [Google AI Studio handoff](docs/AI_STUDIO.md) for platform-specific preparation and verification still required.

Local verification passed: 22 automated tests, TypeScript/production build, and desktop/mobile browser learning/edit/save/refresh workflows. Independent Worker/Checker reviews and their corrections are recorded in [DEVELOPMENT.md](docs/DEVELOPMENT.md). Runtime and AI transport tests use explicit mocks; they do not prove live Django execution or model connectivity.
