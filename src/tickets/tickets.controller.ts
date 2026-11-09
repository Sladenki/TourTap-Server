import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { ApiObjectIdParam } from '../common/decorators/api-object-id-param.decorator.js';
import { Auth } from '../common/decorators/auth.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { PaginatedTicketsDto, TicketResponseDto } from './ticket.presenter.js';
import { TicketsService } from './tickets.service.js';

@ApiTags('Tickets')
@Controller('excursions/:excursionId/tickets')
export class ExcursionTicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Регистрация на экскурсию',
    description: 'Публичный endpoint. Свободные места проверяет сервер.',
  })
  @ApiObjectIdParam('excursionId')
  @ApiCreatedResponse({ type: TicketResponseDto })
  @ApiBadRequestResponse({
    description: 'Некорректные данные или тип билета не относится к экскурсии',
  })
  @ApiNotFoundResponse({ description: 'Экскурсия или тип билета не найдены' })
  @ApiConflictResponse({ description: 'Недостаточно свободных мест' })
  create(
    @Param('excursionId', ParseObjectIdPipe) excursionId: Types.ObjectId,
    @Body() dto: CreateTicketDto,
  ) {
    return this.ticketsService.create(excursionId, dto);
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: 'Участники своей экскурсии' })
  @ApiObjectIdParam('excursionId')
  @ApiOkResponse({ type: PaginatedTicketsDto })
  @ApiForbiddenResponse({ description: 'Экскурсия принадлежит другому пользователю' })
  findAll(
    @Param('excursionId', ParseObjectIdPipe) excursionId: Types.ObjectId,
    @CurrentUser('_id') userId: Types.ObjectId,
    @Query() query: PaginationQueryDto,
  ) {
    return this.ticketsService.findByExcursion(excursionId, userId, query);
  }
}

@ApiTags('Tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Регистрация своей экскурсии' })
  @ApiObjectIdParam('id')
  @ApiOkResponse({ type: TicketResponseDto })
  @ApiForbiddenResponse({ description: 'Билет принадлежит чужой экскурсии' })
  @ApiNotFoundResponse({ description: 'Билет не найден' })
  findOne(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser('_id') userId: Types.ObjectId,
  ) {
    return this.ticketsService.findOne(id, userId);
  }
}
