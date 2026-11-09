import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../common/enums/payment-method.enum.js';
import { PaymentStatus } from '../common/enums/payment-status.enum.js';
import { asRecord, idOf } from '../common/utils/object-id.js';

export class PaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  _id: string;

  @ApiProperty()
  ticketId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty({ enum: PaymentMethod })
  payment_method: PaymentMethod;

  @ApiPropertyOptional({ nullable: true })
  transaction_id: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export function calculateAmount(price: number, quantity: number): number {
  return Math.round(price * quantity * 100) / 100;
}

export function mapPayment(payment: unknown) {
  const source = asRecord(payment);
  const id = idOf(source._id);

  return {
    id,
    _id: id,
    ticketId: idOf(source.ticketId),
    amount: source.amount as number,
    status: source.status as PaymentStatus,
    payment_method: source.payment_method as PaymentMethod,
    transaction_id: (source.transaction_id as string | null | undefined) ?? null,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}
