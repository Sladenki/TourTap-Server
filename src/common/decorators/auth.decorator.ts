import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard.js';

export const Auth = () =>
  applyDecorators(
    UseGuards(AuthGuard),
    ApiBearerAuth('bearer'),
    ApiUnauthorizedResponse({
      description: 'Требуется авторизация или токен недействителен',
    }),
  );
