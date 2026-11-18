// Page chrome: header menus, scene toolbar, docked selection panel, dialog tabs and drag-and-drop uploads.
// Feature modules create their own buttons; this module only moves them into place and forwards clicks,
// so every control keeps a single implementation.
const $ = id => document.getElementById(id);
const ICONS = {
  lighting: '<path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/><circle cx="12" cy="12" r="4"/>',
  views: '<path d="M3 7h3l2-3h8l2 3h3v13H3z"/><circle cx="12" cy="13" r="4"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
  editor: '<path d="M4 6h10M4 12h16M4 18h7"/><circle cx="17" cy="6" r="2"/><circle cx="14" cy="18" r="2"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

function findButton(text) {
  return [...document.querySelectorAll('header > button')].find(b => b.textContent.trim() === text);
}

// Replaces a button's visible content with an icon and short label, keeping a full accessible name.
function toolButton(button, name, label, title) {
  if (!button) return null;
  button.classList.add('tool');
  button.innerHTML = `${icon(name)}<span>${label}</span>`;
  button.title = title;
  button.setAttribute('aria-label', title);
  return button;
}

function installMenu(menu, items) {
  const trigger = menu.querySelector('.menuButton'), list = menu.querySelector('.menuList');
  const close = () => { list.hidden = true; trigger.setAttribute('aria-expanded', 'false'); };
  const open = () => {
    list.replaceChildren();
    for (const item of items) {
      if (item === '-') { list.append(Object.assign(document.createElement('hr'), {role: 'separator'})); continue; }
      const target = $(item.target);
      if (!target || target.hidden || target.disabled) continue;
      const entry = document.createElement('button');
      entry.setAttribute('role', 'menuitem');
      entry.innerHTML = `<b></b><span></span>`;
      entry.querySelector('b').textContent = item.label;
      entry.querySelector('span').textContent = item.hint || '';
      entry.onclick = () => { close(); target.click(); };
      list.append(entry);
    }
    // Drop leading, trailing and doubled separators left by hidden items.
    for (const hr of [...list.querySelectorAll('hr')]) if (!hr.previousElementSibling || !hr.nextElementSibling || hr.nextElementSibling.tagName === 'HR') hr.remove();
    list.hidden = false; trigger.setAttribute('aria-expanded', 'true');
    list.querySelector('[role=menuitem]')?.focus();
  };
  trigger.onclick = () => (list.hidden ? open() : close());
  document.addEventListener('pointerdown', e => { if (!menu.contains(e.target)) close(); });
  menu.addEventListener('keydown', e => {
    const entries = [...list.querySelectorAll('[role=menuitem]')], at = entries.indexOf(document.activeElement);
    if (e.key === 'Escape') { close(); trigger.focus(); }
    else if (e.key === 'ArrowDown' && entries.length) { e.preventDefault(); entries[(at + 1) % entries.length].focus(); }
    else if (e.key === 'ArrowUp' && entries.length) { e.preventDefault(); entries[(at - 1 + entries.length) % entries.length].focus(); }
  });
}

function installDialogTabs() {
  for (const dialog of document.querySelectorAll('dialog')) {
    const tabs = [...dialog.querySelectorAll('[data-dtab]')];
    if (!tabs.length) continue;
    const select = name => {
      for (const t of tabs) t.setAttribute('aria-selected', String(t.dataset.dtab === name));
      for (const p of dialog.querySelectorAll('[data-dpanel]')) p.hidden = p.dataset.dpanel !== name;
    };
    for (const t of tabs) t.onclick = () => select(t.dataset.dtab);
  }
}

// Lets any `.upload` label accept a dropped file, then runs the input's normal change handler.
function installDropZones() {
  const zones = new WeakSet();
  const attach = label => {
    if (zones.has(label)) return; zones.add(label);
    const input = label.querySelector('input[type=file]');
    if (!input) return;
    label.addEventListener('dragover', e => { e.preventDefault(); label.classList.add('dragging'); });
    label.addEventListener('dragleave', () => label.classList.remove('dragging'));
    label.addEventListener('drop', e => {
      e.preventDefault(); label.classList.remove('dragging');
      if (!e.dataTransfer?.files?.length || input.disabled) return;
      input.files = e.dataTransfer.files;
      input.dispatchEvent(new Event('change', {bubbles: true}));
    });
  };
  document.querySelectorAll('.upload').forEach(attach);
  new MutationObserver(() => document.querySelectorAll('.upload').forEach(attach)).observe(document.body, {childList: true, subtree: true});
}

export function installLayout({onRename}) {
  const header = document.querySelector('header'), stash = $('actionStash'), tools = $('sceneTools');
  // Give module-created buttons stable IDs before moving them.
  const lighting = $('lightingButton'), views = findButton('Saved views'), video = findButton('Video & screenshots');
  const editor = findButton('Selection editor'), quality = header.querySelector('select[aria-label="Viewer quality"]');
  if (views) views.id = 'savedViewsButton';
  if (video) video.id = 'videoButton';
  if (editor) editor.id = 'selectionEditorButton';
  const workspace = $('workspaceButton');
  if (workspace) stash.append(workspace);

  const divider = document.createElement('span'); divider.className = 'segDivider'; divider.setAttribute('aria-hidden', 'true');
  tools.append(divider);
  for (const [button, name, label, title] of [
    [lighting, 'lighting', 'Lighting', 'Lighting'],
    [views, 'views', 'Views', 'Saved camera views'],
    [video, 'video', 'Capture', 'Video & screenshots'],
    [editor, 'editor', 'Editor', 'Show or hide the selection editor'],
  ]) if (toolButton(button, name, label, title)) tools.append(button);
  if (quality) { quality.title = 'Rendering quality'; tools.append(quality); }

  installMenu(header.querySelector('[data-menu=project]'), [
    {target: 'workspaceButton', label: 'My projects', hint: 'Open, duplicate or archive saved projects'},
    {target: 'save', label: 'Save project', hint: 'Save to My projects on this computer'},
    '-',
    {target: 'load', label: 'Import backup…', hint: 'Open a project JSON file'},
    {target: 'json', label: 'Download project file', hint: 'Full JSON backup with artwork and models'},
  ]);
  installMenu(header.querySelector('[data-menu=share]'), [
    {target: 'review', label: 'Concept PDF & package…', hint: 'Elevations, panel specs and checks'},
    {target: 'proposalButton', label: 'Branded proposal…', hint: 'Your logo, colours and event details'},
    {target: 'videoButton', label: 'Video & screenshots…', hint: 'Orbit video or PNG of the booth'},
    '-',
    {target: 'share', label: 'Share for review…', hint: 'Frozen revision with comments and approval'},
    {target: 'previewLink', label: 'Copy preview link', hint: 'View-only link with reduced artwork'},
  ]);

  const title = $('projectTitle');
  title.addEventListener('change', () => { const name = title.value.trim(); if (name) onRename(name); else title.value = $('projectName').value; });
  title.addEventListener('keydown', e => { if (e.key === 'Enter') title.blur(); if (e.key === 'Escape') { title.value = $('projectName').value; title.blur(); } });

  // The selection editor docks on the right; the scene makes room for it while it is open.
  const panel = document.querySelector('.floatingEditor');
  if (panel) {
    const update = () => document.body.classList.toggle('editorOpen', !panel.hidden);
    new MutationObserver(update).observe(panel, {attributes: true, attributeFilter: ['hidden']});
    update();
  }
  installDialogTabs();
  installDropZones();
  return {setTitle(name) { if (document.activeElement !== title) title.value = name; }};
}
