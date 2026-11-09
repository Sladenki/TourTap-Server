import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { ExcursionsModule } from '../excursions/excursions.module.js';
import { ExcursionTicketsController, TicketsController } from './tickets.controller.js';
import { TicketsService } from './tickets.service.js';

@Module({
  imports: [DatabaseModule, ExcursionsModule],
  controllers: [ExcursionTicketsController, TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
