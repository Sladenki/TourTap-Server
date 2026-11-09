import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WebsiteStatus } from '../common/enums/website-status.enum.js';
import { toPublicCreator } from '../common/presenters/user.presenter.js';
import { asRecord, idOf } from '../common/utils/object-id.js';
import { TicketTypeResponseDto } from '../ticket-types/dto/ticket-type-response.dto.js';
import { mapTicketType } from '../ticket-types/ticket-type.presenter.js';

export class CreatorResponseDto {
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
  legal_type: string;

  @ApiProperty()
  city: string;
}

export class ExcursionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  _id: string;

  @ApiProperty()
  creatorUserId: string;

  @ApiPropertyOptional({ type: CreatorResponseDto })
  creator?: CreatorResponseDto;

  @ApiPropertyOptional({ nullable: true })
  webSiteId: string | null;

  @ApiProperty()
  title: string;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  meeting_point: string;

  @ApiProperty()
  timeFrom: string;

  @ApiProperty()
  timeTo: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  maxGroupSize: number;

  @ApiProperty()
  reservedSeats: number;

  @ApiProperty()
  seatsAvailable: number;

  @ApiPropertyOptional({ nullable: true })
  urlWebSite: string | null;

  @ApiPropertyOptional({ enum: WebsiteStatus, nullable: true })
  statusWebSite: WebsiteStatus | null;

  @ApiPropertyOptional({ type: [TicketTypeResponseDto] })
  ticketTypes?: TicketTypeResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedExcursionsDto {
  @ApiProperty({ type: [ExcursionResponseDto] })
  items: ExcursionResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

function isPopulatedUser(value: unknown): boolean {
  return Boolean(value) && typeof value === 'object' && 'email' in (value as object);
}

export function mapExcursion(excursion: unknown, ticketTypes?: unknown[]) {
  const source = asRecord(excursion);
  const id = idOf(source._id);
  const creator = isPopulatedUser(source.creatorUserId)
    ? toPublicCreator(source.creatorUserId)
    : undefined;
  const reservedSeats = Number(source.reservedSeats ?? 0);
  const maxGroupSize = Number(source.maxGroupSize);

  return {
    id,
    _id: id,
    creatorUserId: creator?.id ?? idOf(source.creatorUserId),
    ...(creator ? { creator } : {}),
    webSiteId: (source.webSiteId as string | null | undefined) ?? null,
    title: source.title,
    date: source.date,
    meeting_point: source.meeting_point,
    timeFrom: source.timeFrom,
    timeTo: source.timeTo,
    description: source.description,
    maxGroupSize,
    reservedSeats,
    seatsAvailable: Math.max(0, maxGroupSize - reservedSeats),
    urlWebSite: (source.urlWebSite as string | null | undefined) ?? null,
    statusWebSite: (source.statusWebSite as WebsiteStatus | null | undefined) ?? null,
    ...(ticketTypes ? { ticketTypes: ticketTypes.map((item) => mapTicketType(item)) } : {}),
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}
