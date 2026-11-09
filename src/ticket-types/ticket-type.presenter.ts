import { asRecord, idOf } from '../common/utils/object-id.js';

export function mapTicketType(ticketType: unknown) {
  const source = asRecord(ticketType);
  const id = idOf(source._id);

  return {
    id,
    _id: id,
    excursionId: idOf(source.excursionId),
    name: source.name as string,
    price: source.price as number,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}
