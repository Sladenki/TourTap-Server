import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExcursionsService } from '../excursions/excursions.service.js';
import { Ticket, TicketDocument } from '../tickets/schemas/ticket.schema.js';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto.js';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto.js';
import { TicketType, TicketTypeDocument } from './schemas/ticket-type.schema.js';
import { mapTicketType } from './ticket-type.presenter.js';

@Injectable()
export class TicketTypesService {
  constructor(
    @InjectModel(TicketType.name) private readonly ticketTypeModel: Model<TicketTypeDocument>,
    @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
    private readonly excursionsService: ExcursionsService,
  ) {}

  async create(excursionId: Types.ObjectId, userId: Types.ObjectId, dto: CreateTicketTypeDto) {
    await this.excursionsService.assertOwner(excursionId, userId);
    const ticketType = await this.ticketTypeModel.create({
      excursionId,
      name: dto.name,
      price: dto.price,
    });

    return mapTicketType(ticketType);
  }

  async findByExcursion(excursionId: Types.ObjectId) {
    const excursion = await this.excursionsService.findOne(excursionId);
    const ticketTypes = excursion.ticketTypes ?? [];
    return ticketTypes;
  }

  async update(id: Types.ObjectId, userId: Types.ObjectId, dto: UpdateTicketTypeDto) {
    const ticketType = await this.requireOwned(id, userId);
    if (dto.name !== undefined) ticketType.name = dto.name;
    if (dto.price !== undefined) ticketType.price = dto.price;
    await ticketType.save();
    return mapTicketType(ticketType);
  }

  async remove(id: Types.ObjectId, userId: Types.ObjectId) {
    const ticketType = await this.requireOwned(id, userId);
    const used = await this.ticketModel.exists({ ticketTypeId: ticketType._id }).exec();

    if (used) {
      throw new ConflictException('Нельзя удалить тип билета, на который есть регистрации');
    }

    await this.ticketTypeModel.deleteOne({ _id: ticketType._id }).exec();
  }

  private async requireOwned(id: Types.ObjectId, userId: Types.ObjectId) {
    const ticketType = await this.ticketTypeModel.findById(id).exec();
    if (!ticketType) {
      throw new NotFoundException('Тип билета не найден');
    }

    await this.excursionsService.assertOwner(ticketType.excursionId, userId);
    return ticketType;
  }
}
