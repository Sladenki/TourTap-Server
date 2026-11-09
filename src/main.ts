import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import { configureApp } from './configure-app.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      instrument: ObserveInstrument,
    });
    configureApp(app);
    app.enableShutdownHooks();

    const port = Number(process.env.PORT ?? 3000);
    await app.listen(port);
    logger.log(`Server is running on http://localhost:${port}`);
    logger.log(`Swagger: http://localhost:${port}/docs`);
  } catch (error) {
    logger.error(
      'Error starting server',
      error instanceof Error ? error.stack : String(error),
    );
    process.exit(1);
  }
}

await bootstrap();
