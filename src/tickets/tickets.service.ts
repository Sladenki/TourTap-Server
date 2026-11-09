import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { TicketStatus } from '../common/enums/ticket-status.enum.js';
import { buildPage, readPage } from '../common/utils/pagination.js';
import { bindSession, runInTransaction } from '../database/run-transaction.js';
import { Excursion, ExcursionDocument } from '../excursions/schemas/excursion.schema.js';
import { ExcursionsService } from '../excursions/excursions.service.js';
import { TicketType, TicketTypeDocument } from '../ticket-types/schemas/ticket-type.schema.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { Ticket, TicketDocument } from './schemas/ticket.schema.js';
import { mapTicket } from './ticket.presenter.js';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
    @InjectModel(TicketType.name) private readonly ticketTypeModel: Model<TicketTypeDocument>,
    @InjectModel(Excursion.name) private readonly excursionModel: Model<ExcursionDocument>,
    private readonly excursionsService: ExcursionsService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  create(excursionId: Types.ObjectId, dto: CreateTicketDto) {
    return runInTransaction(this.connection, (session) =>
      this.createInSession(excursionId, dto, session),
    );
  }

  async findOne(id: Types.ObjectId, userId: Types.ObjectId) {
    await this.getOwnedContext(id, userId);
    const ticket = await this.ticketModel
      .findById(id)
      .populate({
        path: 'ticketTypeId',
        select: 'name price excursionId',
        populate: {
          path: 'excursionId',
          select: 'title date meeting_point',
        },
      })
      .exec();

    if (!ticket) {
      throw new NotFoundException('Билет не найден');
    }

    return mapTicket(ticket);
  }

  async findByExcursion(
    excursionId: Types.ObjectId,
    userId: Types.ObjectId,
    query: PaginationQueryDto,
  ) {
    await this.excursionsService.assertOwner(excursionId, userId);
    const { page, limit, skip } = readPage(query);
    const typeIds = await this.ticketTypeModel.find({ excursionId }).distinct('_id').exec();
    const filter = { ticketTypeId: { $in: typeIds } };

    const [items, total] = await Promise.all([
      this.ticketModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'ticketTypeId', select: 'name price excursionId' })
        .lean()
        .exec(),
      this.ticketModel.countDocuments(filter).exec(),
    ]);

    return buildPage(items.map((item) => mapTicket(item)), total, page, limit);
  }

  async getOwnedContext(ticketId: Types.ObjectId, userId: Types.ObjectId) {
    const ticket = await this.ticketModel.findById(ticketId).exec();
    if (!ticket) {
      throw new NotFoundException('Билет не найден');
    }

    const ticketType = await this.ticketTypeModel.findById(ticket.ticketTypeId).exec();
    if (!ticketType) {
      throw new NotFoundException('Тип билета не найден');
    }

    const excursion = await this.excursionsService.assertOwner(ticketType.excursionId, userId);
    return { ticket, ticketType, excursion };
  }

  private async createInSession(
    excursionId: Types.ObjectId,
    dto: CreateTicketDto,
    session: ClientSession | null,
  ) {
    const excursion = await bindSession(this.excursionModel.findById(excursionId), session).exec();
    if (!excursion) {
      throw new NotFoundException('Экскурсия не найдена');
    }

    const ticketType = await bindSession(
      this.ticketTypeModel.findById(dto.ticketTypeId),
      session,
    ).exec();

    if (!ticketType) {
      throw new NotFoundException('Тип билета не найден');
    }

    if (ticketType.excursionId.toString() !== excursion._id.toString()) {
      throw new BadRequestException('Тип билета не относится к этой экскурсии');
    }

    const reserved = await this.excursionModel.findOneAndUpdate(
      {
        _id: excursion._id,
        $expr: {
          $lte: [{ $add: ['$reservedSeats', dto.quantity] }, '$maxGroupSize'],
        },
      },
      { $inc: { reservedSeats: dto.quantity } },
      { returnDocument: 'after', ...(session ? { session } : {}) },
    );

    if (!reserved) {
      const stillExists = await bindSession(
        this.excursionModel.exists({ _id: excursion._id }),
        session,
      ).exec();

      if (!stillExists) {
        throw new NotFoundException('Экскурсия не найдена');
      }

      throw new ConflictException('Недостаточно свободных мест');
    }

    try {
      const created = await this.ticketModel.create(
        [
          {
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            ticketTypeId: ticketType._id,
            quantity: dto.quantity,
            status: TicketStatus.PENDING,
          },
        ],
        session ? { session } : undefined,
      );

      return mapTicket(created[0]);
    } catch (error) {
      if (!session) {
        await this.excursionModel.updateOne(
          { _id: excursion._id },
          { $inc: { reservedSeats: -dto.quantity } },
        );
      }
      throw error;
    }
  }
}
