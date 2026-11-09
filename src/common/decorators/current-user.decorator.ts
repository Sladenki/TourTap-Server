import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Types } from 'mongoose';

interface RequestUser {
  sub?: string;
  _id?: string;
}

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;

    if (!user) {
      return undefined;
    }

    if (data === '_id') {
      const raw = user._id ?? user.sub;
      if (!raw) {
        return undefined;
      }

      return new Types.ObjectId(String(raw));
    }

    if (!data) {
      return user;
    }

    return user[data as keyof RequestUser];
  },
);
