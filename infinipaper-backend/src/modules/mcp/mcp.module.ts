import { Module } from '@nestjs/common';
import {
  McpRevokeController,
  McpTokenController,
  McpToolsController,
} from './mcp.controller.js';
import { McpService } from './mcp.service.js';

@Module({
  controllers: [McpTokenController, McpRevokeController, McpToolsController],
  providers: [McpService],
  exports: [McpService],
})
export class McpModule {}
