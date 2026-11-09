import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { LegalType } from '../../common/enums/legal-type.enum.js';

export type UserDocument = HydratedDocument<User>;

@Schema({
  collection: 'User',
  timestamps: true,
  versionKey: false,
})
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true, maxlength: 255 })
  email: string;

  @Prop({ required: true, trim: true, maxlength: 20 })
  phone: string;

  @Prop({ type: String, trim: true, maxlength: 12 })
  inn?: string | null;

  @Prop({ type: String, trim: true, maxlength: 100 })
  registry_number?: string | null;

  @Prop({ type: String, required: true, enum: Object.values(LegalType) })
  legal_type: LegalType;

  @Prop({ required: true, trim: true, maxlength: 120 })
  city: string;

  @Prop({ required: true, select: false })
  password: string;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { unique: true });
