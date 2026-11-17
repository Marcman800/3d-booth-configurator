# Security model

Forma is a loopback-only local prototype. Everyone with access to its local server shares the same owner workspace. Review names are unverified. There is no authentication or production tenant isolation, and premium controls are demonstrations rather than secure entitlements.

Do not bind the server to public interfaces, expose it through a tunnel, or deploy it as a public service. Uploaded files and project snapshots are untrusted data; the existing validation is not a comprehensive security audit.

Defence-in-depth already in place: the server rejects requests whose `Host` is not `localhost`/`127.0.0.1` (blocks DNS rebinding), rejects cross-origin POSTs, and sends a Content Security Policy (scripts only from the app itself, no framing, no plugins), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` and `Referrer-Policy: no-referrer`. The policy allows Google Fonts stylesheets and font files; update `SECURITY_HEADERS` in `server.mjs` if the app starts loading anything from another host. Imported project images are checked against the same format, byte and pixel limits as uploads.

Keep `.local-data`, backups, uploaded assets and credentials out of Git. The SHA-256 snapshot digest is not a digital signature or tamper-proof audit trail. Storage is not encrypted by the app.

For a suspected vulnerability, do not attach private assets, credentials or exploit details to a public issue. No dedicated private reporting channel is configured yet; use GitHub private vulnerability reporting if the repository owner enables it.
