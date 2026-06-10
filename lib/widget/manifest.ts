/**
 * Reads the widget build manifest once per process (bundle changes only on deploy).
 *
 * The manifest is written by scripts/build-widget.mjs as:
 *   { "bundlePath": "/widget/v/chat-widget.<hash8>.js", "builtAt": "<iso>" }
 *
 * Missing-file behavior: throws a clear error at call time. Deploy always runs
 * `pnpm build:widget` first, so the manifest is guaranteed to exist in any
 * served environment; a loud failure beats serving a bundlePath that 404s.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let cached: { bundlePath: string } | null = null;

export function getBundlePath(): string {
  if (!cached) {
    const manifestPath = join(process.cwd(), 'public/widget/manifest.json');
    let raw: string;
    try {
      raw = readFileSync(manifestPath, 'utf-8');
    } catch {
      throw new Error(
        `Widget manifest not found at ${manifestPath}. Run \`pnpm build:widget\` before serving.`
      );
    }
    const parsed = JSON.parse(raw) as { bundlePath?: unknown };
    if (typeof parsed.bundlePath !== 'string' || !parsed.bundlePath) {
      throw new Error(`Widget manifest at ${manifestPath} is missing a valid "bundlePath".`);
    }
    cached = { bundlePath: parsed.bundlePath };
  }
  return cached.bundlePath;
}

/** Test-only: reset the per-process cache so a fresh manifest read occurs. */
export function __resetBundlePathCache(): void {
  cached = null;
}
