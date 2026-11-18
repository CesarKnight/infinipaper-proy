import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/errors/app.exception.js';
import { HttpStatus } from '@nestjs/common';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly provider: string;
  private readonly model: string;
  private readonly dimensions: number;
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(config: ConfigService) {
    this.provider = (config.get<string>('EMBEDDING_PROVIDER') ?? 'local').toLowerCase();
    this.model = config.get<string>('EMBEDDING_MODEL') ?? 'local-hash';
    this.dimensions = config.get<number>('EMBEDDING_DIMENSIONS') ?? 1536;
    this.baseUrl = (config.get<string>('EMBEDDING_BASE_URL') ?? '').replace(/\/$/, '');
    this.apiKey = config.get<string>('EMBEDDING_API_KEY') ?? '';
  }

  async embed(text: string): Promise<number[]> {
    if (this.provider === 'local') return this.localEmbedding(text);
    if (this.provider === 'openai-compatible') {
      return this.openAiEmbedding(text);
    }
    throw new AppException(
      'EMBEDDING_PROVIDER_UNSUPPORTED',
      `Proveedor de embeddings no soportado: ${this.provider}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  vectorLiteral(values: number[]): string {
    return `[${values.map((value) => value.toFixed(8)).join(',')}]`;
  }

  private localEmbedding(text: string): number[] {
    const vector = Array.from<number>({ length: this.dimensions }).fill(0);
    const tokens = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[^a-z0-9áéíóúüñ]+/i)
      .filter((token) => token.length > 1);
    for (const token of tokens) {
      const digest = createHash('sha256').update(token).digest();
      const index = digest.readUInt32BE(0) % this.dimensions;
      vector[index] += 1;
    }
    const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    return norm ? vector.map((value) => value / norm) : vector;
  }

  private async openAiEmbedding(text: string): Promise<number[]> {
    if (!this.baseUrl) {
      throw new AppException(
        'EMBEDDING_NOT_CONFIGURED',
        'Falta EMBEDDING_BASE_URL para el proveedor de embeddings',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({ model: this.model, input: text }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as {
        data?: Array<{ embedding?: number[] }>;
      };
      const embedding = data.data?.[0]?.embedding;
      if (!Array.isArray(embedding) || embedding.length !== this.dimensions) {
        throw new Error('embedding inválido');
      }
      return embedding;
    } catch (error) {
      this.logger.warn(`Embedding provider failed: ${(error as Error).message}`);
      throw new AppException(
        'EMBEDDING_PROVIDER_ERROR',
        'No se pudo calcular el embedding; se usará búsqueda léxica',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
