import { extname } from 'node:path';
import { ResourceKind } from '../../generated/prisma/enums.js';

interface KindInfo {
  kind: ResourceKind;
  mimeType: string;
}

const EXTENSION_MAP: Record<string, KindInfo> = {
  '.pdf': { kind: 'DOCUMENT', mimeType: 'application/pdf' },
  '.docx': {
    kind: 'DOCUMENT',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  '.xlsx': {
    kind: 'DOCUMENT',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  '.pptx': {
    kind: 'DOCUMENT',
    mimeType:
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  },
  '.odt': { kind: 'DOCUMENT', mimeType: 'application/vnd.oasis.opendocument.text' },
  '.doc': { kind: 'DOCUMENT', mimeType: 'application/msword' },
  '.docm': {
    kind: 'DOCUMENT',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  '.dotx': {
    kind: 'DOCUMENT',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  },
  '.xls': { kind: 'DOCUMENT', mimeType: 'application/vnd.ms-excel' },
  '.xlsm': {
    kind: 'DOCUMENT',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  '.xlsb': { kind: 'DOCUMENT', mimeType: 'application/vnd.ms-excel.sheet.binary.macroEnabled.12' },
  '.csv': { kind: 'DOCUMENT', mimeType: 'text/csv' },
  '.ods': { kind: 'DOCUMENT', mimeType: 'application/vnd.oasis.opendocument.spreadsheet' },
  '.ppt': { kind: 'DOCUMENT', mimeType: 'application/vnd.ms-powerpoint' },
  '.pptm': {
    kind: 'DOCUMENT',
    mimeType:
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  },
  '.ppsx': {
    kind: 'DOCUMENT',
    mimeType:
      'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
  },
  '.odp': { kind: 'DOCUMENT', mimeType: 'application/vnd.oasis.opendocument.presentation' },

  '.jpg': { kind: 'IMAGE', mimeType: 'image/jpeg' },
  '.jpeg': { kind: 'IMAGE', mimeType: 'image/jpeg' },
  '.png': { kind: 'IMAGE', mimeType: 'image/png' },
  '.webp': { kind: 'IMAGE', mimeType: 'image/webp' },
  '.gif': { kind: 'IMAGE', mimeType: 'image/gif' },
  '.avif': { kind: 'IMAGE', mimeType: 'image/avif' },
  '.mp3': { kind: 'AUDIO', mimeType: 'audio/mpeg' },
  '.wav': { kind: 'AUDIO', mimeType: 'audio/wav' },
  '.ogg': { kind: 'AUDIO', mimeType: 'audio/ogg' },
  '.m4a': { kind: 'AUDIO', mimeType: 'audio/mp4' },
  '.mp4': { kind: 'VIDEO', mimeType: 'video/mp4' },
  '.m4v': { kind: 'VIDEO', mimeType: 'video/mp4' },
  '.mov': { kind: 'VIDEO', mimeType: 'video/quicktime' },
  '.webm': { kind: 'VIDEO', mimeType: 'video/webm' },
  '.ogv': { kind: 'VIDEO', mimeType: 'video/ogg' },
  '.md': { kind: 'MARKDOWN', mimeType: 'text/markdown' },
};

export function resolveKind(filename: string): KindInfo | null {
  return EXTENSION_MAP[extname(filename).toLowerCase()] ?? null;
}

/**
 * Expo convierte el nombre del archivo a URI component antes de enviarlo en
 * multipart/form-data. La web envía el nombre original, por lo que esta
 * normalización solo se aplica cuando la petición llega con sesión móvil.
 */
export function decodeMobileFilename(filename: string): string {
  try {
    return decodeURIComponent(filename).replace(/[\\/]/g, "_");
  } catch {
    return filename.replace(/[\\/]/g, "_");
  }
}

export function isMarkdown(filename: string): boolean {
  return extname(filename).toLowerCase() === '.md';
}

export type SourceFamily =
  | 'markdown'
  | 'pdf'
  | 'word'
  | 'spreadsheet'
  | 'slides'
  | 'image'
  | 'audio'
  | 'video'
  | 'web';

const SOURCE_FAMILY_BY_EXTENSION: Record<string, SourceFamily> = {
  '.md': 'markdown',
  '.pdf': 'pdf',
  '.docx': 'word',
  '.docm': 'word',
  '.dotx': 'word',
  '.xlsx': 'spreadsheet',
  '.xlsm': 'spreadsheet',
  '.csv': 'spreadsheet',
  '.pptx': 'slides',
  '.pptm': 'slides',
  '.ppsx': 'slides',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.png': 'image',
  '.webp': 'image',
  '.gif': 'image',
  '.avif': 'image',
  '.mp3': 'audio',
  '.wav': 'audio',
  '.ogg': 'audio',
  '.m4a': 'audio',
  '.mp4': 'video',
  '.m4v': 'video',
  '.mov': 'video',
  '.webm': 'video',
  '.ogv': 'video',
};

const DEFERRED_SOURCE_EXTENSIONS = new Set([
  '.doc',
  '.odt',
  '.xls',
  '.xlsb',
  '.ods',
  '.ppt',
  '.odp',
]);

const SOURCE_FAMILY_BY_MIME: Record<string, SourceFamily> = {
  'text/markdown': 'markdown',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.template':
    'word',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    'spreadsheet',
  'text/csv': 'spreadsheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'slides',
  'application/vnd.openxmlformats-officedocument.presentationml.slideshow':
    'slides',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
  'image/avif': 'image',
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'audio/mp4': 'audio',
  'video/mp4': 'video',
  'video/quicktime': 'video',
  'video/webm': 'video',
  'video/ogg': 'video',
};

export function resolveSourceFamily(
  filename: string,
  mimeType: string,
): SourceFamily | null {
  const extension = extname(filename).toLowerCase();
  if (DEFERRED_SOURCE_EXTENSIONS.has(extension)) return null;
  return (
    SOURCE_FAMILY_BY_EXTENSION[extension] ??
    SOURCE_FAMILY_BY_MIME[mimeType] ??
    null
  );
}

export function isDeferredSource(filename: string): boolean {
  return DEFERRED_SOURCE_EXTENSIONS.has(extname(filename).toLowerCase());
}
