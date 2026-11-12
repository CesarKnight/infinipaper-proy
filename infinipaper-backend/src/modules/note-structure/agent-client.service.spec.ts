import { HttpStatus } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppException } from '../../common/errors/app.exception.js';
import { AgentClientService } from './agent-client.service.js';

function makeClient(
  overrides: Record<string, unknown> = {},
): AgentClientService {
  const config = {
    get: vi.fn((key: string, fallback: unknown) =>
      key in overrides ? overrides[key] : fallback,
    ),
  };
  return new AgentClientService(config as never);
}

describe('AgentClientService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects with AGENT_STRUCTURING_DISABLED when the flag is off', async () => {
    let caught: unknown;
    try {
      await makeClient({ AGENT_STRUCTURING_ENABLED: false }).structure({
        jobId: 'job-1',
        sources: [],
        context: { projectId: 'p', folderId: 'f', language: 'es' },
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(AppException);
    expect((caught as AppException).code).toBe('AGENT_STRUCTURING_DISABLED');
    expect((caught as AppException).getStatus()).toBe(
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  });

  it('maps an aborted request to AGENT_TIMEOUT', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => {
              const error = new Error('aborted');
              error.name = 'AbortError';
              reject(error);
            });
          }),
      ),
    );

    let caught: unknown;
    try {
      await makeClient({ AGENT_TIMEOUT_MS: 5 }).structure({
        jobId: 'job-1',
        sources: [],
        context: { projectId: 'p', folderId: 'f', language: 'es' },
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(AppException);
    expect((caught as AppException).code).toBe('AGENT_TIMEOUT');
    expect((caught as AppException).getStatus()).toBe(
      HttpStatus.GATEWAY_TIMEOUT,
    );
  });

  it('preserves AGENT_RATE_LIMITED and HTTP 429', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 'AGENT_RATE_LIMITED',
            message: 'Límite del proveedor',
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    );

    let caught: unknown;
    try {
      await makeClient().structure({
        jobId: 'job-1',
        sources: [],
        context: { projectId: 'p', folderId: 'f', language: 'es' },
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(AppException);
    expect((caught as AppException).code).toBe('AGENT_RATE_LIMITED');
    expect((caught as AppException).getStatus()).toBe(
      HttpStatus.TOO_MANY_REQUESTS,
    );
  });
});
