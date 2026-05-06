/**
 * File Type Detector
 *
 * Parses a URL to extract filename, domain, and file type information.
 * Used by link preview cards to show appropriate icons and labels.
 * Purely client-side — no remote requests.
 */

export interface FileTypeInfo {
  icon: string;
  iconColor: string;
  label: string;
  filename: string;
  domain: string;
}

interface FileTypeEntry {
  icon: string;
  iconColor: string;
  label: string;
}

const FILE_TYPES: Record<string, FileTypeEntry> = {
  docx: { icon: 'W', iconColor: '#2b579a', label: 'Word Document' },
  doc:  { icon: 'W', iconColor: '#2b579a', label: 'Word Document' },
  xlsx: { icon: 'X', iconColor: '#217346', label: 'Excel Spreadsheet' },
  xls:  { icon: 'X', iconColor: '#217346', label: 'Excel Spreadsheet' },
  pptx: { icon: 'P', iconColor: '#d24726', label: 'PowerPoint' },
  ppt:  { icon: 'P', iconColor: '#d24726', label: 'PowerPoint' },
  pdf:  { icon: 'PDF', iconColor: '#e74c3c', label: 'PDF Document' },
  png:  { icon: 'IMG', iconColor: '#8e44ad', label: 'Image' },
  jpg:  { icon: 'IMG', iconColor: '#8e44ad', label: 'Image' },
  jpeg: { icon: 'IMG', iconColor: '#8e44ad', label: 'Image' },
  gif:  { icon: 'IMG', iconColor: '#8e44ad', label: 'Image' },
  svg:  { icon: 'IMG', iconColor: '#8e44ad', label: 'Image' },
  zip:  { icon: 'ZIP', iconColor: '#7f8c8d', label: 'Archive' },
  rar:  { icon: 'ZIP', iconColor: '#7f8c8d', label: 'Archive' },
  '7z': { icon: 'ZIP', iconColor: '#7f8c8d', label: 'Archive' },
  txt:  { icon: 'TXT', iconColor: '#95a5a6', label: 'Text File' },
  md:   { icon: 'TXT', iconColor: '#95a5a6', label: 'Text File' },
  csv:  { icon: 'TXT', iconColor: '#95a5a6', label: 'Text File' },
};

const FALLBACK: FileTypeEntry = { icon: '🔗', iconColor: '#6b7280', label: '' };

export function detectFileType(url: string): FileTypeInfo {
  let domain = '';
  let filename = url;

  try {
    const parsed = new URL(url);
    domain = parsed.hostname.toLowerCase().replace(/^www\./, '');

    const segments = parsed.pathname.split('/');
    const last = segments[segments.length - 1];
    if (last && last.length > 0) {
      filename = decodeURIComponent(last);
    } else {
      filename = domain;
    }
  } catch {
    return { ...FALLBACK, label: FALLBACK.label || 'Link', filename, domain };
  }

  const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
  if (extMatch) {
    const ext = extMatch[1].toLowerCase();
    const entry = FILE_TYPES[ext];
    if (entry) {
      return { ...entry, filename, domain };
    }
  }

  return { ...FALLBACK, label: domain || 'Link', filename, domain };
}
