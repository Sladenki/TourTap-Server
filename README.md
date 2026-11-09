# Tour Tap API

Сервер экскурсий, типов билетов, регистраций и оплат на NestJS и MongoDB.

## Требования

- Node.js 22+
- MongoDB 5+

Бронирование мест выполняется в MongoDB-транзакции. Для этого MongoDB должен работать как replica set. Обычный локальный `mongod` без replica set тоже не допустит переполнения группы: сервер переключается на атомарное обновление счётчика мест. Транзакции нужны, чтобы создание регистрации и изменение счётчика фиксировались вместе.

Пример одноузлового replica set для локальной разработки:

```bash
mongod --replSet rs0 --port 27017 --dbpath <путь-к-данным>
```

Затем в `mongosh`:

```javascript
rs.initiate()
```

## Запуск

```bash
npm install
Copy-Item .env.example .env
npm run start:dev
```

API: `http://localhost:3000`

Swagger: `http://localhost:3000/docs`

В Swagger можно пройти основной сценарий: регистрация, вход, Authorize по JWT, создание экскурсии, типа билета, регистрации и оплаты.

## Переменные окружения

Смотрите `.env.example`.

- `MONGODB_URI` — строка подключения MongoDB
- `JWT_SECRET` — секрет подписи JWT, не короче 8 символов
- `JWT_EXPIRES_IN` — срок жизни токена, например `7d`
- `PORT` — порт HTTP, по умолчанию `3000`

Пароль хранится только как bcrypt-хеш и не возвращается API.

## Демо-данные

Seed не запускается при старте сервера и отказывается работать при `NODE_ENV=production`.

```bash
npm run build
npm run seed
```

Будет создан пользователь `dev@tour-tap.local` / `password123`, экскурсия и три типа билетов.

## Проверки

```bash
npm test
npm run test:e2e
```

E2E-тесты поднимают MongoDB replica set в памяти и проверяют авторизацию, владение экскурсиями, лимит группы и параллельные регистрации.

## Основные маршруты

```http
POST /auth/register
POST /auth/login
GET  /auth/me

GET   /users/me
GET   /users/:id
PATCH /users/me
PATCH /users/me/password

POST   /excursions
GET    /excursions
GET    /excursions/:id
PATCH  /excursions/:id
DELETE /excursions/:id

POST   /excursions/:excursionId/ticket-types
GET    /excursions/:excursionId/ticket-types
PATCH  /ticket-types/:id
DELETE /ticket-types/:id

POST /excursions/:excursionId/tickets
GET  /excursions/:excursionId/tickets
GET  /tickets/:id

POST /tickets/:ticketId/payments
GET  /tickets/:ticketId/payments
GET  /payments/:id
```

Списки экскурсий и участников поддерживают `page` и `limit`.
