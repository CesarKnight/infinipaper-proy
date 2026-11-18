import { describe, expect, it } from 'vitest';
import {
  decodeMobileFilename,
  isDeferredSource,
  resolveKind,
  resolveSourceFamily,
} from './resource-kind.util.js';

describe('resource-kind util', () => {
  it('resuelve el tipo por extensión', () => {
    expect(resolveKind('Tema 1.MD')).toEqual({
      kind: 'MARKDOWN',
      mimeType: 'text/markdown',
    });
    expect(resolveKind('documento.txt')).toBeNull();
  });

  it('decodifica nombres enviados por Expo sin permitir separadores', () => {
    expect(decodeMobileFilename('Diagrama%20de%20clases.md')).toBe(
      'Diagrama de clases.md',
    );
    expect(decodeMobileFilename('carpeta%2Ftema%5Cuno.md')).toBe(
      'carpeta_tema_uno.md',
    );
  });

  it('mantiene nombres con porcentajes inválidos', () => {
    expect(decodeMobileFilename('100% seguro.md')).toBe('100% seguro.md');
  });

  it('resuelve familias de fuente para generación', () => {
    expect(resolveSourceFamily('tema.pdf', 'application/pdf')).toBe('pdf');
    expect(
      resolveSourceFamily(
        'tema.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
    ).toBe('word');
    expect(
      resolveSourceFamily(
        'notas.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ),
    ).toBe('spreadsheet');
    expect(
      resolveSourceFamily(
        'clase.pptx',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ),
    ).toBe('slides');
    expect(resolveSourceFamily('foto.png', 'image/png')).toBe('image');
    expect(resolveSourceFamily('audio.mp3', 'audio/mpeg')).toBe('audio');
    expect(resolveSourceFamily('video.mp4', 'video/mp4')).toBe('video');
  });

  it('difiere formatos legacy y ODF', () => {
    expect(isDeferredSource('viejo.doc')).toBe(true);
    expect(isDeferredSource('datos.xlsb')).toBe(true);
    expect(resolveSourceFamily('viejo.doc', 'application/msword')).toBeNull();
  });
});
