import { createLinkPreviewCard } from '@/widget/src/ui/link-preview-card';

describe('createLinkPreviewCard', () => {
  const defaultTheme = {
    surface: '#f3f4f6',
    text: '#111827',
    subText: '#6b7280',
    border: 'rgba(0,0,0,0.08)',
    accentColor: '#0ea5e9',
    elementRadius: '8px',
  };

  it('creates a card element for a Word document URL', () => {
    const card = createLinkPreviewCard('https://sharepoint.com/Report.docx', defaultTheme);
    expect(card).toBeInstanceOf(HTMLElement);
    expect(card.textContent).toContain('Report.docx');
    expect(card.textContent).toContain('sharepoint.com');
  });

  it('includes an Open link that opens in new tab', () => {
    const card = createLinkPreviewCard('https://example.com/file.pdf', defaultTheme);
    const openLink = card.querySelector('a[target="_blank"]') as HTMLAnchorElement;
    expect(openLink).not.toBeNull();
    expect(openLink.href).toContain('example.com/file.pdf');
    expect(openLink.textContent).toBe('Open');
  });

  it('has exactly one action link (Open)', () => {
    const card = createLinkPreviewCard('https://example.com/file.xlsx', defaultTheme);
    const links = card.querySelectorAll('a');
    expect(links.length).toBe(1);
    expect(links[0].textContent).toBe('Open');
    expect(links[0].target).toBe('_blank');
    expect(links[0].hasAttribute('download')).toBe(false);
  });

  it('shows file type icon with correct color for known types', () => {
    const card = createLinkPreviewCard('https://example.com/slides.pptx', defaultTheme);
    expect(card.textContent).toContain('P');
  });

  it('shows domain fallback for unknown file types', () => {
    const card = createLinkPreviewCard('https://sharepoint.com/sites/view', defaultTheme);
    expect(card.textContent).toContain('sharepoint.com');
  });

  it('applies theme colors to the card', () => {
    const darkTheme = {
      ...defaultTheme,
      surface: '#262626',
      text: '#e5e5e5',
      subText: '#a1a1aa',
      border: 'rgba(255,255,255,0.1)',
    };
    const card = createLinkPreviewCard('https://example.com/file.docx', darkTheme);
    // jsdom normalizes hex to rgb(); check data attribute for raw theme value
    expect(card.dataset.themeSurface).toBe(darkTheme.surface);
  });
});
