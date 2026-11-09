import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsMongoId,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { normalizeEmail, trimString } from '../../common/utils/transforms.js';

const PHONE = /^\+?[1-9]\d{9,14}$/;

export class CreateTicketDto {
  @ApiProperty({ example: 'Иван Иванов' })
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'guest@example.com' })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Некорректный email' })
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: '+79991234567' })
  @Transform(trimString)
  @Matches(PHONE, { message: 'Некорректный телефон' })
  phone: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId({ message: 'Некорректный идентификатор типа билета' })
  ticketTypeId: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @Type(() => Number)
  @IsInt({ message: 'quantity должен быть целым числом' })
  @Min(1, { message: 'quantity должен быть не меньше 1' })
  @Max(1000)
  quantity: number;
}
