import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { ExcursionsController } from './excursions.controller.js';
import { ExcursionsService } from './excursions.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [ExcursionsController],
  providers: [ExcursionsService],
  exports: [ExcursionsService],
})
export class ExcursionsModule {}
