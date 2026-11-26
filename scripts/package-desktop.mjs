// Packages the desktop prototype for this computer's platform into out/ (unsigned; for local testing only).
// Run through `npm run desktop:package`, which builds dist/ first.
import {packager} from '@electron/packager';
import {fileURLToPath} from 'node:url';

const dir = fileURLToPath(new URL('..', import.meta.url));

// Allowlist rather than blocklist, so private data (.local-data, .env, backups) can never end up in the app.
// Root modules are included because the server imports geometry.mjs and its dependencies; tests are left out.
// The browser code is already bundled into dist/, so the only package the server needs at runtime is three
// (models.mjs imports it for GLB validation).
const keep = path =>
  path === '' || path === '/package.json' ||
  /^\/(desktop|dist|examples)(\/|$)/.test(path) ||
  /^\/node_modules(\/three(\/|$)|$)/.test(path) ||
  (/^\/[^/]+\.mjs$/.test(path) && !/tests\.mjs$/.test(path));

const paths = await packager({
  dir,
  out: dir + 'out',
  name: 'Forma Booth Studio',
  appBundleId: 'local.forma.booth-studio',
  asar: true,
  overwrite: true,
  prune: true, // drops devDependencies (Electron, esbuild, the packager) from the bundled node_modules
  ignore: path => !keep(path),
});
console.log('Packaged:', paths.join(', '));
