import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { PaymentStatus } from '../common/enums/payment-status.enum.js';
import { TicketStatus } from '../common/enums/ticket-status.enum.js';
import { duplicateKeyMessage, isDuplicateKeyError } from '../common/utils/duplicate-key.js';
import { bindSession, runInTransaction } from '../database/run-transaction.js';
import { Ticket, TicketDocument } from '../tickets/schemas/ticket.schema.js';
import { TicketsService } from '../tickets/tickets.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { calculateAmount, mapPayment } from './payment.presenter.js';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from './providers/payment-provider.js';
import { Payment, PaymentDocument } from './schemas/payment.schema.js';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
    private readonly ticketsService: TicketsService,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(ticketId: Types.ObjectId, userId: Types.ObjectId, dto: CreatePaymentDto) {
    const context = await this.ticketsService.getOwnedContext(ticketId, userId);
    if (context.ticket.status === TicketStatus.CANCELLED) {
      throw new ConflictException('Нельзя оплатить отменённую регистрацию');
    }

    const amount = calculateAmount(context.ticketType.price, context.ticket.quantity);
    const transactionId = dto.transaction_id?.trim() || null;
    const providerResult = await this.paymentProvider.createPayment({
      ticketId: ticketId.toString(),
      amount,
      paymentMethod: dto.payment_method,
      transactionId,
    });

    try {
      return await runInTransaction(this.connection, async (session) => {
        const ticket = await bindSession(this.ticketModel.findById(ticketId), session).exec();
        if (!ticket) {
          throw new NotFoundException('Билет не найден');
        }
        if (ticket.status === TicketStatus.CANCELLED) {
          throw new ConflictException('Нельзя оплатить отменённую регистрацию');
        }

        const storedTransactionId = providerResult.transactionId;
        if (storedTransactionId) {
          const existing = await bindSession(
            this.paymentModel.exists({ transaction_id: storedTransactionId }),
            session,
          ).exec();
          if (existing) {
            throw new ConflictException('Платёж с таким transaction_id уже существует');
          }
        }

        const created = await this.paymentModel.create(
          [
            {
              ticketId: ticket._id,
              amount,
              status: providerResult.status,
              payment_method: dto.payment_method,
              transaction_id: storedTransactionId,
            },
          ],
          session ? { session } : undefined,
        );

        if (
          providerResult.status === PaymentStatus.SUCCEEDED &&
          ticket.status === TicketStatus.PENDING
        ) {
          await this.ticketModel.updateOne(
            { _id: ticket._id, status: TicketStatus.PENDING },
            { $set: { status: TicketStatus.CONFIRMED } },
            session ? { session } : undefined,
          );
        }

        return mapPayment(created[0]);
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException(duplicateKeyMessage(error));
      }
      throw error;
    }
  }

  async findByTicket(ticketId: Types.ObjectId, userId: Types.ObjectId) {
    await this.ticketsService.getOwnedContext(ticketId, userId);
    const payments = await this.paymentModel
      .find({ ticketId })
      .sort({ createdAt: -1 })
      .exec();

    return payments.map((payment) => mapPayment(payment));
  }

  async findOne(id: Types.ObjectId, userId: Types.ObjectId) {
    const payment = await this.paymentModel.findById(id).exec();
    if (!payment) {
      throw new NotFoundException('Платёж не найден');
    }

    await this.ticketsService.getOwnedContext(payment.ticketId, userId);
    return mapPayment(payment);
  }
}
