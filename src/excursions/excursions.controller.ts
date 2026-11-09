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
  Query,
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
import { CreateExcursionDto } from './dto/create-excursion.dto.js';
import { ListExcursionsQueryDto } from './dto/list-excursions-query.dto.js';
import { UpdateExcursionDto } from './dto/update-excursion.dto.js';
import { ExcursionResponseDto, PaginatedExcursionsDto } from './excursion.presenter.js';
import { ExcursionsService } from './excursions.service.js';

@ApiTags('Excursions')
@Controller('excursions')
export class ExcursionsController {
  constructor(private readonly excursionsService: ExcursionsService) {}

  @Post()
  @Auth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать экскурсию от имени текущего пользователя' })
  @ApiCreatedResponse({ type: ExcursionResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректные данные. creatorUserId передавать нельзя' })
  create(@CurrentUser('_id') userId: Types.ObjectId, @Body() dto: CreateExcursionDto) {
    return this.excursionsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Список экскурсий с пагинацией' })
  @ApiOkResponse({ type: PaginatedExcursionsDto })
  findAll(@Query() query: ListExcursionsQueryDto) {
    return this.excursionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Экскурсия, организатор и типы билетов' })
  @ApiObjectIdParam('id')
  @ApiOkResponse({ type: ExcursionResponseDto })
  @ApiNotFoundResponse({ description: 'Экскурсия не найдена' })
  @ApiBadRequestResponse({ description: 'Некорректный ObjectId' })
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.excursionsService.findOne(id);
  }

  @Patch(':id')
  @Auth()
  @ApiOperation({ summary: 'Изменить свою экскурсию' })
  @ApiObjectIdParam('id')
  @ApiOkResponse({ type: ExcursionResponseDto })
  @ApiForbiddenResponse({ description: 'Экскурсия принадлежит другому пользователю' })
  @ApiNotFoundResponse({ description: 'Экскурсия не найдена' })
  @ApiConflictResponse({ description: 'Новый размер группы меньше занятых мест' })
  update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser('_id') userId: Types.ObjectId,
    @Body() dto: UpdateExcursionDto,
  ) {
    return this.excursionsService.update(id, userId, dto);
  }

  @Delete(':id')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить свою экскурсию без регистраций' })
  @ApiObjectIdParam('id')
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ description: 'Экскурсия принадлежит другому пользователю' })
  @ApiConflictResponse({ description: 'На экскурсию уже есть регистрации' })
  remove(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser('_id') userId: Types.ObjectId,
  ) {
    return this.excursionsService.remove(id, userId);
  }
}
