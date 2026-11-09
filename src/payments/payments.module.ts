import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { TicketsModule } from '../tickets/tickets.module.js';
import { PaymentsController, TicketPaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { ManualPaymentProvider } from './providers/manual-payment.provider.js';
import { PAYMENT_PROVIDER } from './providers/payment-provider.js';

@Module({
  imports: [DatabaseModule, TicketsModule],
  controllers: [TicketPaymentsController, PaymentsController],
  providers: [
    PaymentsService,
    ManualPaymentProvider,
    { provide: PAYMENT_PROVIDER, useExisting: ManualPaymentProvider },
  ],
})
export class PaymentsModule {}
