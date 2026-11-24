# Changelog

Notable changes to Forma Booth Studio, newest first. Dates are when the change set was committed.

## 2026-11-24 — Developer setup

No app or project-file changes.

- **Node 22.** Node 20 is past end-of-life. The project now requires Node 22 or newer, pins it in `.nvmrc`, and CI tests on Node 22 and 24.
- **`npm run dev` rebuilds on save.** It watches the source, rebuilds an unminified bundle with source maps, and restarts the server when server code changes. Build options live in `scripts/build.mjs`, shared with `npm run build`, which now clears old chunk files first.
- **No more `?v=` cache numbers.** The server sends ETags, so browsers pick up a new build on reload; hashed chunks are cached as immutable.
- **`.env` support.** `server.mjs` reads `PORT` and `FORMA_DATA` from an optional `.env` file (see `.env.example`); shell variables still win.
- **Dependencies.** esbuild moved to `devDependencies`. Dependabot opens grouped weekly npm updates and monthly GitHub Actions updates. CI cancels superseded runs.
- **Claude Code.** `.claude/launch.json` adds a `booth-studio` preview configuration.

## 2026-11-18 — Interface redesign

A less cluttered, easier-to-navigate editor. No project-file format changes; existing projects open as before.

### Navigation
- **Compact header.** The logo, an editable project name with save status, undo/redo icons, a **Project** menu (My projects, Save, Import backup, Download project file) and one **Share & export** menu (Concept PDF & package, Branded proposal, Video & screenshots, Share for review, Copy preview link). This replaces 13 separate header buttons.
- **Scene toolbar** on the 3D view: Setting, Orbit/Walk, Reset, Lighting, Views, Capture, Editor and rendering quality. Labels collapse to icons on narrower screens.
- **Selection panel.** The selected wall panel or item opens in a panel docked on the right, and the 3D view makes room for it. On phones it is a bottom sheet. Titles use readable names ("Back wall · panel 2", "Round bar table") instead of internal IDs.

### Sidebar
- Numbered step tabs (Space, Artwork, Furnish). The marketing heading is removed.
- The Space tab is grouped into collapsible **Booth size**, **Walls** and **Individual panels** sections.
- Long help text sits behind small ⓘ disclosures.
- The sidebar scrolls on its own; the header and 3D view stay fixed.

### Artwork and furniture
- **Wall strip.** A to-scale miniature of each wall's panels shows their colour or artwork; click a panel to edit it.
- **Library in the Furnish tab,** with search, category chips and compact cards with an Add button. The My projects dialog keeps only the demo-plan switch.
- Quick-add buttons and GLB uploads are in a collapsible group. Grouping, locking, alignment and placement are under **Arrange items**.
- All upload boxes accept **drag and drop**.

### Dialogs
- The Concept package dialog has **Export / Project details / Print allowances** tabs.
- Checks show as a short list: panels without artwork are grouped into one line, and items are shown by name.
- Exports appear as four clear cards.
- Every dialog has a ✕ close button in the top-right, and the intro text is shorter.
- The Video & screenshots dialog shows a **live preview of the opening frame** as the camera sliders move.

### First run and phones
- **Welcome screen** for an untouched new booth: Start a new booth, Open a saved project, or Try the sample. The server now serves `examples/sample-project.json` for this.
- **Phone layout.** The 3D view comes first, the steps are a bottom tab bar, the selection panel is a bottom sheet, and nothing scrolls sideways.

### Visual style
- Shared colour and spacing tokens, fewer borders, quieter secondary buttons with one primary action per area, larger and higher-contrast labels, and icons for common tools.

### For developers
- New `layout.mjs` arranges module-created buttons into menus and the toolbar and forwards clicks to them, so each action keeps one implementation. Buttons the menus call live in the hidden `#actionStash` in `dist/index.html`.
- `inspector.mjs` no longer moves the whole Furnish tab into the editor, and skips nodes marked `data-keep`.
- `collaboration.mjs` exports `mountLibrary(container)`.
- `dist/style.css` was rewritten around CSS custom properties. Cache versions are now `?v=11`.

## 2026-11-17 — Reliability, security and performance

- **Saves.** A failed disk write rolls back the server's in-memory state and reports the error. The server keeps three rotating backups (`reviews.json.1`–`.3`), recovers from a missing main file and refuses to start on a damaged one. Slow uploads no longer block other requests.
- **Imports.** Embedded artwork, logos and textures are checked against upload limits using their real image headers. Object IDs, names and positions are validated.
- **Security headers.** The server sends a Content Security Policy, `nosniff`, anti-framing and `no-referrer` headers.
- **Performance.**
  - Each edit is serialised once instead of three times.
  - Undo history tracks its size incrementally.
  - Models removed from a project are freed from memory.
  - The PDF library loads only on export, so the initial bundle drops from 1.56 MB to 737 KB.
- **Smaller changes.**
  - A new **Copy preview link** button creates `#view=` links.
  - The projects dialog shows disk usage.
  - The Lighting button is hidden in review and preview modes.
- Removed a broken nested `3d-booth-configurator` gitlink.

## 2026-11-17 — Audit fixes

- UTF-8 request bodies split across network packets are decoded correctly.
- An untouched draft is no longer saved as an empty named project.
- Dragging the panel colour picker adds one undo step.
- An unreadable browser draft is kept aside and can be downloaded.
- Review links are revoked by revision ID, so reviewers cannot disable them.
