import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/errors/app.exception.js';

export interface AgentSource {
  resourceId: string;
  kind: 'markdown';
  name: string;
  mimeType: string;
  size: number;
  checksum: string | null;
  url: string;
}

export interface AgentStructureRequest {
  jobId: string;
  sources: AgentSource[];
  context: {
    projectId: string;
    folderId: string;
    language: string;
    instructions?: string | null;
  };
}

export interface AgentStructureResponse {
  markdown: string;
  outline: unknown[];
  warnings: string[];
  coverage: number;
  usage: {
    model: string;
    inputTokens: number;
    outputTokens: number;
  };
  promptVersion: string;
}

@Injectable()
export class AgentClientService {
  private readonly logger = new Logger(AgentClientService.name);
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly timeoutMs: number;
  private readonly enabled: boolean;

  constructor(config: ConfigService) {
    this.baseUrl = config
      .get<string>('AGENT_SERVICE_URL', 'http://localhost:8100')
      .replace(/\/$/, '');
    this.token = config.get<string>('AGENT_SERVICE_TOKEN', 'dev-agent-token');
    this.timeoutMs = config.get<number>('AGENT_TIMEOUT_MS', 120_000);
    this.enabled =
      config.get<boolean>('AGENT_STRUCTURING_ENABLED', true) ?? true;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async structure(
    payload: AgentStructureRequest,
  ): Promise<AgentStructureResponse> {
    if (!this.enabled) {
      throw new AppException(
        'AGENT_STRUCTURING_DISABLED',
        'La estructuración con IA está desactivada',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/v1/notes/structure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const text = await response.text();
      const data = text ? (JSON.parse(text) as Record<string, unknown>) : null;

      if (!response.ok) {
        const code =
          typeof data?.code === 'string' ? data.code : 'AGENT_SERVICE_ERROR';
        const message =
          typeof data?.message === 'string'
            ? data.message
            : 'El servicio de agentes respondió con error';
        throw new AppException(
          code,
          message,
          response.status === HttpStatus.TOO_MANY_REQUESTS
            ? HttpStatus.TOO_MANY_REQUESTS
            : response.status >= 500
              ? HttpStatus.BAD_GATEWAY
              : HttpStatus.BAD_REQUEST,
          data?.details ?? null,
        );
      }

      if (!data || typeof data.markdown !== 'string') {
        throw new AppException(
          'AGENT_INVALID_OUTPUT',
          'El servicio de agentes devolvió una respuesta inválida',
          HttpStatus.BAD_GATEWAY,
        );
      }

      return data as unknown as AgentStructureResponse;
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      if ((error as Error).name === 'AbortError') {
        this.logger.error(`Agent request timed out after ${this.timeoutMs} ms`);
        throw new AppException(
          'AGENT_TIMEOUT',
          'El agente tardó demasiado en responder',
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }
      this.logger.error(
        `Agent request failed: ${(error as Error).message}`,
      );
      throw new AppException(
        'AGENT_SERVICE_UNAVAILABLE',
        'No se pudo contactar con el servicio de agentes',
        HttpStatus.BAD_GATEWAY,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
