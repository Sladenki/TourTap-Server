import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

const colors = {
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
};

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl: url } = req;
    const startedAt = Date.now();

    res.on('finish', () => {
      const message = `${method} ${url} ${res.statusCode} - ${Date.now() - startedAt} ms`;

      if (res.statusCode >= 500) {
        this.logger.error(colors.red(message));
        return;
      }

      if (res.statusCode >= 400) {
        this.logger.warn(colors.yellow(message));
        return;
      }

      this.logger.log(colors.cyan(message));
    });

    next();
  }
}
