import { createDocCard } from './doc-card';
import type { DisplayRendererState } from './types';

interface RenderOptions {
  emptyMessage: string;
  onRetry: () => void;
}

/**
 * Renders the document list into `container` based on the current state.
 * Clears existing content before rendering so callers can safely call this
 * across state transitions.
 *
 * - `loading`: skeleton rows + aria-busy
 * - `success`: one DocCard per document (count carried by caller, not rendered here)
 * - `empty`: empty-state message
 * - `error`: error message + retry button wired to opts.onRetry
 */
export function renderDocList(container: HTMLElement, state: DisplayRendererState, opts: RenderOptions): void {
  container.innerHTML = '';
  container.removeAttribute('aria-busy');

  switch (state.kind) {
    case 'loading': {
      container.setAttribute('aria-busy', 'true');
      for (let i = 0; i < 3; i++) {
        const row = document.createElement('div');
        row.className = 'cw-display-skeleton';
        container.appendChild(row);
      }
      return;
    }
    case 'success': {
      for (const doc of state.documents) {
        container.appendChild(createDocCard(doc));
      }
      return;
    }
    case 'empty': {
      const msg = document.createElement('div');
      msg.className = 'cw-display-empty';
      msg.textContent = opts.emptyMessage;
      container.appendChild(msg);
      return;
    }
    case 'error': {
      const wrap = document.createElement('div');
      wrap.className = 'cw-display-error';
      const text = document.createElement('p');
      text.textContent = state.message;
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'cw-display-retry';
      retry.textContent = 'Retry';
      retry.addEventListener('click', opts.onRetry);
      wrap.appendChild(text);
      wrap.appendChild(retry);
      container.appendChild(wrap);
      return;
    }
  }
}
