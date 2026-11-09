import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsNumber, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { trimString } from '../../common/utils/transforms.js';

export class CreateTicketTypeDto {
  @ApiProperty({ example: 'Взрослый' })
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 1500, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'price должен быть числом с не более чем 2 знаками' })
  @Min(0)
  @Max(1_000_000)
  price: number;
}
