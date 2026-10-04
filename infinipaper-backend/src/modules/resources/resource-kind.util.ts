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
  '.jpg': { kind: 'IMAGE', mimeType: 'image/jpeg' },
  '.jpeg': { kind: 'IMAGE', mimeType: 'image/jpeg' },
  '.png': { kind: 'IMAGE', mimeType: 'image/png' },
  '.webp': { kind: 'IMAGE', mimeType: 'image/webp' },
  '.gif': { kind: 'IMAGE', mimeType: 'image/gif' },
  '.mp3': { kind: 'AUDIO', mimeType: 'audio/mpeg' },
  '.wav': { kind: 'AUDIO', mimeType: 'audio/wav' },
  '.ogg': { kind: 'AUDIO', mimeType: 'audio/ogg' },
  '.m4a': { kind: 'AUDIO', mimeType: 'audio/mp4' },
  '.mp4': { kind: 'VIDEO', mimeType: 'video/mp4' },
  '.webm': { kind: 'VIDEO', mimeType: 'video/webm' },
  '.md': { kind: 'MARKDOWN', mimeType: 'text/markdown' },
};

export function resolveKind(filename: string): KindInfo | null {
  return EXTENSION_MAP[extname(filename).toLowerCase()] ?? null;
}

export function isMarkdown(filename: string): boolean {
  return extname(filename).toLowerCase() === '.md';
}
