import { BadRequestException } from '@nestjs/common';
import { ParseObjectIdPipe } from './parse-object-id.pipe.js';

describe('ParseObjectIdPipe', () => {
  const pipe = new ParseObjectIdPipe();

  it('rejects a value that is not an ObjectId', () => {
    expect(() => pipe.transform('123')).toThrow(BadRequestException);
  });

  it('accepts a 24 character hex ObjectId', () => {
    const id = pipe.transform('507f1f77bcf86cd799439011');
    expect(id.toString()).toBe('507f1f77bcf86cd799439011');
  });
});
