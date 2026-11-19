# Development record — Django Tutor

## Lead plan, 2026-11-18

Empty Windows checkout; Node 26 and npm available. No connected Google AI Studio project. Implement a portable React/TypeScript + Node/Express application here; verify a local browser preview, and provide AI Studio import guidance without claiming AI Studio validation. Docker CLI exists but its daemon is unavailable. No untrusted Python will run on this host or in the web process. No deployment, paid provisioning, or Git push is authorized.

Architecture: React pages and CodeMirror editor -> browser IndexedDB persistence; curriculum is separate data; knowledge checks run deterministically and are explicitly distinct from behavioral Django tests. Express owns secure API routes and optional session-only BYOK mediation. External runtime adapter uses fixed administrator configuration, session ownership, command allowlist, and preview origin isolation. No runner is provisioned. Local AI remains an unavailable adapter until an authenticated companion is implemented. Cloud requests require explicit enablement and the learner's key; no environment API key fallback.

Components: App shell, Dashboard, Paths, Workspace (lesson / files / editor / results / preview), Settings, Assistant. A single polling project is shared across lessons; navigation never replaces edited files. Autosave plus explicit save, schema validation, storage failure visibility, and no reset without confirmation. AI secrets stay in server memory only and never in IndexedDB. AI enablement is reset on reload.

Curriculum targets Django 5.2 and official Django/Python sources. Intro project-map knowledge activity can complete without runtime. Lessons 2–4 include knowledge checks and code assignments; only trusted runtime verification may complete their coding objectives. All code exercise statuses stay pending when runtime is unavailable.

## Assignments

### TASK ID: DJT-001/006/010/011/012 — Backend and external boundaries
WORKER: backend specialist agent. CHECKER: frontend specialist after implementation, plus Lead integration review.
OBJECTIVE: Express/Vite foundation, secure session API, real external runtime contract adapter, optional cloud BYOK, local unavailable status, focused backend tests.
INPUTS: project brief, shared/types.ts, official provider docs.
DEPENDENCIES: package and shared contracts established by Lead.
CONSTRAINTS: no local Python execution, deployment, credentials in storage/logs, owner-key fallback, arbitrary shell or arbitrary remote endpoints.
FILE OWNERSHIP: server/**, docs/RUNTIME.md, docs/AI.md.
DELIVERABLES: runnable server, tests, accurate integration documentation.
DONE WHEN: safe no-runtime state; rejected unauthorized AI; no secret leakage; API tests pass; adapter tests explicitly labeled contract tests, never real Django evidence.

### TASK ID: DJT-003/005/008/009 — Curriculum and saved learning state
WORKER: curriculum/persistence specialist agent. CHECKER: backend specialist after implementation, plus Lead integration review.
OBJECTIVE: four beginner lessons, seven project milestones, incomplete starter project, deterministic knowledge verification, robust IndexedDB repository, unit tests.
INPUTS: official Django 5.2 tutorial and Python docs, shared/types.ts.
DEPENDENCIES: shared contracts.
CONSTRAINTS: preserve learner edits; never claim source scanning or quiz is Django execution; no secrets persisted; storage errors must preserve data.
FILE OWNERSHIP: src/lib/**, src/data/**, docs/CURRICULUM.md.
DELIVERABLES: curriculum, persistence and validation modules, tests.
DONE WHEN: initial meaningful activity passes/fails with feedback, runtime lessons cannot complete from quiz alone, saved files survive repository roundtrip, corrupt state is not silently overwritten.

### TASK ID: DJT-002/004/007-interface/013 — Frontend learning experience
WORKER: frontend specialist agent. CHECKER: curriculum specialist after implementation, plus Lead integration review.
OBJECTIVE: polished responsive dashboard, paths, editable workspace, settings, optional assistant, runtime unavailable state and real preview only when supplied by backend.
INPUTS: shared/types.ts and module contracts communicated by Lead.
DEPENDENCIES: curriculum/persistence and backend contracts; may develop in parallel against contracts.
CONSTRAINTS: AI disabled by default; no silently completed assignments; light/dark modes; accessible controls; actual CodeMirror editor; no external fonts or model calls on load.
FILE OWNERSHIP: src/App.tsx, src/main.tsx, src/styles.css, src/components/**.
DELIVERABLES: functional React UI and workflow evidence.
DONE WHEN: edit/save/check/retry/refresh works with AI disabled, navigation works, unavailable integrations clear, keyboard focus and mobile layout usable.

### TASK ID: DJT-013/014 — Integration and handoff
WORKER: Lead combining integration/testing/documentation roles. CHECKER: independent agents review corresponding modules; Lead grants final approval only after required corrections.
OBJECTIVE: integrate components, run typecheck/build/unit/API/browser verification, document actual evidence and limitations.
INPUTS: Worker and Checker reports.
DEPENDENCIES: above tasks.
CONSTRAINTS: maximum three submissions per review; no invented evidence or runtime completion claim.
FILE OWNERSHIP: root configs, README.md, docs/DEVELOPMENT.md; targeted integration fixes coordinated with owners.
DELIVERABLES: tested local app and handoff.
DONE WHEN: core workflow verified and limitations explicit; no public deployment or Git push.

## Phases and gates
1. Foundation + architecture/contracts (plan established).
2. First AI-independent lesson + editing/persistence.
3. Four-lesson curriculum + optional integrations and honest runtime boundary.
4. Independent Checker reviews + integration/browser/security verification.
5. Handoff with run instructions and unresolved external requirements.

Future backlog: accounts/sync, import/export, snapshots, more courses/providers, advanced debugging, collaboration/instructors/certificates/mobile expansion, public project deployment, GitHub integration. None provisioned.

## Current phase and approval scope

Phase 1 and the AI-independent Phase 2 project-map workflow are locally implemented and verified. Four lessons, the polling starter, optional settings, and external adapter portions of Phase 3 are included. Phase 4 local integration checks passed. Phase 5 local handoff is ready. Overall real-Django completion remains pending; no runtime or platform isolation is claimed.

Three actual independent specialist agents worked in parallel, combining the eight requested specialties. Each reviewed another agent's work. Lead-owned integration changes received an independent frontend-agent review. This was not a simulated separate-agent review.

## Worker and Checker reports

### Curriculum/persistence Worker report
TASK: DJT-003/005/008/009. SUBMISSION NUMBER: 1. STATUS: implemented.
IMPLEMENTED: four data-driven lessons, seven milestones, intentionally unfinished 13-file polling starter, deterministic knowledge feedback, separate runtime completion records, validated serialized IndexedDB saves.
FILES CREATED OR MODIFIED: `src/data/curriculum.ts`, `src/lib/**`, `docs/CURRICULUM.md`.
VERIFICATION: 9 focused tests passed; integration TypeScript check passed. Tests cover failure/retry/completion boundaries, save recovery, credential stripping, corrupt-state preservation, unsafe paths and concurrent saves.
KNOWN ISSUES OR BLOCKERS: same-browser storage only; multi-tab merge/conflict resolution absent; real Django execution unavailable.
READY FOR CHECKER: YES.

Checker report: TASK same; SUBMISSION REVIEWED: 1; RESULT: APPROVED by backend agent. REQUIREMENTS CHECKED: teaching sources/starter, completion boundary, persistence and data protection. EVIDENCE REVIEWED: source, tests, docs. CHECKS PERFORMED: independently reran 9/9 tests. PROBLEMS: no blocking defects. REQUIRED CHANGES: none. RESUBMISSION CONDITIONS: none. READY FOR LEAD: YES.

### Backend/runtime/AI Worker report
TASK: DJT-001/006/010/011/012. SUBMISSION NUMBER: 2. STATUS: implemented external boundaries.
IMPLEMENTED: unified Express/Vite server, production serving, anonymous session isolation, CSRF/origin checks, request/response/rate limits, safe file/action validation, external runtime adapter, Gemini session-only BYOK, disabled/local unavailable behavior.
FILES CREATED OR MODIFIED: `server/**`, `docs/RUNTIME.md`, `docs/AI.md`.
VERIFICATION: 13 backend tests pass. Mocked service/provider transport checks cover consent, metadata versus generation, session expiry/isolation, safe failures, fixed destinations and preview-origin validation. No live provider generation or Python/Django execution occurred.
KNOWN ISSUES OR BLOCKERS: external runner and local companion are not supplied; live cloud credentials not tested; single-process memory sessions; Studio iframe compatibility unverified.
READY FOR CHECKER: YES.

Checker report: TASK same; SUBMISSION REVIEWED: 1; RESULT: REJECTED by frontend agent. PROBLEMS: raw APP_ORIGIN comparison accepted a same-origin preview when the configured origin had a trailing slash. REQUIRED CHANGES: normalize and validate origin; add regressions. RESUBMISSION CONDITIONS: original bypass must fail and backend tests pass.

Checker report: SUBMISSION REVIEWED: 2; RESULT: APPROVED by frontend agent. REQUIREMENTS CHECKED: API/session/credentials/preview safety and honest scope. EVIDENCE REVIEWED: source/docs and original reproduction. CHECKS PERFORMED: bypass now rejected, 13/13 independent backend tests pass. PROBLEMS: none blocking implemented scope. REQUIRED CHANGES: none. READY FOR LEAD: YES.

### Frontend Worker report
TASK: DJT-002/004/007-interface/013. SUBMISSION NUMBER: 2. STATUS: implemented.
IMPLEMENTED: dashboard, path navigation, lessons/practice, CodeMirror with separate mounted open-file histories, file tabs/explorer, save/autosave, progress, light/dark/editor preferences, collapsible panels, unavailable execution states and consent-based optional AI UI.
FILES CREATED OR MODIFIED: `src/App.tsx`, `src/main.tsx`, `src/styles.css`, `src/components/{Workspace,Settings,Assistant}.tsx`.
VERIFICATION: TypeScript passes; Lead browser checks below verify full integration. Worker incorporated preliminary review fixes for milestone status, per-lesson code results, disabling regardless of invalid model input, question limits, accurate AI disclosure and migration command explanation.
KNOWN ISSUES OR BLOCKERS: external integrations remain explicitly unavailable/unverified; desktop prioritized, mobile panels stack/collapse.
READY FOR CHECKER: YES.

Checker report: TASK same; SUBMISSION REVIEWED: 1; RESULT: REJECTED by curriculum agent. PROBLEMS: instructional prose and several regular controls were too small. REQUIRED CHANGES: teaching body 16px, regular controls 14px. RESUBMISSION CONDITIONS: source rules and TypeScript must pass.

Checker report: SUBMISSION REVIEWED: 2; RESULT: APPROVED by curriculum agent. REQUIREMENTS CHECKED: navigation, editing/progress, runtime honesty, AI consent/privacy, typography, focus and responsive styles. EVIDENCE REVIEWED: all frontend modules/CSS and integration contracts. CHECKS PERFORMED: source inspection, independent TypeScript and 9/9 persistence/knowledge tests. PROBLEMS: no blocking source defects; browser gate assigned to Lead. REQUIRED CHANGES: none. READY FOR LEAD: YES.

### Lead integration Worker report
TASK: DJT-013/014. SUBMISSION NUMBER: 2. STATUS: local integration verified.
IMPLEMENTED: root build/configuration and handoff docs; workspace code splitting to reduce initial JS from about 1,014 KB to 377 KB; error boundary to retain shell/state after an editor download failure.
FILES CREATED OR MODIFIED: root configs/README, `docs/AI_STUDIO.md`, this record, `src/App.tsx`, `src/components/WorkspaceBoundary.tsx`.
VERIFICATION: production build passes including TypeScript; complete automated suite 22/22 passes; real browser workflows below.
KNOWN ISSUES OR BLOCKERS: deferred editor chunk remains about 638 KB (223 KB gzip). Vite reports a nonblocking chunk-size warning and strips two third-party Zod comment annotations. Studio/runtime/live AI verification remains outstanding.
READY FOR CHECKER: YES.

Checker report: root build/docs APPROVED by backend agent after independent successful build and source/doc inspection. Lazy workspace integration SUBMISSION 1 REJECTED by frontend agent because Suspense alone did not catch a failed download and sat outside the main landmark. SUBMISSION 2 APPROVED after an error boundary, saved-state-gated reload, overview recovery and main-landmark correction; independent TypeScript passed. No further required changes. READY FOR LEAD: YES.

## Actual verification evidence, 2026-11-18

- `npm test`: 3 files / 22 tests passed (13 backend + 9 knowledge/persistence). API tests require loopback socket permission; sandbox EACCES was resolved by running with approved local networking. This was not fixed by weakening application security.
- `npm run build`: TypeScript, Vite client and bundled Node server all passed. The final production server was started with `npm start` and checked in the browser.
- Real browser checks in the in-app Chromium browser: dashboard/path/workspace/settings navigation; unanswered and incorrect project-map answers; explanatory feedback; corrected answer -> introductory completion; code edit and explicit save; refresh -> same code, active file and progress recovered; URLs knowledge passed while code lesson stayed incomplete; actual unavailable preview and disabled controls; collapse/show lesson and explorer.
- Production editor checks: input, Ctrl+Z undo, Windows Ctrl+Y redo, history retained across file switching, and save. Test-only comment was undone on the clean localhost project.
- Settings checks: light/dark, 18px editor preference, local AI unavailable, missing-key enable button disabled, session cloud configuration with a synthetic test key (no provider test or generation requested), and disable succeeds after entering an invalid model. Actual provider connection was not tested.
- Responsive checks: 1440px desktop and 390px mobile, working mobile drawer navigation and collapsible workspace. Document width stayed within viewport. Teaching body computed to 16px. These are layout checks in Chromium, not proof of all browsers or assistive technology support.
- Actual failure injection: temporarily moved the generated editor chunk aside, opened production workspace, observed readable failure fallback with saved status and working overview navigation. Restored the exact chunk, refreshed, and successfully opened the real editor. No generated chunk remains withheld.
- Screenshots: `artifacts/django-tutor-dashboard.jpg`, `artifacts/django-tutor-workspace.jpg` (local review artifacts, ignored by Git).

No actual Django server, migration, trusted Django test, live runtime preview, local model, live cloud answer, or Google AI Studio preview was verified. Transport mocks do not satisfy those gates. No deployment, paid infrastructure, cloud generation charge, Git commit, or push was performed.

## Lead review

TASK: local implementation and handoff. CHECKER STATUS: approved after the corrections above.
ARCHITECTURE COMPATIBILITY: PASS for React/Node local stack and documented boundaries.
INTEGRATION STATUS: PASS for the AI-independent learning/editor/progress workflow; PENDING for real Django and Google AI Studio platform integration.
UNRESOLVED ISSUES: isolated runner/provisioning/security verification, Studio embedding/session configuration, secure local companion, live authorized cloud test, multi-tab conflict resolution and cross-device backups/sync.
FINAL DECISION: APPROVED for local core review; overall execution-dependent objective remains incomplete.
NEXT ACTION: follow README for local use; connect and review the external runtime using RUNTIME.md before marking coding workflows complete. Transfer to an approved AI Studio project and repeat platform checks. No external provisioning or publication is authorized by this review.

## Subsequent source-publication request

After the local handoff, the user explicitly requested committing and pushing this project to `https://github.com/JdubD387/Django_Tutor.git`. The destination was inspected and had no commits or branches; the initial source publication targets `main`. This authorization supersedes the earlier no-push restriction for this requested publication. Runtime provisioning, app deployment, and AI Studio integration remain outside this Git operation. The recorded build/test/browser evidence above is from the completed local implementation; no functional changes were made for publication.
