import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class ListExcursionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Показать экскурсии конкретного организатора',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'Некорректный идентификатор' })
  creatorUserId?: string;
}
