import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus } from '../common/enums/ticket-status.enum.js';
import { asRecord, idOf } from '../common/utils/object-id.js';
import { mapTicketType } from '../ticket-types/ticket-type.presenter.js';

export class TicketTypeSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  excursionId: string;
}

export class TicketExcursionSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  meeting_point: string;
}

export class TicketResponseDto {
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

  @ApiProperty()
  ticketTypeId: string;

  @ApiPropertyOptional({ type: TicketTypeSummaryDto })
  ticketType?: TicketTypeSummaryDto;

  @ApiPropertyOptional({ type: TicketExcursionSummaryDto })
  excursion?: TicketExcursionSummaryDto;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ enum: TicketStatus })
  status: TicketStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedTicketsDto {
  @ApiProperty({ type: [TicketResponseDto] })
  items: TicketResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

function isPopulatedType(value: unknown): boolean {
  return Boolean(value) && typeof value === 'object' && 'name' in (value as object) && 'price' in (value as object);
}

export function mapTicket(ticket: unknown) {
  const source = asRecord(ticket);
  const id = idOf(source._id);
  const populatedType = isPopulatedType(source.ticketTypeId)
    ? mapTicketType(source.ticketTypeId)
    : undefined;
  const typeSource = populatedType ? asRecord(source.ticketTypeId) : undefined;
  const excursionSource =
    typeSource && typeof typeSource.excursionId === 'object' && typeSource.excursionId
      ? asRecord(typeSource.excursionId)
      : undefined;

  return {
    id,
    _id: id,
    name: source.name,
    email: source.email,
    phone: source.phone,
    ticketTypeId: populatedType?.id ?? idOf(source.ticketTypeId),
    ...(populatedType
      ? {
          ticketType: {
            id: populatedType.id,
            name: populatedType.name,
            price: populatedType.price,
            excursionId: excursionSource ? idOf(excursionSource._id) : populatedType.excursionId,
          },
        }
      : {}),
    ...(excursionSource
      ? {
          excursion: {
            id: idOf(excursionSource._id),
            title: excursionSource.title,
            date: excursionSource.date,
            meeting_point: excursionSource.meeting_point,
          },
        }
      : {}),
    quantity: source.quantity,
    status: source.status,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}
