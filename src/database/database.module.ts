import { Module, OnModuleInit } from '@nestjs/common';
import { InjectConnection, MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Excursion, ExcursionSchema } from '../excursions/schemas/excursion.schema.js';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema.js';
import { TicketType, TicketTypeSchema } from '../ticket-types/schemas/ticket-type.schema.js';
import { Ticket, TicketSchema } from '../tickets/schemas/ticket.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Excursion.name, schema: ExcursionSchema },
      { name: TicketType.name, schema: TicketTypeSchema },
      { name: Ticket.name, schema: TicketSchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule implements OnModuleInit {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    await this.connection.syncIndexes();
  }
}
