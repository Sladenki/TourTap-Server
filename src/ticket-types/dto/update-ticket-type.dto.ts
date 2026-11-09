import { PartialType } from '@nestjs/swagger';
import { CreateTicketTypeDto } from './create-ticket-type.dto.js';

export class UpdateTicketTypeDto extends PartialType(CreateTicketTypeDto) {}
