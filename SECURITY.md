# Security model

Forma is a loopback-only local prototype. Everyone with access to its local server shares the same owner workspace. Review names are unverified. There is no authentication or production tenant isolation, and premium controls are demonstrations rather than secure entitlements.

Do not bind the server to public interfaces, expose it through a tunnel, or deploy it as a public service. Uploaded files and project snapshots are untrusted data; the existing validation is not a comprehensive security audit.

Keep `.local-data`, backups, uploaded assets and credentials out of Git. The SHA-256 snapshot digest is not a digital signature or tamper-proof audit trail. Storage is not encrypted by the app.

For a suspected vulnerability, do not attach private assets, credentials or exploit details to a public issue. No dedicated private reporting channel is configured yet; use GitHub private vulnerability reporting if the repository owner enables it.
