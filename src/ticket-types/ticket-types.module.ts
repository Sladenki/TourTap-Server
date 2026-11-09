import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { ExcursionsModule } from '../excursions/excursions.module.js';
import {
  ExcursionTicketTypesController,
  TicketTypesController,
} from './ticket-types.controller.js';
import { TicketTypesService } from './ticket-types.service.js';

@Module({
  imports: [DatabaseModule, ExcursionsModule],
  controllers: [ExcursionTicketTypesController, TicketTypesController],
  providers: [TicketTypesService],
  exports: [TicketTypesService],
})
export class TicketTypesModule {}
