import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('config')
@Controller('config')
export class ConfigController {
  constructor(private readonly config: ConfigService) {}

  @Public()
  @Get()
  getConfig() {
    return {
      maxUploadSizeMb: this.config.get<number>('MAX_UPLOAD_SIZE_MB') ?? 50,
      avisoFilename: this.config.get<string>('AVISO_FILENAME') ?? 'aviso.md',
    };
  }
}
