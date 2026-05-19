/**
 * @jest-environment jsdom
 */
import { renderDocList } from '@/widget/src/renderers/display/doc-list';

describe('renderDocList', () => {
  const container = () => document.createElement('div');

  it('renders one card per document', () => {
    const el = container();
    renderDocList(el, {
      kind: 'success',
      documents: [
        { title: 'A', url: 'https://x/a.pdf' },
        { title: 'B', url: 'https://x/b.docx' },
      ],
    }, { emptyMessage: 'No docs', onRetry: () => {} });
    expect(el.querySelectorAll('.cw-display-card').length).toBe(2);
  });

  it('renders the empty message for empty state', () => {
    const el = container();
    renderDocList(el, { kind: 'empty' }, { emptyMessage: 'Nothing here yet.', onRetry: () => {} });
    expect(el.textContent).toContain('Nothing here yet.');
    expect(el.querySelector('.cw-display-card')).toBeNull();
  });

  it('renders skeleton rows for loading state', () => {
    const el = container();
    renderDocList(el, { kind: 'loading' }, { emptyMessage: 'N/A', onRetry: () => {} });
    expect(el.querySelectorAll('.cw-display-skeleton').length).toBeGreaterThan(0);
    expect(el.getAttribute('aria-busy')).toBe('true');
  });

  it('renders an error message with a retry button that calls onRetry', () => {
    const el = container();
    const onRetry = jest.fn();
    renderDocList(el, { kind: 'error', message: 'oops' }, { emptyMessage: 'N/A', onRetry });
    expect(el.textContent).toContain('oops');
    const btn = el.querySelector('button.cw-display-retry') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    btn.click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('clears existing content between renders (transitions clean up previous state)', () => {
    const el = container();
    renderDocList(el, { kind: 'loading' }, { emptyMessage: 'N/A', onRetry: () => {} });
    expect(el.querySelectorAll('.cw-display-skeleton').length).toBeGreaterThan(0);
    renderDocList(el, { kind: 'success', documents: [{ title: 'A', url: 'https://x/a.pdf' }] }, { emptyMessage: 'N/A', onRetry: () => {} });
    expect(el.querySelectorAll('.cw-display-skeleton').length).toBe(0);
    expect(el.querySelectorAll('.cw-display-card').length).toBe(1);
  });

  it('clears aria-busy when transitioning out of loading', () => {
    const el = container();
    renderDocList(el, { kind: 'loading' }, { emptyMessage: 'N/A', onRetry: () => {} });
    expect(el.getAttribute('aria-busy')).toBe('true');
    renderDocList(el, { kind: 'empty' }, { emptyMessage: 'No', onRetry: () => {} });
    expect(el.hasAttribute('aria-busy')).toBe(false);
  });
});
