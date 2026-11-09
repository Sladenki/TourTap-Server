import { MongoServerError } from 'mongodb';

export function isDuplicateKeyError(error: unknown): error is MongoServerError {
  return (
    error instanceof MongoServerError ||
    (typeof error === 'object' &&
      error !== null &&
      (error as { code?: number }).code === 11000)
  );
}

export function duplicateKeyMessage(error: MongoServerError): string {
  const fields = error as MongoServerError & {
    keyPattern?: Record<string, unknown>;
    keyValue?: Record<string, unknown>;
  };
  const key = Object.keys(fields.keyPattern ?? fields.keyValue ?? {})[0];

  switch (key) {
    case 'email':
      return 'Пользователь с таким email уже существует';
    case 'phone':
      return 'Пользователь с таким телефоном уже существует';
    case 'transaction_id':
      return 'Платёж с таким transaction_id уже существует';
    default:
      return 'Запись с такими данными уже существует';
  }
}
