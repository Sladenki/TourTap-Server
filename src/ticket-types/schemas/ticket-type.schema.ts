import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type TicketTypeDocument = HydratedDocument<TicketType>;

@Schema({
  collection: 'TicketType',
  timestamps: true,
  versionKey: false,
})
export class TicketType {
  _id: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Excursion',
    required: true,
  })
  excursionId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name: string;

  @Prop({ required: true, min: 0 })
  price: number;

  createdAt: Date;
  updatedAt: Date;
}

export const TicketTypeSchema = SchemaFactory.createForClass(TicketType);

TicketTypeSchema.index({ excursionId: 1, createdAt: 1 });
