import { detectFileType } from '../../utils/file-type-detector';
import type { DisplayDocument } from './types';

/**
 * Builds a single clickable document card.
 *
 * The card is an <a> element so:
 *   - keyboard navigation works for free (tab focus, enter activation)
 *   - right-click → "Open in new tab" works
 *   - screen readers announce it as a link
 *
 * target=_blank + rel="noopener noreferrer" follow standard practice for
 * external-content links (security + privacy).
 *
 * The title is set via .textContent (never .innerHTML) so HTML in n8n's
 * response cannot inject markup or scripts into the widget.
 */
export function createDocCard(doc: DisplayDocument): HTMLAnchorElement {
  const info = detectFileType(doc.url);

  const a = document.createElement('a');
  a.className = 'cw-display-card';
  a.href = doc.url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.setAttribute('data-filetype', info.icon ?? 'DOC');

  const icon = document.createElement('span');
  icon.className = 'cw-display-card-icon';
  icon.style.backgroundColor = info.iconColor ?? '#6b7280';
  icon.textContent = (info.icon ?? 'DOC').slice(0, 3);

  const title = document.createElement('span');
  title.className = 'cw-display-card-title';
  title.textContent = doc.title; // textContent sanitizes — no innerHTML

  a.appendChild(icon);
  a.appendChild(title);
  return a;
}
