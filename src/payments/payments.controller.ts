import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import {
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
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { PaymentResponseDto } from './payment.presenter.js';
import { PaymentsService } from './payments.service.js';

@ApiTags('Payments')
@Controller('tickets/:ticketId/payments')
export class TicketPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Auth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Зафиксировать оплату регистрации' })
  @ApiObjectIdParam('ticketId')
  @ApiCreatedResponse({ type: PaymentResponseDto })
  @ApiForbiddenResponse({ description: 'Билет принадлежит чужой экскурсии' })
  @ApiNotFoundResponse({ description: 'Билет не найден' })
  @ApiConflictResponse({ description: 'Регистрация отменена или transaction_id уже использован' })
  create(
    @Param('ticketId', ParseObjectIdPipe) ticketId: Types.ObjectId,
    @CurrentUser('_id') userId: Types.ObjectId,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(ticketId, userId, dto);
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: 'Платежи регистрации' })
  @ApiObjectIdParam('ticketId')
  @ApiOkResponse({ type: [PaymentResponseDto] })
  @ApiForbiddenResponse({ description: 'Билет принадлежит чужой экскурсии' })
  findAll(
    @Param('ticketId', ParseObjectIdPipe) ticketId: Types.ObjectId,
    @CurrentUser('_id') userId: Types.ObjectId,
  ) {
    return this.paymentsService.findByTicket(ticketId, userId);
  }
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Платёж своей экскурсии' })
  @ApiObjectIdParam('id')
  @ApiOkResponse({ type: PaymentResponseDto })
  @ApiForbiddenResponse({ description: 'Платёж принадлежит чужой экскурсии' })
  @ApiNotFoundResponse({ description: 'Платёж не найден' })
  findOne(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser('_id') userId: Types.ObjectId,
  ) {
    return this.paymentsService.findOne(id, userId);
  }
}
