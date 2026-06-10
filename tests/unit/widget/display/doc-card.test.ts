/**
 * @jest-environment jsdom
 */
import { createDocCard } from '@/widget/src/renderers/display/doc-card';

describe('createDocCard', () => {
  it('renders an anchor with target=_blank and rel=noopener noreferrer', () => {
    const el = createDocCard({ title: 'Onboarding Guide', url: 'https://example.com/onboarding.pdf' });
    expect(el.tagName).toBe('A');
    expect(el.getAttribute('href')).toBe('https://example.com/onboarding.pdf');
    expect(el.getAttribute('target')).toBe('_blank');
    expect(el.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders the title text', () => {
    const el = createDocCard({ title: 'Onboarding Guide', url: 'https://example.com/o.pdf' });
    expect(el.textContent).toContain('Onboarding Guide');
  });

  it('sanitizes the title (no script injection)', () => {
    const el = createDocCard({ title: '<script>alert(1)</script>Onboarding', url: 'https://example.com/x.pdf' });
    expect(el.querySelector('script')).toBeNull();
    expect(el.textContent).toContain('Onboarding');
  });

  it('uses the file-type detector to set a data-filetype attribute', () => {
    const el = createDocCard({ title: 'X', url: 'https://example.com/file.pdf' });
    expect(el.getAttribute('data-filetype')?.toLowerCase()).toContain('pdf');
  });
});
