'use client';

import { useEffect } from 'react';

/**
 * Forces the preview iframe's document body to a transparent background so the
 * configurator's device-frame chrome shows through behind the mounted widget.
 * globals.css sets `body { background: var(--background) }` (white/dark); inside the
 * preview iframe we want none of that. Runs only on the client (the body element only
 * exists at runtime) and restores nothing on unmount — the preview page is the whole
 * document, so there is nothing to clean up.
 */
export function TransparentBody() {
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = 'transparent';
    return () => {
      document.body.style.background = prev;
    };
  }, []);
  return null;
}
