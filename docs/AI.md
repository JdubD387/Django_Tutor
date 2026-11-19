# Optional AI

The core app has no AI dependency. Every page bootstrap clears session credentials and returns to Disabled. The server never reads `GEMINI_API_KEY` or another owner key. Opening lessons, saving code, checking knowledge and viewing the runtime state make no provider requests.

## Cloud: Gemini BYOK adapter

In Settings choose Cloud, supply your own Gemini API key and model ID, then explicitly enable the connection. The key travels over the tutor's same-origin API and is held in that server process's memory for this one browser session. It is never returned, logged, written to IndexedDB, or shared through an application-wide environment variable. Host the tutor over HTTPS before entering a real key on any remote deployment.

Connection test uses `GET https://generativelanguage.googleapis.com/v1beta/models/{model}` to check model metadata and text-generation support. It does not generate text. Optional model discovery uses `GET /v1beta/models?pageSize=100`. Sending a question uses `POST /v1beta/models/{model}:generateContent` and **may incur provider charges**. The adapter limits input, output, request rate and request duration; those limits do not promise a monetary budget.

Official current documentation lists `gemini-3.8-flash` and other models; enter a supported model your key can access. Availability can change and is checked with the metadata test. One provider is implemented behind an adapter interface; additional providers can be added without coupling lessons to AI.

Only the question and the current lesson's public title and objectives are sent by default. Project code is included only if the learner explicitly selects the optional sharing control for the active file. Do not include secrets in files shared with a model. The model can explain and suggest; it has no file-writing, execution, shell, or tool interface. Answers render as text, not executable HTML. Core error help and prewritten hints work with AI disabled.

Disable clears the credential immediately. Reloading clears it, server restart loses it, and inactive server sessions expire after 30 minutes (with an eight-hour absolute bound). No credential persistence or account authentication is implemented. The first version uses a bounded in-memory session store; multi-process hosting would require an appropriately secure session design and is not supported by this implementation.

**Verification:** API tests use mocked provider responses to verify consent gates, session isolation, metadata versus generation, bounded requests, and safe error messages. No live cloud request was made and no working-key/model entitlement or billing outcome has been verified.

## Local: unavailable integration boundary

Local mode is explicitly unavailable. A hosted server cannot reach a learner's Ollama on their computer merely by accepting a localhost URL. This app does not send browser-to-local requests, disable CORS/TLS protections, accept arbitrary proxy destinations, or suggest exposing an unrestricted Ollama endpoint.

A future integration should use an explicitly installed authenticated companion with restricted origin pairing, user consent, short-lived credentials, limited local endpoints, model discovery and timeouts. It requires a separate browser/network security review and real connection tests before being enabled. A failed or unavailable AI connection never blocks lessons or editing.

## Sources

- [Gemini GenerateContent API](https://aistudio.google.com/api-reference/generate-content)
- [Model metadata API](https://aistudio.google.com/api-reference/models)
- [Current Gemini model guide](https://aistudio.google.com/docs/models)

These were inspected during implementation on 2026-11-18. The code uses the documented GenerateContent REST contract; no provider SDK or automatic owner credential discovery is used.
