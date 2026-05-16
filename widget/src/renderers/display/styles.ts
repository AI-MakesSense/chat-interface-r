// widget/src/renderers/display/styles.ts

/**
 * CSS for the display widget. Uses the existing --cw-* CSS variables generated
 * by theming/css-variables.ts so the sidebar inherits the user's theme.
 */
export const DISPLAY_WIDGET_CSS = `
.cw-display-sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 320px;
  background: var(--cw-color-surface, #ffffff);
  color: var(--cw-color-text, #111111);
  border-left: 1px solid var(--cw-color-border, #e5e7eb);
  font-family: var(--cw-font-family, system-ui, sans-serif);
  z-index: 2147483640;
  display: flex;
  flex-direction: column;
  transition: transform 200ms ease, width 200ms ease;
}
.cw-display-sidebar[data-position="right"] { right: 0; }
.cw-display-sidebar[data-position="left"] { left: 0; border-left: none; border-right: 1px solid var(--cw-color-border, #e5e7eb); }
.cw-display-sidebar.cw-display-collapsed { width: 32px; }
.cw-display-sidebar.cw-display-collapsed .cw-display-title,
.cw-display-sidebar.cw-display-collapsed .cw-display-body { display: none; }

.cw-display-header {
  height: 48px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-bottom: 1px solid var(--cw-color-border, #e5e7eb);
}
.cw-display-title { flex: 1; font-weight: 600; font-size: 14px; }
.cw-display-count {
  background: var(--cw-color-accent, #6366f1);
  color: #fff;
  border-radius: 999px;
  min-width: 22px;
  height: 20px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
}
.cw-display-collapse-btn {
  background: none;
  border: 0;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  color: var(--cw-color-text, #111);
  padding: 4px 6px;
  border-radius: 4px;
}
.cw-display-collapse-btn:hover { background: var(--cw-color-border, #e5e7eb); }

.cw-display-body { flex: 1; overflow-y: auto; padding: 8px 0; }

.cw-display-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  text-decoration: none;
  color: inherit;
  border-top: 1px solid var(--cw-color-border, #f3f4f6);
}
.cw-display-card:first-child { border-top: 0; }
.cw-display-card:hover { background: rgba(0,0,0,0.03); }
.cw-display-card-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--cw-radius-card, 6px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}
.cw-display-card-title {
  font-size: 13px;
  line-height: 1.3;
  font-weight: 500;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.cw-display-skeleton {
  height: 56px;
  margin: 4px 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.05) 75%);
  background-size: 200% 100%;
  animation: cw-display-shimmer 1.2s linear infinite;
}
@keyframes cw-display-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.cw-display-empty,
.cw-display-error {
  padding: 16px 12px;
  font-size: 13px;
  color: var(--cw-color-subText, #6b7280);
  text-align: center;
}
.cw-display-error p { margin: 0 0 10px; }
.cw-display-retry {
  background: var(--cw-color-accent, #6366f1);
  color: #fff;
  border: 0;
  border-radius: var(--cw-radius-button, 6px);
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

@media (max-width: 768px) {
  .cw-display-sidebar {
    top: auto;
    right: 0 !important;
    left: 0 !important;
    bottom: 0;
    width: 100%;
    height: 40vh;
    border-left: 0;
    border-top: 1px solid var(--cw-color-border, #e5e7eb);
  }
  .cw-display-sidebar.cw-display-collapsed { height: 48px; width: 100%; }
}
`;
