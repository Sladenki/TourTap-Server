import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { WebsiteStatus } from '../../common/enums/website-status.enum.js';

export type ExcursionDocument = HydratedDocument<Excursion>;

@Schema({
  collection: 'Excursion',
  timestamps: true,
  versionKey: false,
})
export class Excursion {
  _id: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  creatorUserId: Types.ObjectId;

  @Prop({ type: String, trim: true, maxlength: 64 })
  webSiteId?: string | null;

  @Prop({ required: true, trim: true, maxlength: 200 })
  title: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true, trim: true, maxlength: 300 })
  meeting_point: string;

  @Prop({ required: true, trim: true })
  timeFrom: string;

  @Prop({ required: true, trim: true })
  timeTo: string;

  @Prop({ required: true, trim: true, maxlength: 5000 })
  description: string;

  @Prop({ required: true, min: 1 })
  maxGroupSize: number;

  @Prop({ type: Number, default: 0, min: 0 })
  reservedSeats: number;

  @Prop({ type: String, trim: true, maxlength: 500 })
  urlWebSite?: string | null;

  @Prop({ type: String, enum: Object.values(WebsiteStatus) })
  statusWebSite?: WebsiteStatus | null;

  createdAt: Date;
  updatedAt: Date;
}

export const ExcursionSchema = SchemaFactory.createForClass(Excursion);

ExcursionSchema.index({ creatorUserId: 1, date: -1 });
ExcursionSchema.index({ date: -1 });
