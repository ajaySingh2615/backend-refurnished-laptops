# Refurbished laptops — API (backend)

Express **5**, **Drizzle ORM**, **PostgreSQL 17** (Docker), **Node 20+** (ESM).

## Prerequisites

- [Node.js](https://nodejs.org/) **20+**
- [Docker](https://www.docker.com/) (for Postgres)

## Setup

1. Copy environment file:

   ```bash
   cp .env.example .env
   ```

   Adjust `DATABASE_URL` and `CORS_ORIGIN` if needed.

2. Start PostgreSQL (requires **Docker Desktop** running on Windows/macOS, or Docker Engine on Linux):

   ```bash
   docker compose up -d
   ```

   Then run migrations (step 4) so tables exist before `npm run dev`.

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create / update migrations from schema, then apply:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. Run the API (watch mode):

   ```bash
   npm run dev
   ```

## Endpoints

| Method | Path          | Description        |
| ------ | ------------- | ------------------ |
| GET    | `/health`     | Liveness + DB ping |
| GET    | `/api/health` | Same JSON          |

Example response:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "ok": true,
    "uptime": 1.23,
    "database": "up"
  }
}
```

## Scripts

| Script                   | Description                                  |
| ------------------------ | -------------------------------------------- |
| `npm run dev`            | Start with `node --watch`                    |
| `npm start`              | Start once                                   |
| `npm run db:generate`    | Drizzle SQL from schema                      |
| `npm run db:migrate`  | Apply migrations (`drizzle-kit migrate`) |
| `npm run db:studio`   | Drizzle Studio (optional)              |
| `npm run format`         | Prettier write                               |

## Layout

- `server.js` — bootstrap: env, DB connect, listen
- `src/app.js` — Express app, middleware, routes, error handling
- `src/common/` — config, middleware, utils
- `src/db/schema/` — Drizzle table definitions
- `src/modules/` — feature modules (e.g. `health`)
- `drizzle/` — generated SQL migrations (committed)

## Troubleshooting migrations

- Run **`npm run db:migrate`** from the **`backend/`** folder so **`.env`** is loaded (`drizzle.config.js` uses `dotenv`).
- If **`password authentication failed`** or odd errors: another Postgres may be on port **5432**. This project maps Docker to host port **5433** — use **`DATABASE_URL`** with **`127.0.0.1:5433`** (see `.env.example`).
- Ensure Docker is running (`docker compose ps`) and **`?sslmode=disable`** for local Postgres if needed.

## Security

Never commit `.env`. Use `.env.example` only as a template.
