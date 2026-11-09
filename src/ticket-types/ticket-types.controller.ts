import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { ApiObjectIdParam } from '../common/decorators/api-object-id-param.decorator.js';
import { Auth } from '../common/decorators/auth.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto.js';
import { TicketTypeResponseDto } from './dto/ticket-type-response.dto.js';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto.js';
import { TicketTypesService } from './ticket-types.service.js';

@ApiTags('Ticket types')
@Controller('excursions/:excursionId/ticket-types')
export class ExcursionTicketTypesController {
  constructor(private readonly ticketTypesService: TicketTypesService) {}

  @Post()
  @Auth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Добавить тип билета к своей экскурсии' })
  @ApiObjectIdParam('excursionId')
  @ApiCreatedResponse({ type: TicketTypeResponseDto })
  @ApiForbiddenResponse({ description: 'Экскурсия принадлежит другому пользователю' })
  @ApiNotFoundResponse({ description: 'Экскурсия не найдена' })
  create(
    @Param('excursionId', ParseObjectIdPipe) excursionId: Types.ObjectId,
    @CurrentUser('_id') userId: Types.ObjectId,
    @Body() dto: CreateTicketTypeDto,
  ) {
    return this.ticketTypesService.create(excursionId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Типы билетов экскурсии' })
  @ApiObjectIdParam('excursionId')
  @ApiOkResponse({ type: [TicketTypeResponseDto] })
  @ApiNotFoundResponse({ description: 'Экскурсия не найдена' })
  findAll(@Param('excursionId', ParseObjectIdPipe) excursionId: Types.ObjectId) {
    return this.ticketTypesService.findByExcursion(excursionId);
  }
}

@ApiTags('Ticket types')
@Controller('ticket-types')
export class TicketTypesController {
  constructor(private readonly ticketTypesService: TicketTypesService) {}

  @Patch(':id')
  @Auth()
  @ApiOperation({ summary: 'Изменить тип билета своей экскурсии' })
  @ApiObjectIdParam('id')
  @ApiOkResponse({ type: TicketTypeResponseDto })
  @ApiForbiddenResponse({ description: 'Тип билета принадлежит чужой экскурсии' })
  @ApiNotFoundResponse({ description: 'Тип билета не найден' })
  @ApiBadRequestResponse({ description: 'Некорректный ObjectId или данные' })
  update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser('_id') userId: Types.ObjectId,
    @Body() dto: UpdateTicketTypeDto,
  ) {
    return this.ticketTypesService.update(id, userId, dto);
  }

  @Delete(':id')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить тип билета без регистраций' })
  @ApiObjectIdParam('id')
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ description: 'Тип билета принадлежит чужой экскурсии' })
  @ApiConflictResponse({ description: 'На тип билета уже есть регистрации' })
  remove(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser('_id') userId: Types.ObjectId,
  ) {
    return this.ticketTypesService.remove(id, userId);
  }
}
