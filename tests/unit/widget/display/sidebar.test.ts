/**
 * @jest-environment jsdom
 */
import { Sidebar } from '@/widget/src/renderers/display/sidebar';

describe('Sidebar', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  it('mounts a sidebar element into the container with the configured title', () => {
    const c = document.createElement('div');
    document.body.appendChild(c);
    const s = new Sidebar({ widgetKey: 'w1', title: 'Required documents', position: 'right', defaultOpen: true });
    s.mount(c);
    expect(c.querySelector('.cw-display-sidebar')).not.toBeNull();
    expect(c.textContent).toContain('Required documents');
  });

  it('starts open when defaultOpen is true and no persisted state exists', () => {
    const c = document.createElement('div');
    const s = new Sidebar({ widgetKey: 'w1', title: 't', position: 'right', defaultOpen: true });
    s.mount(c);
    expect(c.querySelector('.cw-display-sidebar')?.classList.contains('cw-display-collapsed')).toBe(false);
  });

  it('starts collapsed when defaultOpen is false', () => {
    const c = document.createElement('div');
    const s = new Sidebar({ widgetKey: 'w1', title: 't', position: 'right', defaultOpen: false });
    s.mount(c);
    expect(c.querySelector('.cw-display-sidebar')?.classList.contains('cw-display-collapsed')).toBe(true);
  });

  it('persists user collapse choice in localStorage keyed by widgetKey', () => {
    const c = document.createElement('div');
    const s = new Sidebar({ widgetKey: 'w1', title: 't', position: 'right', defaultOpen: true });
    s.mount(c);
    const btn = c.querySelector('.cw-display-collapse-btn') as HTMLButtonElement;
    btn.click();
    expect(localStorage.getItem('cw-display-collapsed-w1')).toBe('true');
  });

  it('honors persisted state over defaultOpen on subsequent mounts', () => {
    localStorage.setItem('cw-display-collapsed-w1', 'true');
    const c = document.createElement('div');
    const s = new Sidebar({ widgetKey: 'w1', title: 't', position: 'right', defaultOpen: true });
    s.mount(c);
    expect(c.querySelector('.cw-display-sidebar')?.classList.contains('cw-display-collapsed')).toBe(true);
  });

  it('updates the count badge via updateCount()', () => {
    const c = document.createElement('div');
    const s = new Sidebar({ widgetKey: 'w1', title: 't', position: 'right', defaultOpen: true, showCount: true });
    s.mount(c);
    s.updateCount(7);
    expect(c.querySelector('.cw-display-count')?.textContent).toBe('7');
  });

  it('returns the body element so the renderer can mount the doc list into it', () => {
    const c = document.createElement('div');
    const s = new Sidebar({ widgetKey: 'w1', title: 't', position: 'right', defaultOpen: true });
    s.mount(c);
    const body = s.getBodyElement();
    expect(body.classList.contains('cw-display-body')).toBe(true);
  });

  it('dispose() removes the sidebar from the DOM', () => {
    const c = document.createElement('div');
    document.body.appendChild(c);
    const s = new Sidebar({ widgetKey: 'w1', title: 't', position: 'right', defaultOpen: true });
    s.mount(c);
    s.dispose();
    expect(c.querySelector('.cw-display-sidebar')).toBeNull();
  });

  it('hides the count badge when showCount is false', () => {
    const c = document.createElement('div');
    const s = new Sidebar({ widgetKey: 'w1', title: 't', position: 'right', defaultOpen: true, showCount: false });
    s.mount(c);
    const badge = c.querySelector('.cw-display-count') as HTMLElement;
    expect(badge?.style.display).toBe('none');
  });
});
