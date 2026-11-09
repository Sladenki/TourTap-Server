import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Проверка, что API запущен' })
  @ApiOkResponse({ schema: { example: { status: 'ok', service: 'tour-tap' } } })
  getStatus() {
    return this.appService.getStatus();
  }
}
