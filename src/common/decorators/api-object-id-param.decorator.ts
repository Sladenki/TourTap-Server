import { applyDecorators } from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';

export const ApiObjectIdParam = (name: string) =>
  applyDecorators(
    ApiParam({
      name,
      description: 'MongoDB ObjectId',
      example: '507f1f77bcf86cd799439011',
    }),
  );
