import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';

export function normalizeJwtSecret(raw: string | undefined): string {
  if (!raw) {
    return '';
  }

  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

export const getJwtConfig = (configService: ConfigService): JwtModuleOptions => {
  const expiresIn = (configService.get<string>('JWT_EXPIRES_IN')?.trim() ||
    '7d') as SignOptions['expiresIn'];

  return {
    secret: normalizeJwtSecret(configService.get<string>('JWT_SECRET')),
    signOptions: { expiresIn },
  };
};
