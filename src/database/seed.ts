import { existsSync, readFileSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { Types } from 'mongoose';
import { AppModule } from '../app.module.js';
import { LegalType } from '../common/enums/legal-type.enum.js';
import { WebsiteStatus } from '../common/enums/website-status.enum.js';
import { ExcursionsService } from '../excursions/excursions.service.js';
import { TicketTypesService } from '../ticket-types/ticket-types.service.js';
import { UsersService } from '../users/users.service.js';

function loadEnvFile() {
  if (!existsSync('.env')) {
    return;
  }

  const content = readFileSync('.env', 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function seed() {
  loadEnvFile();

  if (process.env.NODE_ENV === 'production') {
    console.error('Seed отключён в production');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const usersService = app.get(UsersService);
    const excursionsService = app.get(ExcursionsService);
    const ticketTypesService = app.get(TicketTypesService);
    const email = 'dev@tour-tap.local';
    const existing = await usersService.findByEmail(email);

    if (existing) {
      console.log(`Пользователь ${email} уже есть, seed пропущен`);
      return;
    }

    const user = await usersService.create({
      name: 'Демо организатор',
      email,
      phone: '+79990000000',
      password: 'password123',
      inn: '123456789012',
      registry_number: 'РТО-000001',
      legal_type: LegalType.SOLE_PROPRIETOR,
      city: 'Калининград',
    });

    const excursion = await excursionsService.create(user._id as Types.ObjectId, {
      title: 'Обзорная по городу',
      date: '2026-07-01T15:00:00.000Z',
      meeting_point: 'Площадь Победы',
      timeFrom: '15:00',
      timeTo: '18:00',
      description: 'Демонстрационная экскурсия для локальной разработки',
      maxGroupSize: 20,
      webSiteId: 'dev-site',
      urlWebSite: 'https://example.com/tours/demo',
      statusWebSite: WebsiteStatus.PUBLISHED,
    });

    const adult = await ticketTypesService.create(new Types.ObjectId(excursion.id), user._id, {
      name: 'Взрослый',
      price: 1500,
    });
    const student = await ticketTypesService.create(new Types.ObjectId(excursion.id), user._id, {
      name: 'Студент',
      price: 1000,
    });
    const child = await ticketTypesService.create(new Types.ObjectId(excursion.id), user._id, {
      name: 'Ребёнок',
      price: 700,
    });

    console.log('Seed создан');
    console.log(`email: ${email}`);
    console.log('password: password123');
    console.log(`excursion: ${excursion.id}`);
    console.log(`ticket types: ${adult.id}, ${student.id}, ${child.id}`);
  } finally {
    await app.close();
  }
}

await seed();
