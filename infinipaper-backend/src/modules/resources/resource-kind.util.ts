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
