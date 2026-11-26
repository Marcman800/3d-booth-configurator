// Desktop shell (Electron prototype). It runs the existing loopback server in-process and shows the app in a window,
// so nobody needs Node, a terminal or a browser tab. The web app and server are unchanged; this file only hosts them.
import {app, BrowserWindow, Menu, dialog, shell} from 'electron';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';

// A fixed port keeps the page origin stable between launches. The browser recovery draft (IndexedDB) is stored per
// origin, so a different port each time would lose it. 4874 is chosen to avoid the dev server's default 4174.
const PORT = Number(process.env.FORMA_DESKTOP_PORT || 4874);
const ORIGIN = `http://127.0.0.1:${PORT}`;

if (!app.requestSingleInstanceLock()) app.quit();

// Saved projects live in the platform's app-data folder (e.g. ~/Library/Application Support/Forma Booth Studio/data on
// macOS), never inside the app bundle. FORMA_DATA can still point somewhere else, e.g. an existing .local-data folder.
async function startServer() {
  process.env.FORMA_DATA ||= join(app.getPath('userData'), 'data');
  process.env.PORT = String(PORT);
  await mkdir(process.env.FORMA_DATA, {recursive: true});
  const {listening} = await import('../server.mjs');
  return listening;
}

const isAppUrl = url => { try { return new URL(url).origin === ORIGIN; } catch { return false; } };
const openOutside = url => { if (/^https?:\/\//.test(url)) shell.openExternal(url); };

// Every window gets the same locked-down settings: no Node access in the page, sandboxed, context-isolated.
const webPreferences = {contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: true};

function harden(win) {
  const {webContents} = win;
  // Links to the app itself (e.g. a review link) open in another app window; anything else opens in the default browser.
  webContents.setWindowOpenHandler(({url}) => {
    if (isAppUrl(url)) return {action: 'allow', overrideBrowserWindowOptions: {width: 1280, height: 860, backgroundColor: '#f4f2ee', webPreferences}};
    openOutside(url);
    return {action: 'deny'};
  });
  webContents.on('will-navigate', (event, url) => { if (!isAppUrl(url)) { event.preventDefault(); openOutside(url); } });
  // The page asks before closing with unsaved changes. Browsers show their own prompt; Electron needs one supplied.
  webContents.on('will-prevent-unload', event => {
    const choice = dialog.showMessageBoxSync(win, {
      type: 'warning', buttons: ['Stay', 'Close anyway'], defaultId: 0, cancelId: 0,
      message: 'This project has unsaved changes.', detail: 'Close anyway to discard them, or stay and save first.',
    });
    if (choice === 1) event.preventDefault(); // preventDefault here ignores the page's beforeunload and closes.
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1024, minHeight: 680, show: false,
    title: 'Forma Booth Studio', backgroundColor: '#f4f2ee', webPreferences,
  });
  harden(win);
  win.once('ready-to-show', () => win.show());
  win.loadURL(ORIGIN + '/');
  return win;
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(isMac ? [{role: 'appMenu'}] : []),
    {label: 'File', submenu: [
      {label: 'New Window', accelerator: 'CmdOrCtrl+N', click: () => createWindow()},
      {label: 'Show Saved Projects Folder', click: () => shell.openPath(process.env.FORMA_DATA)},
      {type: 'separator'},
      isMac ? {role: 'close'} : {role: 'quit'},
    ]},
    {role: 'editMenu'},
    {role: 'viewMenu'},
    {role: 'windowMenu'},
  ]));
}

app.on('second-instance', () => {
  const [win] = BrowserWindow.getAllWindows();
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); } else createWindow();
});
app.on('web-contents-created', (_e, contents) => contents.on('will-attach-webview', e => e.preventDefault()));
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (app.isReady() && !BrowserWindow.getAllWindows().length) createWindow(); });

app.whenReady().then(async () => {
  try {
    await startServer();
  } catch (error) {
    dialog.showErrorBox('Forma Booth Studio could not start',
      error.code === 'EADDRINUSE'
        ? `Port ${PORT} is already in use, probably by another copy of Forma. Close it and try again.`
        : String(error.message || error));
    app.exit(1);
    return;
  }
  buildMenu();
  createWindow();
});
