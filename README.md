# Forma Booth Studio

An **AI-assisted side project** for designing exhibition booths in an interactive 3D editor, preparing branded concept PDFs, and collecting feedback on saved revisions.

Built iteratively with assistance from OpenAI Codex/ChatGPT for implementation, debugging, tests and documentation. AI assistance does not imply that the code or generated specifications have been independently audited. This is an experimental local MVP, not a production service or validated print-production tool.

## Features

- Booth dimensions in millimetres, modular panels, individual panel widths and half-height walls.
- Artwork uploads, furniture and self-contained GLB model imports.
- Click-to-select and drag-to-move, grid snapping, rotation, undo/redo and precise numeric positioning.
- A starter library with shelves, plinths, flyers, overhead banners, pull-up banners, reception podiums, timber-leg bar chairs, round bar tables and wall-mounted TVs; selected props accept artwork.
- Exhibition-hall and plain-studio settings, orbit and walk views.
- Downloadable 15- or 20-second 360° orbit videos, with preview and cancellation.
- Company-branded concept PDFs with multiple views and an optional technical specification appendix.
- Local named projects with automatic saving after edits pause, duplication, archiving, backup import/export and browser recovery drafts.
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
4. Click **Save project** once to create a named project. Later edits auto-save to My projects after about 1.5 seconds without changes; the browser recovery draft also continues saving.
5. Use **Brand & present** to customise and export a concept PDF.
6. Use **Share design → Save & create review link** to freeze a version for local review.

Import `examples/sample-project.json` using **Import backup** for a clean example without customer assets. A new imported backup is treated as an independent draft.

## Local storage and sharing

The Node server binds to `127.0.0.1`. It stores named projects, revisions, review events and demo plan selection in `.local-data/reviews.json`. Edits to a named project auto-save there after about 1.5 seconds of inactivity while the local server is running. This does not sync to another device or a cloud service. Back up that directory privately. `FORMA_DATA` can point to another private data directory.

Browser IndexedDB separately keeps the current recovery draft, including before a named project exists. The save status identifies browser recovery and named-project saves; failed saves remain visible, and version conflicts are surfaced instead of silently replacing another window's changes. Download JSON backups for portable copies; they may contain original artwork and models.

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
| `editing.mjs`, `saving.mjs` | Undo history, browser recovery, named-project auto-save state and save status |
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

## Record a 360° tour

Click **Video & screenshots**, choose HD (720p), Full HD (1080p) or 4K (2160p), select MP4 or WebM and choose 15 or 20 seconds. Keep the tab visible. Preview the video before downloading. Recording targets up to 30 fps; 4K needs more GPU power and can drop frames. MP4 is available only when the browser supports recording it; unsupported choices show a message instead of silently returning a different format. No audio, microphone, external encoder or server upload is used. Higher resolution is rendered directly from the 3D scene, not AI upscaling; it cannot recover detail missing from uploaded artwork.

The same dialog downloads PNG screenshots at the selected resolution, from the current view or front, back, left, right, top and perspective angles. Preset views frame the booth plus equipment; outer walls may occlude the interior.

Use **Lighting** for brightness, neutral/warm/cool light, direction and cast shadows. Settings save with projects and review snapshots and affect PDF views and media exports. **Setting** offers Exhibition hall, Plain studio, Dark backdrop and Sky backdrop; the latter two are colour backdrops, not new modelled venues.

Recording waits for model/artwork loading and uses a separate camera/renderer. Editor controls and selection outlines are excluded, and the editing camera is unchanged. The current hall/studio setting is included. Hidden tabs, cancellation or closing the dialog stop recording without offering a partial download. Unsupported browsers show an explanatory message. Download before reloading or starting another recording, as the preview exists only in memory.

This is a conventional orbit video, not interactive spherical/VR footage. Outer walls remain blank and may occlude the booth interior. Extremely large or outlying objects can make the framing wide or extend beyond the decorative hall. No branded video overlay, soundtrack or guaranteed MP4 conversion is provided. Automated tests cover format fallback and a complete camera orbit; browser checks completed 15-second WebM and Full HD MP4 recordings and a 3840 × 2160 PNG download.

### Reference-style furniture

The free library includes a white reception podium (front artwork supported), timber-leg bar chair, round pedestal bar table and wall-mounted TV. Select an item in Furnish to edit its dimensions in millimetres and base elevation. Unlock proportions to change individual dimensions. TV dimensions describe the outer casing, not the screen diagonal; placement is manual and does not follow wall edits. These are approximate concept models, not manufacturer specifications or verified mounting/print templates.


## Editing workflow

- **Furnish → Objects & layout:** click a name to select it; check multiple rows to group, ungroup, lock, unlock or align them. Groups translate together while dragging and when editing X/Z/base elevation. Rotation and scaling remain per item. Locking any member prevents moving the group. Duplicates start unlocked and ungrouped.
- Align checked objects to a common horizontal centre/depth or against a wall. Side-wall alignment requires that wall to be enabled. Alignment acts on checked items individually.
- **Place active item on:** choose a support and place the active item at its bounding-box top. This checks the rectangular footprint, not the actual support surface. Hollow shelves, irregular GLBs and grouped items need visual review; there is no persistent wall/table attachment or load validation.
- **Prop artwork:** replace PNG/JPEG artwork (up to 2 MB) or choose Blank surface on placed library podiums, plinths, flyers and banners. Edits preserve transforms and affect only that instance, including when a model is duplicated. Arbitrary uploaded GLBs do not expose editable artwork surfaces. Library asset limits still apply.
- **Saved views:** save up to 12 named camera positions, recall or remove them. Saved angles appear in the screenshot menu. They persist in project backups and review snapshots; the PDF uses its standard view set and orbit videos retain their standard path.
- **Viewer quality:** Fast editing uses one pixel per display pixel and disables viewport shadows. Quality editing restores higher display resolution and shadows. PDF, screenshot and video exports use their own settings.

Position, rotation, naming, organisation and lighting changes reuse scene geometry. Geometry/artwork edits still rebuild the scene; this is an incremental performance improvement, not a complete renderer rewrite. Group/lock state and saved cameras are optional fields, so older project files remain compatible. The built-in table's specified height is corrected to 770 mm to match its visible tabletop.

## Floating selection editor

Click a wall panel or item in the viewer to open its floating editor, or use the **Selection editor** header button. Wall size/layout and artwork share one panel. Items expose position, dimensions, prop artwork, model uploads and layout tools together. Drag the header to reposition it; use minus to collapse or × to restore the controls to the sidebar. The editor follows selection, uses existing validation and undo, and is unavailable in read-only review links.
