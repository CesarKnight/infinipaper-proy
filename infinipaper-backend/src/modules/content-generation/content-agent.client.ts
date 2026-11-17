import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/errors/app.exception.js';

export interface ContentAgentSource {
  resourceId: string;
  kind: 'markdown';
  name: string;
  mimeType: string;
  size: number;
  checksum: string | null;
  url: string;
}

export interface ContentAgentResponse {
  data: Record<string, unknown>;
  warnings: string[];
  usage: {
    model: string;
    inputTokens: number;
    outputTokens: number;
  };
  promptVersion: string;
}

@Injectable()
export class ContentAgentClient {
  private readonly logger = new Logger(ContentAgentClient.name);
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
    this.enabled = config.get<boolean>('AGENT_CONTENT_ENABLED', true) ?? true;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async generate(
    kind: 'mindmap' | 'quiz',
    payload: {
      jobId: string;
      sources: ContentAgentSource[];
      context: {
        projectId: string;
        folderId: string;
        language: string;
        instructions?: string | null;
      };
      config?: Record<string, unknown>;
    },
  ): Promise<ContentAgentResponse> {
    if (!this.enabled) {
      throw new AppException(
        'AGENT_CONTENT_DISABLED',
        'La generación con IA está desactivada',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const path = kind === 'mindmap' ? 'mindmaps' : 'quizzes';

    try {
      const response = await fetch(`${this.baseUrl}/v1/${path}/generate`, {
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
        throw new AppException(
          typeof data?.code === 'string' ? data.code : 'AGENT_SERVICE_ERROR',
          typeof data?.message === 'string'
            ? data.message
            : 'El servicio de agentes respondió con error',
          response.status >= 500
            ? HttpStatus.BAD_GATEWAY
            : HttpStatus.BAD_REQUEST,
          data?.details ?? null,
        );
      }

      const payloadKey = kind === 'mindmap' ? 'mindmap' : 'quiz';
      const result = data?.[payloadKey];
      if (!result || typeof result !== 'object') {
        throw new AppException(
          'AGENT_INVALID_OUTPUT',
          'El servicio de agentes devolvió una respuesta inválida',
          HttpStatus.BAD_GATEWAY,
        );
      }
      return {
        data: result as Record<string, unknown>,
        warnings: Array.isArray(data?.warnings)
          ? data.warnings.map((item) => String(item))
          : [],
        usage: (data?.usage as ContentAgentResponse['usage']) ?? {
          model: '',
          inputTokens: 0,
          outputTokens: 0,
        },
        promptVersion:
          typeof data?.promptVersion === 'string' ? data.promptVersion : '',
      };
    } catch (error) {
      if (error instanceof AppException) throw error;
      if ((error as Error).name === 'AbortError') {
        throw new AppException(
          'AGENT_TIMEOUT',
          'El agente tardó demasiado en responder',
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }
      this.logger.error(`Content agent request failed: ${(error as Error).message}`);
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
