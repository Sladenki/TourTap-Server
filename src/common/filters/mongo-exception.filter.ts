import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { MongoServerError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';
import { duplicateKeyMessage } from '../utils/duplicate-key.js';

@Catch(MongoServerError)
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: MongoServerError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    if (exception.code === 11000) {
      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: duplicateKeyMessage(exception),
        error: 'Conflict',
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Ошибка базы данных',
      error: 'Internal Server Error',
    });
  }
}

@Catch(MongooseError.CastError)
export class MongooseCastExceptionFilter implements ExceptionFilter {
  catch(_exception: MongooseError.CastError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Некорректный идентификатор',
      error: 'Bad Request',
    });
  }
}
