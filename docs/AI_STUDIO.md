# Google AI Studio handoff

This checkout was implemented locally because no Google AI Studio project was connected. Local testing does not establish that AI Studio preview works.

The React frontend and Node backend match the full-stack environment described in [Google's Build documentation](https://ai.google.dev/gemini-api/docs/aistudio-build-mode). That documentation also describes importing an existing GitHub repository and editing files in the Code tab. No repository was published or synced as part of this work.

## When an AI Studio project is available

1. Keep an unmodified copy of this checkout. If you choose the documented GitHub import workflow, first explicitly authorize the repository publication/synchronization step. This handoff does not perform it.
2. Import the approved repository into Build mode as a web app, or transfer the source through whatever file editing facilities your project supports. Preserve `package.json`, the lockfile, `shared`, `server`, `src`, and the Vite/TypeScript configuration together.
3. Install from the lockfile with `npm ci`. Start the full-stack server with `npm run dev`; it serves Vite and `/api` together on `PORT` (default 3000). Configure `HOST=0.0.0.0` only if the platform requires container-wide binding.
4. Set `APP_ORIGIN` to the exact HTTPS preview origin so same-origin/CSRF checks can operate. A runtime preview requires a separate configured HTTPS origin. Do not broaden origin policy to `*`.
   The current security headers allow framing only by the app itself, and its anonymous session cookie uses SameSite=Strict. If Studio embeds preview at a different origin, first review its actual parent origin and cookie behavior; a narrowly scoped trusted embedding/session configuration may be required. That platform integration is not implemented or verified here. Do not globally disable frame, cookie, or CSRF protections to make an iframe work.
5. Open the web preview and repeat the complete workflow: intro knowledge failure/correction/completion, edit/save, refresh recovery, lesson navigation, theme/editor settings, and AI-disabled operation.
6. Do not wire any automatically supplied `GEMINI_API_KEY` into the learner assistant. This application intentionally uses only a key explicitly provided by the individual learner for their session.
7. Keep Django runtime controls in the unavailable state until a separately approved isolated service satisfies [RUNTIME.md](RUNTIME.md) and actual execution, trusted tests, preview, stop, and cleanup have been demonstrated.
8. Independently test optional cloud assistance with an authorized learner key and local AI only after implementing a secure companion. Do not treat adapter unit tests as proof of real provider connectivity.

Do not select Publish, deploy to Cloud Run, provision paid services, or push/sync source without explicit approval. This project uses browser-local learning state; temporary preview filesystem storage is not learner persistence.
