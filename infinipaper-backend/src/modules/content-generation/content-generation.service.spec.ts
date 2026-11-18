import { describe, expect, it } from 'vitest';
import { buildActiveKey } from './content-generation.service.js';

describe('content generation deduplication', () => {
  it('genera la misma clave para configuraciones equivalentes', () => {
    const first = buildActiveKey(
      'QUIZ',
      'folder-1',
      { type: 'FOLDER', id: 'source-1' },
      { count: 10, difficulty: 'medium', instructions: null },
    );
    const second = buildActiveKey(
      'QUIZ',
      'folder-1',
      { type: 'FOLDER', id: 'source-1' },
      { instructions: null, difficulty: 'medium', count: 10 },
    );
    expect(first).toBe(second);
  });

  it('distingue tipo, carpeta, fuente y configuración', () => {
    const base = buildActiveKey(
      'QUIZ',
      'folder-1',
      { type: 'FOLDER', id: 'source-1' },
      { count: 10 },
    );
    expect(
      buildActiveKey('MINDMAP', 'folder-1', { type: 'FOLDER', id: 'source-1' }, {
        count: 10,
      }),
    ).not.toBe(base);
    expect(
      buildActiveKey('QUIZ', 'folder-2', { type: 'FOLDER', id: 'source-1' }, {
        count: 10,
      }),
    ).not.toBe(base);
    expect(
      buildActiveKey('QUIZ', 'folder-1', { type: 'RESOURCE', id: 'source-1' }, {
        count: 10,
      }),
    ).not.toBe(base);
    expect(
      buildActiveKey('QUIZ', 'folder-1', { type: 'FOLDER', id: 'source-1' }, {
        count: 20,
      }),
    ).not.toBe(base);
  });
});
