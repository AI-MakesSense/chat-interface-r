import { detectFileType, FileTypeInfo } from '@/widget/src/utils/file-type-detector';

describe('detectFileType', () => {
  it('detects Word documents from .docx extension', () => {
    const result = detectFileType('https://sharepoint.com/sites/team/Shared/Report.docx');
    expect(result.icon).toBe('W');
    expect(result.iconColor).toBe('#2b579a');
    expect(result.label).toBe('Word Document');
    expect(result.filename).toBe('Report.docx');
    expect(result.domain).toBe('sharepoint.com');
  });

  it('detects Excel from .xlsx extension', () => {
    const result = detectFileType('https://onedrive.live.com/files/Budget.xlsx');
    expect(result.icon).toBe('X');
    expect(result.iconColor).toBe('#217346');
    expect(result.label).toBe('Excel Spreadsheet');
    expect(result.filename).toBe('Budget.xlsx');
  });

  it('detects PowerPoint from .pptx extension', () => {
    const result = detectFileType('https://example.com/slides/Deck.pptx');
    expect(result.icon).toBe('P');
    expect(result.iconColor).toBe('#d24726');
    expect(result.label).toBe('PowerPoint');
  });

  it('detects PDF from .pdf extension', () => {
    const result = detectFileType('https://example.com/doc.pdf');
    expect(result.icon).toBe('PDF');
    expect(result.iconColor).toBe('#e74c3c');
    expect(result.label).toBe('PDF Document');
  });

  it('detects images from .png extension', () => {
    const result = detectFileType('https://example.com/photo.png');
    expect(result.icon).toBe('IMG');
    expect(result.iconColor).toBe('#8e44ad');
    expect(result.label).toBe('Image');
  });

  it('detects archives from .zip extension', () => {
    const result = detectFileType('https://example.com/files.zip');
    expect(result.icon).toBe('ZIP');
    expect(result.iconColor).toBe('#7f8c8d');
    expect(result.label).toBe('Archive');
  });

  it('detects text files from .csv extension', () => {
    const result = detectFileType('https://example.com/data.csv');
    expect(result.icon).toBe('TXT');
    expect(result.iconColor).toBe('#95a5a6');
    expect(result.label).toBe('Text File');
  });

  it('falls back to domain for unknown extensions', () => {
    const result = detectFileType('https://sharepoint.com/sites/team/_layouts/view.aspx');
    expect(result.icon).toBe('🔗');
    expect(result.iconColor).toBe('#6b7280');
    expect(result.label).toBe('sharepoint.com');
  });

  it('falls back to domain for URLs with no extension', () => {
    const result = detectFileType('https://docs.google.com/document/d/abc123/edit');
    expect(result.label).toBe('docs.google.com');
    expect(result.domain).toBe('docs.google.com');
  });

  it('strips www. from domain', () => {
    const result = detectFileType('https://www.example.com/file.docx');
    expect(result.domain).toBe('example.com');
  });

  it('decodes URL-encoded filenames', () => {
    const result = detectFileType('https://example.com/Q3%20Sales%20Report.docx');
    expect(result.filename).toBe('Q3 Sales Report.docx');
  });

  it('handles .doc extension (legacy Word)', () => {
    const result = detectFileType('https://example.com/old.doc');
    expect(result.icon).toBe('W');
    expect(result.label).toBe('Word Document');
  });

  it('handles URLs with query parameters after extension', () => {
    const result = detectFileType('https://example.com/file.pdf?token=abc123');
    expect(result.icon).toBe('PDF');
    expect(result.filename).toBe('file.pdf');
  });

  it('handles invalid URLs gracefully', () => {
    const result = detectFileType('not-a-url');
    expect(result.icon).toBe('🔗');
    expect(result.label).toBe('Link');
    expect(result.filename).toBe('not-a-url');
    expect(result.domain).toBe('');
  });
});
