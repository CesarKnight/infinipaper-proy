import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/errors/app.exception.js';

export interface AsrResult {
  text: string;
}

@Injectable()
export class AsrService {
  private readonly logger = new Logger(AsrService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly defaultLanguage: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>('ASR_URL') ?? 'http://localhost:8000';
    this.apiKey = config.get<string>('ASR_API_KEY') ?? '';
    this.defaultLanguage = config.get<string>('ASR_DEFAULT_LANGUAGE') ?? 'es';
  }

  async transcribe(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    language?: string,
  ): Promise<AsrResult> {
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(buffer)], { type: mimeType }), filename);
    form.append('model', 'whisper-1');
    form.append('language', language ?? this.defaultLanguage);
    form.append('response_format', 'json');

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/v1/audio/transcriptions`, {
        method: 'POST',
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
        body: form,
      });
    } catch (error) {
      this.logger.error(`ASR request failed: ${(error as Error).message}`);
      throw new AppException('ASR_SERVICE_ERROR', 'El servicio ASR no responde', 502);
    }

    if (!response.ok) {
      throw new AppException(
        'ASR_SERVICE_ERROR',
        `El servicio ASR respondió ${response.status}`,
        502,
      );
    }

    const data = (await response.json()) as { text?: string };
    return { text: data.text ?? '' };
  }
}
