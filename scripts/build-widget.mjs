/**
 * Builds: public/widget/v/chat-widget.<hash8>.js  (immutable, minified, NOT obfuscated)
 *         public/widget/loader.js                  (stable URL, short cache)
 *         public/widget/manifest.json              ({ bundlePath, builtAt })
 * Prunes old hashed bundles (keeps newest 3 for in-flight loads during deploy).
 *
 * Obfuscation intentionally removed — client-delivered JS is not protectable; the
 * obfuscator bloated the bundle, slowed parsing, and broke debuggability. A
 * legal-notice banner can be re-added via esbuild `banner` if desired.
 *
 * globalName 'ChatWidget' (used by the old secure build) is intentionally dropped:
 * nothing references window.ChatWidget. index.ts self-mounts and exposes
 * window.Widget / window.N8nWidget on its own.
 */
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readdirSync, unlinkSync, statSync } from 'node:fs';
import { join } from 'node:path';

const OUT_DIR = 'public/widget';
const VERSIONED_DIR = join(OUT_DIR, 'v');
mkdirSync(VERSIONED_DIR, { recursive: true });

const BANNER = '/* © Prosperous Media — n8n Chat Widget. All rights reserved. */';

// 1. Main bundle → in-memory, hash, write
const bundleResult = await build({
  entryPoints: ['widget/src/index.ts'],
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2018',
  write: false,
  define: { 'process.env.NODE_ENV': '"production"' },
  banner: { js: BANNER },
});
const code = bundleResult.outputFiles[0].text;
const hash = createHash('sha256').update(code).digest('hex').slice(0, 8);
const bundleName = `chat-widget.${hash}.js`;
writeFileSync(join(VERSIONED_DIR, bundleName), code);

// 2. Loader → stable path
await build({
  entryPoints: ['widget/src/loader.ts'],
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2018',
  outfile: join(OUT_DIR, 'loader.js'),
});

// 3. Manifest (builtAt via Date is fine in a build script)
writeFileSync(
  join(OUT_DIR, 'manifest.json'),
  JSON.stringify({ bundlePath: `/widget/v/${bundleName}`, builtAt: new Date().toISOString() }, null, 2),
);

// 4. Prune old hashed bundles (keep newest 3 by mtime)
const bundles = readdirSync(VERSIONED_DIR)
  .filter((f) => /^chat-widget\.[0-9a-f]{8}\.js$/.test(f))
  .map((f) => ({ f, mtime: statSync(join(VERSIONED_DIR, f)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime);
for (const { f } of bundles.slice(3)) {
  // Never delete the bundle we just wrote, even if stale files have
  // future-dated mtimes (CI clock skew / NFS) that sort them ahead of it.
  if (f !== bundleName) unlinkSync(join(VERSIONED_DIR, f));
}

console.log(`Built ${bundleName} (${(code.length / 1024).toFixed(1)} KB) + loader.js`);
