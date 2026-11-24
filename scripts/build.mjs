// Bundles app.mjs into dist/app.js plus lazy-loaded dist/chunks/.
//   node scripts/build.mjs          production build (minified)
//   node scripts/build.mjs --watch  dev loop: rebuild on save and restart the server when its code changes
import * as esbuild from 'esbuild';
import {rm} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const watch = process.argv.includes('--watch');
const options = {
  absWorkingDir: root,
  entryPoints: ['app.mjs'],
  bundle: true,
  format: 'esm',
  splitting: true,
  outdir: 'dist',
  entryNames: '[name]',
  chunkNames: 'chunks/[name]-[hash]',
  // Dev builds stay readable and carry inline source maps (the server only serves whitelisted files, so no .map files).
  minify: !watch,
  sourcemap: watch ? 'inline' : false,
  logLevel: 'info',
};

// Hashed chunk names change between builds; clear the old ones so dist/ doesn't accumulate them.
await rm(root + 'dist/chunks', {recursive: true, force: true});

if (!watch) {
  await esbuild.build(options);
} else {
  const ctx = await esbuild.context(options);
  await ctx.rebuild();
  await ctx.watch();
  // node --watch restarts the server when server.mjs or a module it imports changes.
  const server = spawn(process.execPath, ['--watch', 'server.mjs'], {cwd: root, stdio: 'inherit'});
  const stop = async () => { server.kill(); await ctx.dispose(); process.exit(0); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  server.on('exit', code => { if (code) { console.error(`Server exited with code ${code}.`); ctx.dispose().then(() => process.exit(code)); } });
}
