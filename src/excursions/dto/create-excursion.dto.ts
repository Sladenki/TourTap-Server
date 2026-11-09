import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { WebsiteStatus } from '../../common/enums/website-status.enum.js';
import { trimString } from '../../common/utils/transforms.js';

const TIME_24H = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateExcursionDto {
  @ApiPropertyOptional({ example: 'site-42', description: 'Внешний идентификатор сайта' })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(64)
  webSiteId?: string;

  @ApiProperty({ example: 'Вечерний Калининград' })
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: '2026-07-01T15:00:00.000Z' })
  @IsDateString({}, { message: 'date должна быть датой в формате ISO 8601' })
  date: string;

  @ApiProperty({ example: 'Площадь Победы' })
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  meeting_point: string;

  @ApiProperty({ example: '15:00' })
  @Matches(TIME_24H, { message: 'timeFrom должен быть в формате HH:mm' })
  timeFrom: string;

  @ApiProperty({ example: '18:00' })
  @Matches(TIME_24H, { message: 'timeTo должен быть в формате HH:mm' })
  timeTo: string;

  @ApiProperty({ example: 'Пешая прогулка по историческому центру' })
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  description: string;

  @ApiProperty({ example: 20, minimum: 1 })
  @Type(() => Number)
  @IsInt({ message: 'maxGroupSize должен быть целым числом' })
  @Min(1)
  @Max(10000)
  maxGroupSize: number;

  @ApiPropertyOptional({ example: 'https://example.com/tours/kaliningrad' })
  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'urlWebSite должен быть абсолютным URL' })
  @MaxLength(500)
  urlWebSite?: string;

  @ApiPropertyOptional({ enum: WebsiteStatus, example: WebsiteStatus.DRAFT })
  @IsOptional()
  @IsEnum(WebsiteStatus, { message: 'Некорректный statusWebSite' })
  statusWebSite?: WebsiteStatus;
}
