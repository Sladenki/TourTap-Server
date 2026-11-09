import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RegisterDto } from '../auth/dto/register.dto.js';
import {
  duplicateKeyMessage,
  isDuplicateKeyError,
} from '../common/utils/duplicate-key.js';
import { hashPassword, verifyPassword } from '../common/utils/password.js';
import { toPublicUser } from '../common/presenters/user.presenter.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User, UserDocument } from './schemas/user.schema.js';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async create(dto: RegisterDto) {
    try {
      return await this.userModel.create({
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        inn: dto.inn ?? null,
        registry_number: dto.registry_number ?? null,
        legal_type: dto.legal_type,
        city: dto.city,
        password: await hashPassword(dto.password),
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException(duplicateKeyMessage(error));
      }
      throw error;
    }
  }

  findByEmailWithPassword(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).select('+password').exec();
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async getById(id: Types.ObjectId) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return toPublicUser(user);
  }

  async updateMe(id: Types.ObjectId, dto: UpdateUserDto) {
    const update: Record<string, unknown> = {};

    if (dto.name !== undefined) update.name = dto.name;
    if (dto.email !== undefined) update.email = dto.email;
    if (dto.phone !== undefined) update.phone = dto.phone;
    if (dto.inn !== undefined) update.inn = dto.inn;
    if (dto.registry_number !== undefined) update.registry_number = dto.registry_number;
    if (dto.legal_type !== undefined) update.legal_type = dto.legal_type;
    if (dto.city !== undefined) update.city = dto.city;

    try {
      const user = await this.userModel
        .findByIdAndUpdate(id, { $set: update }, { returnDocument: 'after' })
        .exec();

      if (!user) {
        throw new NotFoundException('Пользователь не найден');
      }

      return toPublicUser(user);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException(duplicateKeyMessage(error));
      }
      throw error;
    }
  }

  async changePassword(id: Types.ObjectId, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(id).select('+password').exec();
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const matches = await verifyPassword(dto.currentPassword, user.password);
    if (!matches) {
      throw new BadRequestException('Текущий пароль указан неверно');
    }

    user.password = await hashPassword(dto.newPassword);
    await user.save();

    return { success: true };
  }
}
