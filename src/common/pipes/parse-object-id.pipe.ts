import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { Types } from 'mongoose';

const OBJECT_ID = /^[a-fA-F0-9]{24}$/;

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, Types.ObjectId> {
  transform(value: string): Types.ObjectId {
    if (!value || !OBJECT_ID.test(value) || !Types.ObjectId.isValid(value)) {
      throw new BadRequestException('Некорректный идентификатор');
    }

    return new Types.ObjectId(value);
  }
}
