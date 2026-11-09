import { LegalType } from '../enums/legal-type.enum.js';
import { asRecord, idOf } from '../utils/object-id.js';

export interface PublicUser {
  id: string;
  _id: string;
  name: string;
  email: string;
  phone: string;
  inn: string | null;
  registry_number: string | null;
  legal_type: LegalType;
  city: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface PublicCreator {
  id: string;
  _id: string;
  name: string;
  email: string;
  phone: string;
  legal_type: LegalType;
  city: string;
}

export function toPublicUser(user: unknown): PublicUser {
  const source = asRecord(user);
  const id = idOf(source._id);

  return {
    id,
    _id: id,
    name: String(source.name),
    email: String(source.email),
    phone: String(source.phone),
    inn: (source.inn as string | null | undefined) ?? null,
    registry_number: (source.registry_number as string | null | undefined) ?? null,
    legal_type: source.legal_type as LegalType,
    city: String(source.city),
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

export function toPublicCreator(user: unknown): PublicCreator {
  const full = toPublicUser(user);

  return {
    id: full.id,
    _id: full._id,
    name: full.name,
    email: full.email,
    phone: full.phone,
    legal_type: full.legal_type,
    city: full.city,
  };
}
