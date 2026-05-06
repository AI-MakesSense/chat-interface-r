/**
 * Link Preview Card
 *
 * Creates a compact inline preview card for external links.
 * Shows file type icon, filename, domain, and Open/Download buttons.
 */

import { detectFileType } from '../utils/file-type-detector';

export interface LinkPreviewTheme {
  surface: string;
  text: string;
  subText: string;
  border: string;
  accentColor: string;
  elementRadius: string;
}

export function createLinkPreviewCard(url: string, theme: LinkPreviewTheme): HTMLElement {
  const info = detectFileType(url);

  const card = document.createElement('div');
  card.className = 'n8n-link-preview-card';
  card.dataset.themeSurface = theme.surface;
  card.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    margin-top: 6px;
    background-color: ${theme.surface};
    border: 1px solid ${theme.border};
    border-radius: ${theme.elementRadius};
    font-family: inherit;
  `;

  // Icon
  const icon = document.createElement('div');
  icon.style.cssText = `
    width: 36px;
    height: 36px;
    background: ${info.iconColor};
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: ${info.icon.length > 2 ? '10px' : '14px'};
    flex-shrink: 0;
    line-height: 1;
  `;
  icon.textContent = info.icon;
  card.appendChild(icon);

  // Text area (filename + domain)
  const textArea = document.createElement('div');
  textArea.style.cssText = `
    flex: 1;
    min-width: 0;
    overflow: hidden;
  `;

  const filenameEl = document.createElement('div');
  filenameEl.style.cssText = `
    font-weight: 600;
    font-size: 13px;
    color: ${theme.text};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `;
  filenameEl.textContent = info.filename;
  textArea.appendChild(filenameEl);

  const domainEl = document.createElement('div');
  domainEl.style.cssText = `
    font-size: 11px;
    color: ${theme.subText};
    margin-top: 1px;
  `;
  domainEl.textContent = info.domain;
  textArea.appendChild(domainEl);

  card.appendChild(textArea);

  // Action buttons
  const actions = document.createElement('div');
  actions.style.cssText = `
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  `;

  // Open button
  const openBtn = document.createElement('a');
  openBtn.href = url;
  openBtn.target = '_blank';
  openBtn.rel = 'noopener noreferrer';
  openBtn.textContent = 'Open';
  openBtn.style.cssText = `
    font-size: 12px;
    color: ${theme.accentColor};
    text-decoration: none;
    padding: 4px 10px;
    border-radius: 4px;
    background: ${theme.surface};
    border: 1px solid ${theme.border};
    cursor: pointer;
    white-space: nowrap;
  `;
  actions.appendChild(openBtn);

  // Download button
  const dlBtn = document.createElement('a');
  dlBtn.href = url;
  dlBtn.target = '_blank';
  dlBtn.rel = 'noopener noreferrer';
  dlBtn.download = info.filename;
  dlBtn.textContent = 'Download';
  dlBtn.style.cssText = `
    font-size: 12px;
    color: ${theme.subText};
    text-decoration: none;
    padding: 4px 10px;
    border-radius: 4px;
    background: ${theme.surface};
    border: 1px solid ${theme.border};
    cursor: pointer;
    white-space: nowrap;
  `;
  actions.appendChild(dlBtn);

  card.appendChild(actions);

  return card;
}
