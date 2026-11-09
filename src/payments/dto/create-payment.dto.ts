import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaymentMethod } from '../../common/enums/payment-method.enum.js';
import { trimString } from '../../common/utils/transforms.js';

export class CreatePaymentDto {
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CARD })
  @IsEnum(PaymentMethod, { message: 'Некорректный способ оплаты' })
  payment_method: PaymentMethod;

  @ApiPropertyOptional({ nullable: true, example: 'txn_1001' })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(128)
  transaction_id?: string | null;
}
