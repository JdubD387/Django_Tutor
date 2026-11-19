# Django execution boundary

**Status: external adapter implemented; real Python/Django execution NOT implemented or verified.** Docker's daemon was unavailable in this workspace. No learner code is executed by Node or by this development host. A quiz is a knowledge check, never evidence that Django ran. Lessons with coding requirements remain pending until a trusted external check succeeds.

## Connecting a separately operated service

1. Implement and security-review an isolated runner meeting the contract below. Do not expose a Python subprocess in the web backend or a public inadequately isolated runner.
2. Give the web backend `RUNTIME_SERVICE_URL` (HTTPS API base), `RUNTIME_SERVICE_TOKEN` (private service credential), and `RUNTIME_PREVIEW_ORIGIN` (an exact, different HTTPS origin). Supply these through the environment; never through learner settings or browser storage. `APP_ORIGIN` must match the hosted tutor's HTTPS origin, without credentials, a path, query, or fragment. Origins are normalized before isolation comparisons, including hostname case and default ports; a trailing slash is accepted.
3. Restart the web app. The status route will actually contact the service. No configured URL is treated as evidence the runner is available.
4. Perform the real workflow: edit a view, start, inspect actual response in the sandboxed preview, run trusted checks, stop, and verify service-side process/filesystem cleanup. This has not been performed here.

The app never accepts a learner-supplied backend address, shell command, command arguments, runtime session identifier, or trusted test source. Files are text-only, limited to 40 safe relative paths, 64 KiB per file, 256 KiB total. These limits are an application boundary, not a substitute for runner isolation.

## Service contract, version 1

All service requests carry `Authorization: Bearer <private service token>` and JSON. The server assigns each browser session a random runtime UUID that learners cannot choose. The service must bind its projects to that UUID and authenticate every API call. Do not accept arbitrary session IDs from preview visitors.

- `GET /v1/sessions/{uuid}`: status (must not implicitly execute or create a project).
- `POST /v1/sessions/{uuid}/actions`: body `{ "action": "start|stop|restart|test|migrate|check", "files": { "polls/views.py": "..." }, "lessonId": "urls" }`.

Allowed actions map to controlled service implementations: start/stop/restart the project server, `python manage.py test` for learner tests, `python manage.py makemigrations polls` then `python manage.py migrate` for Apply migrations, and the service's **trusted external lesson tests** for `check`. `test` alone must not complete a lesson. No shell interpolation or arbitrary management commands.

Return JSON with `available` boolean, `status` (`unavailable|stopped|running|error`), `message`, `output` (captured real output), optional `previewUrl`, and optional trusted `verification`. Running status must include a preview URL at the configured preview origin. Use an unguessable, short-lived, session-specific preview capability path; never embed service credentials in URLs. The app does not proxy learner output through its own origin. The preview iframe uses a restrictive sandbox.

`verification` is accepted only for `check`, with `kind: "runtime"`, the requested `lessonId`, `passed`, nonempty `results` (`id`, `label`, `passed`, `feedback`), and ISO `checkedAt`. `passed` must equal the conjunction of result outcomes. The app cannot prove a dishonest service ran its tests; review and trust of the service are required.

Web calls time out at 8 seconds for status and 25 seconds for actions; services should acknowledge long jobs safely within that window. Responses are bounded to 1 MB and log output to 200,000 characters. Redirects are rejected. Fetch failures return a visible unavailable/error state without fabricated logs, tests, or previews.

## Required runner isolation before enabling publicly

The following are obligations for the external service, **not controls implemented by this repository**:

- Separate sandbox per session, unprivileged user, no host mounts, no application secrets or service token in learner environments; trusted tests outside writable project paths.
- CPU, memory, process-count, output, disk, execution time and session lifetime limits; kill all descendants on stop, timeout, expiry and disconnect. Enforce idempotent cleanup and a short runner TTL even if the web session disappears without a stop call.
- Deny outbound network by default, restrict inbound to the isolated preview, no package installation or arbitrary shell API. Defend metadata endpoints and internal addresses.
- Strict file path/symlink validation, writable temporary project directory only, read-only base image, ephemeral database, validated archive extraction if introduced.
- Preview isolation per session, no tutor cookies or credentials on the preview domain; prevent cross-session preview access, service workers, origin confusion and retained malicious content.
- Trusted behavioral tests should verify views/routes/templates/model behavior and accept equivalent implementations. Required model migrations and data tests must actually run in the isolated environment.

Until these are implemented and verified, keep runtime configuration unset. The local learning/editor/progress workflow remains useful without a runner.
