import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { toPublicUser } from '../common/presenters/user.presenter.js';
import { DUMMY_PASSWORD_HASH, verifyPassword } from '../common/utils/password.js';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

const INVALID_CREDENTIALS = 'Неверный email или пароль';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    return {
      accessToken: await this.sign(user._id),
      user: toPublicUser(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    const passwordHash = user?.password ?? DUMMY_PASSWORD_HASH;
    const matches = await verifyPassword(dto.password, passwordHash);

    if (!user || !matches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    return {
      accessToken: await this.sign(user._id),
      user: toPublicUser(user),
    };
  }

  me(userId: Types.ObjectId) {
    return this.usersService.getById(userId);
  }

  private sign(userId: Types.ObjectId) {
    return this.jwtService.signAsync({ sub: userId.toString() });
  }
}
