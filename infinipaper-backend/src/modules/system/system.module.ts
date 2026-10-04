import { Module } from '@nestjs/common';
import { ConfigController } from '../config/config.controller.js';
import { HealthController } from '../health/health.controller.js';

@Module({
  controllers: [HealthController, ConfigController],
})
export class SystemModule {}
