interface SidebarOptions {
  widgetKey: string;
  title: string;
  position: 'left' | 'right';
  defaultOpen: boolean;
  showCount?: boolean;
}

/**
 * Sidebar shell for the display widget.
 *
 * - Mounts an <aside> with header (title + count badge + collapse chevron) and body.
 * - Collapse state persists per widgetKey in localStorage; honors persisted state
 *   over defaultOpen.
 * - Exposes the body element for the renderer to mount the doc list into.
 * - dispose() removes the sidebar from the DOM.
 */
export class Sidebar {
  private root: HTMLElement | null = null;
  private bodyEl: HTMLElement | null = null;
  private countEl: HTMLElement | null = null;
  private collapsed = false;
  private opts: SidebarOptions;

  constructor(opts: SidebarOptions) {
    this.opts = opts;
  }

  mount(container: HTMLElement): void {
    const persisted = this.readPersisted();
    this.collapsed = persisted !== null ? persisted : !this.opts.defaultOpen;

    const root = document.createElement('aside');
    root.className = 'cw-display-sidebar';
    root.setAttribute('role', 'complementary');
    root.setAttribute('aria-label', this.opts.title);
    root.dataset.position = this.opts.position;
    if (this.collapsed) root.classList.add('cw-display-collapsed');

    const header = document.createElement('div');
    header.className = 'cw-display-header';

    const titleEl = document.createElement('span');
    titleEl.className = 'cw-display-title';
    titleEl.textContent = this.opts.title;

    const countEl = document.createElement('span');
    countEl.className = 'cw-display-count';
    if (this.opts.showCount === false) countEl.style.display = 'none';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cw-display-collapse-btn';
    btn.setAttribute('aria-expanded', String(!this.collapsed));
    btn.textContent = this.collapsed ? '›' : '‹';
    btn.addEventListener('click', () => this.toggleCollapsed(btn, root));

    header.appendChild(titleEl);
    header.appendChild(countEl);
    header.appendChild(btn);

    const body = document.createElement('div');
    body.className = 'cw-display-body';

    root.appendChild(header);
    root.appendChild(body);
    container.appendChild(root);

    this.root = root;
    this.bodyEl = body;
    this.countEl = countEl;
  }

  getBodyElement(): HTMLElement {
    if (!this.bodyEl) throw new Error('Sidebar not mounted');
    return this.bodyEl;
  }

  getRootElement(): HTMLElement {
    if (!this.root) throw new Error('Sidebar not mounted');
    return this.root;
  }

  updateCount(n: number): void {
    if (this.countEl) this.countEl.textContent = String(n);
  }

  dispose(): void {
    this.root?.remove();
    this.root = null;
    this.bodyEl = null;
    this.countEl = null;
  }

  private toggleCollapsed(btn: HTMLButtonElement, root: HTMLElement): void {
    this.collapsed = !this.collapsed;
    root.classList.toggle('cw-display-collapsed', this.collapsed);
    btn.setAttribute('aria-expanded', String(!this.collapsed));
    btn.textContent = this.collapsed ? '›' : '‹';
    this.writePersisted();
  }

  private storageKey(): string {
    return `cw-display-collapsed-${this.opts.widgetKey}`;
  }

  private readPersisted(): boolean | null {
    try {
      const v = localStorage.getItem(this.storageKey());
      if (v === 'true') return true;
      if (v === 'false') return false;
      return null;
    } catch {
      return null;
    }
  }

  private writePersisted(): void {
    try {
      localStorage.setItem(this.storageKey(), String(this.collapsed));
    } catch {
      // ignore storage errors (private mode, quota, etc.)
    }
  }
}
