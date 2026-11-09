import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { TicketStatus } from '../../common/enums/ticket-status.enum.js';

export type TicketDocument = HydratedDocument<Ticket>;

@Schema({
  collection: 'Ticket',
  timestamps: true,
  versionKey: false,
})
export class Ticket {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true, maxlength: 255 })
  email: string;

  @Prop({ required: true, trim: true, maxlength: 20 })
  phone: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TicketType',
    required: true,
  })
  ticketTypeId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(TicketStatus),
    default: TicketStatus.PENDING,
  })
  status: TicketStatus;

  createdAt: Date;
  updatedAt: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

TicketSchema.index({ ticketTypeId: 1, createdAt: -1 });
