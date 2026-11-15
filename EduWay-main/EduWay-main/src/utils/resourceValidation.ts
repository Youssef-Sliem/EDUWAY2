import { ResourceFileType } from '../types/academic';

/**
 * Firebase Spark Plan Storage Status:
 * Inspecting firebase-applet-config.json & src/lib/firebase.ts shows only Auth and Firestore
 * are configured on the free Spark plan. Firebase Cloud Storage (*.firebasestorage.app)
 * requires upgrading to the Blaze plan and enabling Storage rules.
 * Per user instructions, Blaze/paid services must NOT be enabled automatically.
 */
export const FIREBASE_CLOUD_STORAGE_AVAILABLE = false;

export const MAX_DOCUMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface DocumentFormatSpec {
  extension: string;
  mimeTypes: string[];
  label: string;
  signature: 'pdf' | 'ole2' | 'zip';
}

export const SUPPORTED_DOCUMENT_FORMATS: DocumentFormatSpec[] = [
  {
    extension: '.pdf',
    mimeTypes: ['application/pdf'],
    label: 'PDF Document (.pdf)',
    signature: 'pdf',
  },
  {
    extension: '.doc',
    mimeTypes: ['application/msword'],
    label: 'Word Document (.doc)',
    signature: 'ole2',
  },
  {
    extension: '.docx',
    mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    label: 'Word Document (.docx)',
    signature: 'zip',
  },
  {
    extension: '.ppt',
    mimeTypes: ['application/vnd.ms-powerpoint'],
    label: 'PowerPoint Presentation (.ppt)',
    signature: 'ole2',
  },
  {
    extension: '.pptx',
    mimeTypes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    label: 'PowerPoint Presentation (.pptx)',
    signature: 'zip',
  },
  {
    extension: '.xls',
    mimeTypes: ['application/vnd.ms-excel'],
    label: 'Excel Spreadsheet (.xls)',
    signature: 'ole2',
  },
  {
    extension: '.xlsx',
    mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    label: 'Excel Spreadsheet (.xlsx)',
    signature: 'zip',
  },
];

export const DOCUMENT_ACCEPT_ATTRIBUTE =
  '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export interface UrlValidationResult {
  valid: boolean;
  normalizedUrl?: string;
  detectedType?: ResourceFileType;
  error?: string;
}

export function validateHttpUrl(rawUrl: string): UrlValidationResult {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, error: 'Please enter a valid URL starting with https:// or http://' };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        valid: false,
        error: 'Only HTTP and HTTPS URLs are permitted.',
      };
    }

    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return {
        valid: false,
        error: 'Please enter a complete web address with a valid domain name.',
      };
    }

    const lowerPath = parsed.pathname.toLowerCase();
    let detectedType: ResourceFileType = 'link';
    if (lowerPath.endsWith('.pdf')) {
      detectedType = 'pdf';
    } else if (
      lowerPath.endsWith('.mp4') ||
      lowerPath.endsWith('.webm') ||
      parsed.hostname.includes('youtube.com') ||
      parsed.hostname.includes('youtu.be') ||
      parsed.hostname.includes('vimeo.com')
    ) {
      detectedType = 'video';
    } else if (
      lowerPath.endsWith('.doc') ||
      lowerPath.endsWith('.docx') ||
      lowerPath.endsWith('.ppt') ||
      lowerPath.endsWith('.pptx') ||
      lowerPath.endsWith('.xls') ||
      lowerPath.endsWith('.xlsx')
    ) {
      detectedType = 'doc';
    }

    return {
      valid: true,
      normalizedUrl: parsed.toString(),
      detectedType,
    };
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format. Example: https://example.edu/course-guide.pdf',
    };
  }
}

export function isPdfResourceUrl(url?: string, fileType?: string): boolean {
  if (!url) return false;
  if (fileType === 'pdf') return true;
  try {
    const parsed = new URL(url);
    return parsed.pathname.toLowerCase().endsWith('.pdf');
  } catch {
    return false;
  }
}

const GOOGLE_DRIVE_HOSTS = new Set(['drive.google.com', 'docs.google.com']);

export function isGoogleDriveUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url.trim());
    return (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      GOOGLE_DRIVE_HOSTS.has(parsed.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

export function validateGoogleDriveUrl(rawUrl: string): UrlValidationResult {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Please enter a Google Drive file sharing link.',
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format. Example: https://drive.google.com/file/d/.../view?usp=sharing',
    };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return {
      valid: false,
      error: 'Only HTTPS/HTTP Google Drive links are supported.',
    };
  }

  const host = parsed.hostname.toLowerCase();
  if (!GOOGLE_DRIVE_HOSTS.has(host)) {
    return {
      valid: false,
      error: 'Please enter a valid Google Drive link (drive.google.com or docs.google.com).',
    };
  }

  const path = parsed.pathname;
  const hasIdParam =
    parsed.searchParams.has('id') && (parsed.searchParams.get('id')?.trim().length || 0) >= 8;
  const hasDriveResourcePath =
    /\/file\/d\/[a-zA-Z0-9_-]{8,}/.test(path) ||
    /\/folders\/[a-zA-Z0-9_-]{8,}/.test(path) ||
    /\/(document|spreadsheets|presentation|forms)\/d\/(?:e\/)?[a-zA-Z0-9_-]{8,}/.test(path);

  if (!hasDriveResourcePath && !hasIdParam) {
    return {
      valid: false,
      error:
        'Please paste a specific Google Drive sharing link containing the file or folder ID (e.g., https://drive.google.com/file/d/.../view?usp=sharing).',
    };
  }

  return {
    valid: true,
    normalizedUrl: parsed.toString(),
    detectedType: 'doc',
  };
}

export interface DocumentValidationResult {
  valid: boolean;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  matchedFormat?: DocumentFormatSpec;
  error?: string;
}

/**
 * Validates actual file MIME type, extension, size, AND binary magic header bytes
 * so disguised or renamed files (e.g., .exe renamed to .pdf) are rejected.
 */
export async function validateDocumentFile(file: File): Promise<DocumentValidationResult> {
  const lowerName = file.name.toLowerCase();

  if (file.size === 0) {
    return {
      valid: false,
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type,
      error: 'The selected file is empty (0 bytes).',
    };
  }

  if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    return {
      valid: false,
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type,
      error: `File exceeds the maximum allowed size of 10 MB (${(file.size / (1024 * 1024)).toFixed(2)} MB selected).`,
    };
  }

  const matchedFormat = SUPPORTED_DOCUMENT_FORMATS.find((spec) =>
    lowerName.endsWith(spec.extension)
  );

  if (!matchedFormat) {
    return {
      valid: false,
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type,
      error: 'Unsupported file extension. Allowed formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX.',
    };
  }

  if (!file.type || !matchedFormat.mimeTypes.includes(file.type)) {
    return {
      valid: false,
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type || 'unknown',
      error: `Invalid MIME type "${file.type || 'unknown'}" for ${matchedFormat.extension}. Expected ${matchedFormat.mimeTypes.join(' or ')}.`,
    };
  }

  // Inspect actual binary magic header bytes
  const headerSlice = file.slice(0, 8);
  const buffer = await headerSlice.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (matchedFormat.signature === 'pdf') {
    // %PDF- => 0x25 0x50 0x44 0x46 0x2D
    const isPdf =
      bytes.length >= 5 &&
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46 &&
      bytes[4] === 0x2d;
    if (!isPdf) {
      return {
        valid: false,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type,
        error: 'File content failed PDF binary signature check (%PDF- header missing).',
      };
    }
  } else if (matchedFormat.signature === 'ole2') {
    // Legacy Office OLE2 Compound Binary => D0 CF 11 E0 A1 B1 1A E1
    const isOle2 =
      bytes.length >= 4 &&
      bytes[0] === 0xd0 &&
      bytes[1] === 0xcf &&
      bytes[2] === 0x11 &&
      bytes[3] === 0xe0;
    if (!isOle2) {
      return {
        valid: false,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type,
        error: `File content failed binary signature check for ${matchedFormat.extension}.`,
      };
    }
  } else if (matchedFormat.signature === 'zip') {
    // OOXML (.docx, .pptx, .xlsx) are ZIP containers => PK (0x50 0x4B 0x03 0x04)
    const isZip =
      bytes.length >= 4 &&
      bytes[0] === 0x50 &&
      bytes[1] === 0x4b &&
      bytes[2] === 0x03 &&
      bytes[3] === 0x04;
    if (!isZip) {
      return {
        valid: false,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type,
        error: `File content failed OOXML archive signature check for ${matchedFormat.extension}.`,
      };
    }
  }

  return {
    valid: true,
    fileName: file.name,
    fileSizeBytes: file.size,
    mimeType: file.type,
    matchedFormat,
  };
}

export function formatTimestamp(value: unknown): string {
  if (!value) return 'Just now';
  try {
    if (typeof value === 'object' && value !== null && 'seconds' in value) {
      const secs = (value as { seconds: number }).seconds;
      return new Date(secs * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    if (value instanceof Date) {
      return value.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    if (typeof value === 'string') {
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  } catch {
    return 'Recent';
  }
  return 'Recent';
}
