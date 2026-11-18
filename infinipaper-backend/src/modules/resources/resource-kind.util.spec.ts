import { describe, expect, it } from 'vitest';
import { decodeMobileFilename, resolveKind } from './resource-kind.util.js';

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
});
