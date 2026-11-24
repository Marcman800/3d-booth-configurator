# Contributing

This is an AI-assisted local prototype. Review and test all changes, including AI-generated code.

1. Use Node.js 22 or newer (`nvm use` picks the version in `.nvmrc`), then install with `npm ci`.
2. Run `npm test` and `npm run build`.
3. Run `npm run dev` (rebuilds on save) and check the affected workflow in a WebGL-capable browser.
4. For geometry, saving, sharing or PDF changes, check a full save/reopen/export cycle. For autosave changes, check browser recovery and named-project saving separately, including the visible failure/conflict state. Keep concept and production claims separate.
5. Describe the change, checks performed and remaining limitations in your pull request.

Do not commit customer artwork, models, project backups, `.local-data`, `.env` files or hosting credentials. Use synthetic fixtures. Do not publish test screenshots containing private information. Never expose the local server to the public internet for testing.

The project does not currently grant an open-source licence; resolve licensing with the owner before redistributing or reusing it.
