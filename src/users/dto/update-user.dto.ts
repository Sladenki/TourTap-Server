import { PartialType, PickType } from '@nestjs/swagger';
import { RegisterDto } from '../../auth/dto/register.dto.js';

export class UpdateUserDto extends PartialType(
  PickType(RegisterDto, [
    'name',
    'email',
    'phone',
    'inn',
    'registry_number',
    'legal_type',
    'city',
  ] as const),
) {}
