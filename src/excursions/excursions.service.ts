import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { buildPage, readPage } from '../common/utils/pagination.js';
import { sameObjectId } from '../common/utils/object-id.js';
import { runInTransaction } from '../database/run-transaction.js';
import { Ticket, TicketDocument } from '../tickets/schemas/ticket.schema.js';
import { TicketType, TicketTypeDocument } from '../ticket-types/schemas/ticket-type.schema.js';
import { CreateExcursionDto } from './dto/create-excursion.dto.js';
import { ListExcursionsQueryDto } from './dto/list-excursions-query.dto.js';
import { UpdateExcursionDto } from './dto/update-excursion.dto.js';
import { mapExcursion } from './excursion.presenter.js';
import { Excursion, ExcursionDocument } from './schemas/excursion.schema.js';

@Injectable()
export class ExcursionsService {
  constructor(
    @InjectModel(Excursion.name) private readonly excursionModel: Model<ExcursionDocument>,
    @InjectModel(TicketType.name) private readonly ticketTypeModel: Model<TicketTypeDocument>,
    @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(userId: Types.ObjectId, dto: CreateExcursionDto) {
    const excursion = await this.excursionModel.create({
      creatorUserId: userId,
      webSiteId: dto.webSiteId ?? null,
      title: dto.title,
      date: new Date(dto.date),
      meeting_point: dto.meeting_point,
      timeFrom: dto.timeFrom,
      timeTo: dto.timeTo,
      description: dto.description,
      maxGroupSize: dto.maxGroupSize,
      reservedSeats: 0,
      urlWebSite: dto.urlWebSite ?? null,
      statusWebSite: dto.statusWebSite,
    });

    return mapExcursion(excursion);
  }

  async findAll(query: ListExcursionsQueryDto) {
    const { page, limit, skip } = readPage(query);
    const filter = query.creatorUserId
      ? { creatorUserId: new Types.ObjectId(query.creatorUserId) }
      : {};

    const [items, total] = await Promise.all([
      this.excursionModel
        .find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.excursionModel.countDocuments(filter).exec(),
    ]);

    return buildPage(items.map((item) => mapExcursion(item)), total, page, limit);
  }

  async findOne(id: Types.ObjectId) {
    const excursion = await this.excursionModel
      .findById(id)
      .populate({
        path: 'creatorUserId',
        select: 'name email phone legal_type city',
      })
      .exec();

    if (!excursion) {
      throw new NotFoundException('Экскурсия не найдена');
    }

    const ticketTypes = await this.ticketTypeModel
      .find({ excursionId: excursion._id })
      .sort({ createdAt: 1 })
      .exec();

    return mapExcursion(excursion, ticketTypes);
  }

  async update(id: Types.ObjectId, userId: Types.ObjectId, dto: UpdateExcursionDto) {
    await this.assertOwner(id, userId);
    const update = this.toUpdate(dto);

    if (Object.keys(update).length === 0) {
      return this.findOne(id);
    }

    const filter: Record<string, unknown> = { _id: id, creatorUserId: userId };
    if (dto.maxGroupSize !== undefined) {
      filter.reservedSeats = { $lte: dto.maxGroupSize };
    }

    const excursion = await this.excursionModel
      .findOneAndUpdate(filter, { $set: update }, { returnDocument: 'after' })
      .exec();

    if (!excursion) {
      const existing = await this.excursionModel.findById(id).exec();
      if (!existing) {
        throw new NotFoundException('Экскурсия не найдена');
      }
      if (!sameObjectId(existing.creatorUserId, userId)) {
        throw new ForbiddenException('Недостаточно прав для этой экскурсии');
      }
      throw new ConflictException('Размер группы меньше числа уже занятых мест');
    }

    return this.findOne(id);
  }

  async remove(id: Types.ObjectId, userId: Types.ObjectId) {
    await this.assertOwner(id, userId);

    await runInTransaction(this.connection, async (session) => {
      const typeQuery = this.ticketTypeModel.find({ excursionId: id }).select('_id');
      const types = await (session ? typeQuery.session(session) : typeQuery).exec();
      const typeIds = types.map((type) => type._id);
      const ticketQuery = this.ticketModel.exists({ ticketTypeId: { $in: typeIds } });
      const hasTickets = await (session ? ticketQuery.session(session) : ticketQuery).exec();

      if (hasTickets) {
        throw new ConflictException('Нельзя удалить экскурсию, на которую уже есть регистрации');
      }

      await this.ticketTypeModel.deleteMany({ excursionId: id }, session ? { session } : undefined);
      await this.excursionModel.deleteOne({ _id: id }, session ? { session } : undefined);
    });
  }

  async assertOwner(id: Types.ObjectId, userId: Types.ObjectId) {
    const excursion = await this.excursionModel.findById(id).exec();
    if (!excursion) {
      throw new NotFoundException('Экскурсия не найдена');
    }
    if (!sameObjectId(excursion.creatorUserId, userId)) {
      throw new ForbiddenException('Недостаточно прав для этой экскурсии');
    }

    return excursion;
  }

  private toUpdate(dto: UpdateExcursionDto) {
    const update: Record<string, unknown> = {};

    if (dto.webSiteId !== undefined) update.webSiteId = dto.webSiteId;
    if (dto.title !== undefined) update.title = dto.title;
    if (dto.date !== undefined) update.date = new Date(dto.date);
    if (dto.meeting_point !== undefined) update.meeting_point = dto.meeting_point;
    if (dto.timeFrom !== undefined) update.timeFrom = dto.timeFrom;
    if (dto.timeTo !== undefined) update.timeTo = dto.timeTo;
    if (dto.description !== undefined) update.description = dto.description;
    if (dto.maxGroupSize !== undefined) update.maxGroupSize = dto.maxGroupSize;
    if (dto.urlWebSite !== undefined) update.urlWebSite = dto.urlWebSite;
    if (dto.statusWebSite !== undefined) update.statusWebSite = dto.statusWebSite;

    return update;
  }
}
