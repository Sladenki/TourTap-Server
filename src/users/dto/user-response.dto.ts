import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LegalType } from '../../common/enums/legal-type.enum.js';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional({ nullable: true })
  inn: string | null;

  @ApiPropertyOptional({ nullable: true })
  registry_number: string | null;

  @ApiProperty({ enum: LegalType })
  legal_type: LegalType;

  @ApiProperty()
  city: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}

export class SuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}
