import { Logger } from '@nestjs/common';
import { ClientSession, Connection } from 'mongoose';

const logger = new Logger('MongoTransaction');
let warnedAboutStandalone = false;

function isTransactionUnsupported(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const message = error instanceof Error ? error.message : '';
  const code = (error as { code?: number }).code;

  return (
    message.includes('Transaction numbers are only allowed') ||
    message.includes('replica set member') ||
    code === 20 ||
    code === 263
  );
}

export function bindSession<Q extends { session(session: ClientSession): Q }>(
  query: Q,
  session: ClientSession | null,
): Q {
  if (!session) {
    return query;
  }

  return query.session(session);
}

export async function runInTransaction<T>(
  connection: Connection,
  work: (session: ClientSession | null) => Promise<T>,
): Promise<T> {
  const session = await connection.startSession();
  let started = false;

  try {
    let result!: T;
    await session.withTransaction(async () => {
      started = true;
      result = await work(session);
    });
    return result;
  } catch (error) {
    if (!started && isTransactionUnsupported(error)) {
      if (!warnedAboutStandalone) {
        warnedAboutStandalone = true;
        logger.warn(
          'MongoDB transactions are unavailable. Atomic document updates are used instead.',
        );
      }

      return work(null);
    }

    throw error;
  } finally {
    await session.endSession();
  }
}
