# Forma Booth Studio

An **AI-assisted side project** for designing exhibition booths in an interactive 3D editor, preparing branded concept PDFs, and collecting feedback on saved revisions.

Built iteratively with assistance from OpenAI Codex/ChatGPT for implementation, debugging, tests and documentation. AI assistance does not imply that the code or generated specifications have been independently audited. This is an experimental local MVP, not a production service or validated print-production tool.

## Features

- Booth dimensions in millimetres, modular panels, individual panel widths and half-height walls.
- Artwork uploads, furniture and self-contained GLB model imports.
- Click-to-select and drag-to-move, grid snapping, rotation, undo/redo and precise numeric positioning.
- A starter library with shelves, plinths, flyers, overhead banners and pull-up banners; selected props accept artwork.
- Exhibition-hall and plain-studio settings, orbit and walk views.
- Company-branded concept PDFs with multiple views and an optional technical specification appendix.
- Local named projects, duplication, archiving, backup import/export and browser recovery drafts.
- Frozen review revisions with feedback, change requests, concept approvals and revocable local links.
- A clearly labelled Free/Studio plan demo. No payments or real subscriptions.

## Quick start

Requires **Node.js 20 or newer**, npm and a modern browser with WebGL.

```sh
npm ci
npm run build
npm start
```

Open **http://localhost:4174/**. Keep the terminal running. Stop with Ctrl+C.

To check the project:

```sh
npm test
npm run build
```

`npm run dev` and `npm run local` also start the local server. Rebuild after changing JavaScript source. `PORT=4180 npm start` changes the port; browser recovery storage is separate for each origin/port.

## Try a design

1. Choose booth dimensions and panels under **Space**.
2. Add wall artwork and equipment, or use **My projects & library → Library**.
3. Click and drag objects; use **Furnish** for dimensions, height and rotation. Drag empty space to orbit. Escape cancels a move.
4. Click **Save project** to save to My projects. Browser recovery autosave is separate from this named save.
5. Use **Brand & present** to customise and export a concept PDF.
6. Use **Share design → Save & create review link** to freeze a version for local review.

Import `examples/sample-project.json` using **Import backup** for a clean example without customer assets. A new imported backup is treated as an independent draft.

## Local storage and sharing

The Node server binds to `127.0.0.1`. It stores projects, revisions, review events and demo plan selection in `.local-data/reviews.json`. Back up that directory privately. `FORMA_DATA` can point to another private data directory.

Browser IndexedDB stores the working recovery draft. Download JSON backups for portable copies; they may contain original artwork and models.

**Review links work only on the same computer while this server is running.** All local visitors share one workspace. There are no accounts, owner permissions or verified reviewer identities. Do not expose or tunnel this server publicly. Deploying it safely requires authentication, access controls, upload/storage limits and operational hardening.

Each review records a frozen snapshot. The latest approval/change request sets that revision's status; ordinary comments do not change it. Editing a saved design makes the current project Draft without changing earlier approvals. Names are self-declared, and recorded approval is neither a verified signature nor production sign-off. Revocation cannot recall downloaded or already loaded data.

GitHub hosts the source code. **GitHub Pages cannot run the Node saving/review backend.** No deployment is configured in this repository.

## Dimensions and production limits

The model uses millimetres; the renderer converts to metres. Wall specifications distinguish:

| Measurement | Provisional rule |
| --- | --- |
| Nominal frame | Configured panel width and height |
| Visible print area | Nominal minus twice the frame inset |
| Cut size | Visible area plus twice the finishing allowance |
| Artwork canvas | Cut size plus twice the bleed |
| Safe area | Visible area minus twice the safe inset |

These symmetric allowances and butt-joint assumptions must be checked against the supplier's actual system. PDFs are **concept/review documents, not validated print-ready artwork**. Drawings are not guaranteed to print to scale. No colour preflight, cut paths, structural assessment, installation approval or accessibility certification is provided.

Banner and prop artwork is a cropped concept texture. These objects do not generate production print templates. Overhead banners have no specified support/rigging system. Imported model dimensions must be checked by the user. Collision warnings are approximate; dragging does not prevent overlaps or leaving the booth, and walking has no collision physics.

## Upload limits

- Wall artwork: PNG/JPEG, up to 8 MB.
- Company logos and library prop artwork: PNG/JPEG, up to 2 MB.
- Models: embedded, uncompressed GLB 2.0; 10 MB each, 12 models and 30 MB total per project. External resources, Draco/Meshopt and KTX textures are unsupported.
- Project requests/imports: up to 60 MB. Each revision stores a full snapshot, so disk usage grows.

Large projects can exhaust browser or disk storage. The local server is a prototype, not a hardened file-processing service. No customer assets are included in the sample or repository package.

## Source layout

| File | Responsibility |
| --- | --- |
| `app.mjs` | Editor, rendering and PDF export |
| `geometry.mjs` | Panel geometry, allowances and project validation |
| `models.mjs`, `library.mjs` | GLB validation/loading and generated library models |
| `dragging.mjs`, `environment.mjs` | Scene interaction and decorative venue |
| `editing.mjs`, `saving.mjs` | Undo history, browser recovery and save status |
| `collaboration.mjs`, `workspace.mjs` | Project/review UI and review status |
| `server.mjs` | Loopback-only local persistence and review API |
| `branding.mjs`, `share.mjs` | Proposal settings and legacy snapshot compatibility |
| `dist/index.html`, `dist/style.css` | Maintained UI source |
| `dist/app.js` | Generated JavaScript bundle; excluded from Git |

Dependencies: Three.js, jsPDF and esbuild. Google Fonts is optional; system fonts are the fallback. Tests cover geometry, imports, sharing, history, branding, project persistence, review states, conflict detection, dragging and save status. GitHub Actions runs the test suite and build; browser/visual QA remains manual.

## Roadmap

- Top-down editing and tabletop placement.
- More accessible and responsive controls, clearer placement warnings.
- Review-specific approval information in exported PDFs.
- Broader browser and complete customer-journey testing.
- Optional authenticated hosting/cloud storage, only after local validation.

## Contributing and licensing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development checks and [SECURITY.md](SECURITY.md) for the local-only security model.

No open-source licence has been selected yet. Package metadata is `UNLICENSED`; public visibility is not a grant of reuse rights. Select and add a licence before presenting this as an open-source release. Third-party dependencies retain their respective licences.
