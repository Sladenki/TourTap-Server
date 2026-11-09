import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

const logger = new Logger('MongoConfig');

function maskMongoUri(uri?: string): string {
  if (!uri) {
    return '<empty>';
  }

  return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:/?#]+:)([^@]+)(@)/i, '$1***$3');
}

export const getMongoConfig = (
  configService: ConfigService,
): MongooseModuleOptions => {
  const uri = configService.get<string>('MONGODB_URI');
  logger.log(`Using MONGODB_URI: ${maskMongoUri(uri)}`);

  if (!uri) {
    logger.error('MONGODB_URI is not set');
  }

  return {
    uri,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    retryAttempts: 5,
    retryDelay: 1000,
    connectionFactory: (connection: Connection) => {
      connection.on('connected', () => logger.log('MongoDB connected'));
      connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
      connection.on('error', (error: Error) =>
        logger.error(`MongoDB error: ${error?.message || error}`),
      );
      return connection;
    },
  };
};
