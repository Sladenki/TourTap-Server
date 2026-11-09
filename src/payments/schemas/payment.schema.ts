import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { PaymentMethod } from '../../common/enums/payment-method.enum.js';
import { PaymentStatus } from '../../common/enums/payment-status.enum.js';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({
  collection: 'Payment',
  timestamps: true,
  versionKey: false,
})
export class Payment {
  _id: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
  })
  ticketId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ type: String, required: true, enum: Object.values(PaymentStatus) })
  status: PaymentStatus;

  @Prop({ type: String, required: true, enum: Object.values(PaymentMethod) })
  payment_method: PaymentMethod;

  @Prop({ type: String, default: null, maxlength: 128 })
  transaction_id: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ ticketId: 1, createdAt: -1 });
PaymentSchema.index(
  { transaction_id: 1 },
  {
    unique: true,
    partialFilterExpression: { transaction_id: { $type: 'string' } },
  },
);
