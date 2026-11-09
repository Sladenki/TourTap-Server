import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { configureApp } from '../src/configure-app.js';

describe('Tour Tap API (e2e)', () => {
  let app: INestApplication<App>;
  let replSet: MongoMemoryReplSet;
  let phoneCounter = 1_000_000;
  let emailCounter = 0;

  const server = () => app.getHttpServer();

  function nextPhone() {
    phoneCounter += 1;
    return `+7999${String(phoneCounter).padStart(7, '0')}`;
  }

  function nextEmail() {
    emailCounter += 1;
    return `user${emailCounter}-${Date.now()}@example.com`;
  }

  async function register(overrides: Record<string, unknown> = {}) {
    const email = (overrides.email as string | undefined) ?? nextEmail();
    const password = (overrides.password as string | undefined) ?? 'password123';
    const response = await request(server())
      .post('/auth/register')
      .send({
        name: 'Иван Организатор',
        phone: nextPhone(),
        legal_type: 'SOLE_PROPRIETOR',
        city: 'Калининград',
        inn: '123456789012',
        registry_number: 'РТО-001',
        ...overrides,
        email,
        password,
      })
      .expect(201);

    return {
      email,
      password,
      token: response.body.accessToken as string,
      user: response.body.user,
      body: response.body,
    };
  }

  function auth(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  async function createExcursion(token: string, maxGroupSize = 20) {
    const response = await request(server())
      .post('/excursions')
      .set(auth(token))
      .send({
        title: 'Вечерний Калининград',
        date: '2026-07-01T15:00:00.000Z',
        meeting_point: 'Площадь Победы',
        timeFrom: '15:00',
        timeTo: '18:00',
        description: 'Пешая прогулка',
        maxGroupSize,
      })
      .expect(201);

    return response.body;
  }

  async function createTicketType(token: string, excursionId: string, price = 1500) {
    const response = await request(server())
      .post(`/excursions/${excursionId}/ticket-types`)
      .set(auth(token))
      .send({ name: 'Взрослый', price })
      .expect(201);

    return response.body;
  }

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1 },
    });
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key-123456';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.MONGODB_URI = replSet.getUri();

    const { AppModule } = await import('../src/app.module.js');
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await replSet?.stop();
  });

  describe('Auth', () => {
    it('registers, logs in and opens the current profile', async () => {
      const created = await register();
      expect(created.body.user.password).toBeUndefined();
      expect(JSON.stringify(created.body)).not.toMatch(/\$2[aby]\$/);
      expect(created.user.id).toBe(created.user._id);

      const login = await request(server())
        .post('/auth/login')
        .send({ email: created.email, password: created.password })
        .expect(200);

      expect(login.body.accessToken).toEqual(expect.any(String));
      expect(login.body.user.password).toBeUndefined();

      const me = await request(server())
        .get('/auth/me')
        .set(auth(login.body.accessToken))
        .expect(200);

      expect(me.body.email).toBe(created.email);
      expect(me.body.password).toBeUndefined();
    });

    it('rejects a wrong password and a protected route without a token', async () => {
      const created = await register();

      await request(server())
        .post('/auth/login')
        .send({ email: created.email, password: 'wrong-password' })
        .expect(401);

      await request(server()).get('/auth/me').expect(401);
      await request(server())
        .get('/users/me')
        .set({ Authorization: 'Bearer not-a-token' })
        .expect(401);
    });

    it('rejects a duplicate email and an invalid payload', async () => {
      const created = await register();
      const duplicate = await request(server()).post('/auth/register').send({
        name: 'Другой',
        email: created.email,
        phone: nextPhone(),
        password: 'password123',
        legal_type: 'INDIVIDUAL',
        city: 'Москва',
      });

      expect(duplicate.status).toBe(409);

      await request(server()).post('/auth/register').send({ name: 'Без email' }).expect(400);
    });
  });

  describe('Users', () => {
    it('updates the profile and password, and rejects system fields', async () => {
      const created = await register();

      await request(server())
        .patch('/users/me')
        .set(auth(created.token))
        .send({ city: 'Светлогорск', createdAt: '2020-01-01T00:00:00.000Z' })
        .expect(400);

      const updated = await request(server())
        .patch('/users/me')
        .set(auth(created.token))
        .send({ city: 'Светлогорск' })
        .expect(200);

      expect(updated.body.city).toBe('Светлогорск');
      expect(updated.body.password).toBeUndefined();

      await request(server())
        .patch('/users/me/password')
        .set(auth(created.token))
        .send({ currentPassword: 'wrong-password', newPassword: 'new-password-1' })
        .expect(400);

      await request(server())
        .patch('/users/me/password')
        .set(auth(created.token))
        .send({ currentPassword: created.password, newPassword: 'new-password-1' })
        .expect(200);

      await request(server())
        .post('/auth/login')
        .send({ email: created.email, password: created.password })
        .expect(401);

      await request(server())
        .post('/auth/login')
        .send({ email: created.email, password: 'new-password-1' })
        .expect(200);

      const profile = await request(server())
        .get(`/users/${created.user.id}`)
        .set(auth(created.token))
        .expect(200);

      expect(profile.body.email).toBe(created.email);
      expect(profile.body.password).toBeUndefined();
    });
  });

  describe('Excursions and ticket types', () => {
    it('lets only the owner change an excursion', async () => {
      const owner = await register();
      const stranger = await register();
      const excursion = await createExcursion(owner.token, 12);

      expect(excursion.creatorUserId).toBe(owner.user.id);
      expect(excursion.reservedSeats).toBe(0);

      await request(server()).post('/excursions').send({ title: 'Без токена' }).expect(401);

      await request(server())
        .post('/excursions')
        .set(auth(owner.token))
        .send({
          title: 'Чужой создатель',
          creatorUserId: stranger.user.id,
          date: '2026-07-01T15:00:00.000Z',
          meeting_point: 'Центр',
          timeFrom: '10:00',
          timeTo: '12:00',
          description: 'Нельзя',
          maxGroupSize: 5,
        })
        .expect(400);

      const renamed = await request(server())
        .patch(`/excursions/${excursion.id}`)
        .set(auth(owner.token))
        .send({ title: 'Новое название' })
        .expect(200);

      expect(renamed.body.title).toBe('Новое название');

      await request(server())
        .patch(`/excursions/${excursion.id}`)
        .set(auth(stranger.token))
        .send({ title: 'Взлом' })
        .expect(403);

      await request(server()).get('/excursions/123').expect(400);
      await request(server()).get('/excursions/507f1f77bcf86cd799439011').expect(404);

      const details = await request(server()).get(`/excursions/${excursion.id}`).expect(200);
      expect(details.body.creator.email).toBe(owner.email);
      expect(details.body.creator.password).toBeUndefined();
      expect(details.body.ticketTypes).toEqual([]);

      const ticketType = await createTicketType(owner.token, excursion.id, 1500);
      await request(server())
        .patch(`/ticket-types/${ticketType.id}`)
        .set(auth(stranger.token))
        .send({ price: 1 })
        .expect(403);

      const withTypes = await request(server()).get(`/excursions/${excursion.id}`).expect(200);
      expect(withTypes.body.ticketTypes).toHaveLength(1);
      expect(withTypes.body.ticketTypes[0].name).toBe('Взрослый');

      const list = await request(server())
        .get('/excursions')
        .query({ page: 1, limit: 10, creatorUserId: owner.user.id })
        .expect(200);

      expect(list.body.total).toBeGreaterThanOrEqual(1);
      expect(list.body.page).toBe(1);
      expect(list.body.items.some((item: { id: string }) => item.id === excursion.id)).toBe(true);

      const empty = await createExcursion(owner.token, 4);
      await request(server()).delete(`/excursions/${empty.id}`).set(auth(stranger.token)).expect(403);
      await request(server()).delete(`/excursions/${empty.id}`).set(auth(owner.token)).expect(204);
      await request(server()).get(`/excursions/${empty.id}`).expect(404);
    });
  });

  describe('Tickets', () => {
    it('rejects a foreign or missing ticket type and a group that is too small', async () => {
      const owner = await register();
      const first = await createExcursion(owner.token, 5);
      const second = await createExcursion(owner.token, 5);
      const ownType = await createTicketType(owner.token, first.id, 700);
      const foreignType = await createTicketType(owner.token, second.id, 700);

      const wrongType = await request(server()).post(`/excursions/${first.id}/tickets`).send({
        name: 'Гость',
        email: nextEmail(),
        phone: nextPhone(),
        ticketTypeId: foreignType.id,
        quantity: 1,
      });
      expect(wrongType.status).toBe(400);

      const missingType = await request(server()).post(`/excursions/${first.id}/tickets`).send({
        name: 'Гость',
        email: nextEmail(),
        phone: nextPhone(),
        ticketTypeId: '507f1f77bcf86cd799439011',
        quantity: 1,
      });
      expect(missingType.status).toBe(404);

      await request(server())
        .post(`/excursions/${first.id}/tickets`)
        .send({
          name: 'Гость',
          email: nextEmail(),
          phone: nextPhone(),
          ticketTypeId: '123',
          quantity: 1,
        })
        .expect(400);

      await request(server())
        .post(`/excursions/${first.id}/tickets`)
        .send({
          name: 'Гость',
          email: nextEmail(),
          phone: nextPhone(),
          ticketTypeId: ownType.id,
          quantity: 3,
        })
        .expect(201);

      await request(server())
        .post(`/excursions/${first.id}/tickets`)
        .send({
          name: 'Гость',
          email: nextEmail(),
          phone: nextPhone(),
          ticketTypeId: ownType.id,
          quantity: 3,
        })
        .expect(409);

      const booked = await request(server()).get(`/excursions/${first.id}`).expect(200);
      expect(booked.body.reservedSeats).toBe(3);
      expect(booked.body.seatsAvailable).toBe(2);

      await request(server())
        .delete(`/excursions/${first.id}`)
        .set(auth(owner.token))
        .expect(409);

      await request(server())
        .delete(`/ticket-types/${ownType.id}`)
        .set(auth(owner.token))
        .expect(409);
    });

    it('does not overbook two concurrent registrations', async () => {
      const owner = await register();
      const stranger = await register();
      const excursion = await createExcursion(owner.token, 2);
      const ticketType = await createTicketType(owner.token, excursion.id, 1500);

      const [first, second] = await Promise.all([
        request(server()).post(`/excursions/${excursion.id}/tickets`).send({
          name: 'Анна',
          email: nextEmail(),
          phone: nextPhone(),
          ticketTypeId: ticketType.id,
          quantity: 2,
        }),
        request(server()).post(`/excursions/${excursion.id}/tickets`).send({
          name: 'Борис',
          email: nextEmail(),
          phone: nextPhone(),
          ticketTypeId: ticketType.id,
          quantity: 2,
        }),
      ]);

      expect([first.status, second.status].sort((left, right) => left - right)).toEqual([201, 409]);

      const details = await request(server()).get(`/excursions/${excursion.id}`).expect(200);
      expect(details.body.reservedSeats).toBe(2);
      expect(details.body.seatsAvailable).toBe(0);

      await request(server())
        .get(`/excursions/${excursion.id}/tickets`)
        .expect(401);

      await request(server())
        .get(`/excursions/${excursion.id}/tickets`)
        .set(auth(stranger.token))
        .expect(403);

      const participants = await request(server())
        .get(`/excursions/${excursion.id}/tickets`)
        .set(auth(owner.token))
        .expect(200);

      expect(participants.body.total).toBe(1);
      expect(participants.body.items[0].quantity).toBe(2);
      expect(participants.body.items[0].ticketType.name).toBe('Взрослый');
      expect(participants.body.items[0].status).toBe('PENDING');

      await request(server())
        .patch(`/excursions/${excursion.id}`)
        .set(auth(owner.token))
        .send({ maxGroupSize: 1 })
        .expect(409);
    });
  });

  describe('Payments', () => {
    it('confirms a ticket for its owner and hides it from another user', async () => {
      const owner = await register();
      const stranger = await register();
      const excursion = await createExcursion(owner.token, 10);
      const ticketType = await createTicketType(owner.token, excursion.id, 1500);
      const ticket = await request(server())
        .post(`/excursions/${excursion.id}/tickets`)
        .send({
          name: 'Мария',
          email: nextEmail(),
          phone: nextPhone(),
          ticketTypeId: ticketType.id,
          quantity: 2,
        })
        .expect(201);

      await request(server())
        .post(`/tickets/${ticket.body.id}/payments`)
        .set(auth(stranger.token))
        .send({ payment_method: 'CARD' })
        .expect(403);

      await request(server())
        .post(`/tickets/${ticket.body.id}/payments`)
        .set(auth(owner.token))
        .send({ payment_method: 'CARD', amount: 1 })
        .expect(400);

      const payment = await request(server())
        .post(`/tickets/${ticket.body.id}/payments`)
        .set(auth(owner.token))
        .send({ payment_method: 'CARD', transaction_id: `txn-${ticket.body.id}` })
        .expect(201);

      expect(payment.body.amount).toBe(3000);
      expect(payment.body.status).toBe('SUCCEEDED');
      expect(payment.body.transaction_id).toBe(`txn-${ticket.body.id}`);

      const confirmed = await request(server())
        .get(`/tickets/${ticket.body.id}`)
        .set(auth(owner.token))
        .expect(200);

      expect(confirmed.body.status).toBe('CONFIRMED');
      expect(confirmed.body.excursion.title).toBe('Вечерний Калининград');
      expect(JSON.stringify(confirmed.body)).not.toMatch(/password/);

      await request(server())
        .get(`/tickets/${ticket.body.id}`)
        .set(auth(stranger.token))
        .expect(403);

      const payments = await request(server())
        .get(`/tickets/${ticket.body.id}/payments`)
        .set(auth(owner.token))
        .expect(200);

      expect(payments.body).toHaveLength(1);

      await request(server())
        .get(`/payments/${payment.body.id}`)
        .set(auth(owner.token))
        .expect(200);

      await request(server())
        .get(`/payments/${payment.body.id}`)
        .set(auth(stranger.token))
        .expect(403);

      await request(server())
        .post(`/tickets/${ticket.body.id}/payments`)
        .set(auth(owner.token))
        .send({ payment_method: 'CASH', transaction_id: `txn-${ticket.body.id}` })
        .expect(409);
    });
  });

  describe('Swagger', () => {
    it('publishes the main flow', async () => {
      const response = await request(server()).get('/docs-json').expect(200);
      expect(response.body.paths['/auth/register']).toBeDefined();
      expect(response.body.paths['/auth/login']).toBeDefined();
      expect(response.body.paths['/excursions']).toBeDefined();
      expect(response.body.paths['/excursions/{excursionId}/tickets']).toBeDefined();
      expect(response.body.paths['/tickets/{ticketId}/payments']).toBeDefined();
      expect(response.body.components.securitySchemes.bearer).toBeDefined();
    });
  });
});
