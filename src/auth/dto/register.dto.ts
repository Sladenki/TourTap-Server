import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { LegalType } from '../../common/enums/legal-type.enum.js';
import { normalizeEmail, trimString } from '../../common/utils/transforms.js';

const PHONE = /^\+?[1-9]\d{9,14}$/;
const INN = /^\d{10}$|^\d{12}$/;

export class RegisterDto {
  @ApiProperty({ example: 'Иван Иванов' })
  @Transform(trimString)
  @IsString()
  @MinLength(2, { message: 'Имя должно содержать минимум 2 символа' })
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'ivan@example.com' })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Некорректный email' })
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: '+79991234567' })
  @Transform(trimString)
  @Matches(PHONE, { message: 'Некорректный телефон' })
  phone: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  @MaxLength(72)
  password: string;

  @ApiPropertyOptional({ example: '123456789012' })
  @IsOptional()
  @Transform(trimString)
  @Matches(INN, { message: 'ИНН должен содержать 10 или 12 цифр' })
  inn?: string;

  @ApiPropertyOptional({ example: 'РТО-000123' })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(100)
  registry_number?: string;

  @ApiProperty({ enum: LegalType, example: LegalType.SOLE_PROPRIETOR })
  @IsEnum(LegalType, { message: 'Некорректный legal_type' })
  legal_type: LegalType;

  @ApiProperty({ example: 'Калининград' })
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  city: string;
}
