# InvoicePro — Tunisian Electronic Invoicing SaaS

InvoicePro is a full-stack SaaS platform for Tunisian electronic invoicing. It supports clients, network partners, quotes, offers, invoices, payments, TEIF/XML export, TTN workflows, signature mock/configuration, AI, reports, settings, admin, and audit trail modules.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20+ · Express 5 · TypeScript · Prisma ORM |
| Database | PostgreSQL 15 |
| Frontend | React 19 · Vite · Tailwind CSS 3 |
| Auth | JWT · bcryptjs |
| AI | Google Gemini, when `GEMINI_API_KEY` is configured |
| Containers | Docker + Docker Compose |

---

## Local Development

### Prerequisites

- Node.js 20+
- Docker Desktop, for the local PostgreSQL database
- `backend/.env`, copied from `backend/.env.example`
- `frontend/.env`, copied from `frontend/.env.example`

### 1. Start PostgreSQL

The development compose file lives in `backend/docker-compose.yml` and exposes PostgreSQL on host port `5440`.

```bash
cd backend
docker compose up -d
```

Local database URL:

```env
DATABASE_URL="postgresql://elfatoora:secretpassword@localhost:5440/elfatooradb"
```

### 2. Configure the Backend

```bash
cd backend
cp .env.example .env
npm install
```

Required development values:

```env
DATABASE_URL="postgresql://elfatoora:secretpassword@localhost:5440/elfatooradb"
JWT_SECRET="CHANGE_ME_use_a_long_random_secret_here"
PORT=5005
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

Apply the database schema:

```bash
npx prisma migrate deploy
```

For local-only prototyping against a disposable database, Prisma also supports:

```bash
npx prisma db push
```

Never run `prisma db push` or `prisma migrate dev` in production. Use `npx prisma migrate deploy`.

Optional seed data:

```bash
npx tsx prisma/seed.ts
```

Seeded admin credentials:

```text
Email: admin@invoicepro.tn
Password: adminpassword123
```

Start the backend:

```bash
npm run dev
```

Backend health check:

```text
http://localhost:5005/health
```

### 3. Configure the Frontend

```bash
cd frontend
cp .env.example .env
npm install
```

Development API URL:

```env
VITE_API_URL=http://localhost:5005/api
```

Optional deployment base path:

```env
VITE_BASE_PATH=/
```

`VITE_BASE_PATH` defaults to `/`. Only set it when intentionally deploying the SPA under a sub-path.

Start the frontend:

```bash
npm run dev
```

Frontend dev URL:

```text
http://localhost:5173
```

---

## Environment Variables

### Backend Required

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string. Local Docker default: `postgresql://elfatoora:secretpassword@localhost:5440/elfatooradb` |
| `JWT_SECRET` | Long random JWT signing secret, at least 32 characters |
| `JWT_EXPIRES_IN` | JWT lifetime. Default: `12h` |
| `PORT` | Backend port. Development default: `5005` |
| `NODE_ENV` | `development` or `production` |
| `APP_ENV` | Must be `production` alongside `NODE_ENV=production` |
| `FRONTEND_URL` | Frontend origin allowed by CORS. Development default: `http://localhost:5173` |

### Backend Optional

| Variable | Description |
|---|---|
| `TTN_API_URL` | TradeNet / TTN API base URL. Leave empty for simulation mode |
| `TTN_API_KEY` | TradeNet / TTN API key |
| `GEMINI_API_KEY` | Enables the AI Assistant |
| `SMTP_HOST` | SMTP host. If omitted, mail features use development behavior |
| `SMTP_PORT` | SMTP port. Default: `587` |
| `SMTP_SECURE` | `true` for TLS, otherwise `false` |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL. Development default: `http://localhost:5005/api` |
| `VITE_BASE_PATH` | Optional SPA base path. Default: `/` |
| `VITE_APP_VERSION` | Optional app version shown in the UI |

---

## Production Deployment

For cPanel / Passenger hosting, follow [`CPANEL_DEPLOYMENT.md`](./CPANEL_DEPLOYMENT.md). Docker Compose below is an alternative for a VPS with Docker.

Production uses the root `docker-compose.prod.yml`.

```bash
export DB_PASSWORD="<strong-random-password>"
export VITE_API_URL="https://api.your-domain.com/api"

cp backend/.env.example backend/.env.production
```

Set `backend/.env.production` for the Docker network:

```env
DATABASE_URL="postgresql://elfatoora:<DB_PASSWORD>@postgres:5432/elfatooradb"
JWT_SECRET="<very-long-random-secret>"
NODE_ENV=production
APP_ENV=production
JWT_EXPIRES_IN="12h"
PORT=5005
FRONTEND_URL="https://your-domain.com"
```

Build and start:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Run migrations:

```bash
docker exec elfatoora_backend npx prisma migrate deploy
```

The frontend should be served as a single-page app from `/` unless `VITE_BASE_PATH` is intentionally changed.

Nginx must fall back to `index.html` for client-side routes:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## Main Features

| Area | Capability |
|---|---|
| Companies & auth | Registration, login, profile, subscription-aware access |
| Clients | Manual client records and Excel import for commercial documents |
| Network | Internal partner invitations, accepted connections, messaging and sharing |
| Products | Product catalog for invoices and quotes |
| Invoices | Invoice creation, tracking, PDF/XML generation, TTN workflow |
| Quotes / devis / offers | Quote workflows, offer responses, conversion paths |
| Payments | Payment records and payment status tracking |
| Projects | Project collaboration and related email notifications |
| Messages | In-app messaging routes and UI |
| Audit trail | Activity and audit history |
| Reports | Analytics and reporting pages |
| Settings | Company settings, logo upload, compliance and certificate-related configuration |
| AI Assistant | Gemini-backed assistant when configured |
| Admin | Admin login, company management, subscription and activity views |
| Internationalization | FR / EN / AR translations in `frontend/src/i18n/translations.js` |

---

## Useful URLs

| Service | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend health | `http://localhost:5005/health` |
| Backend API | `http://localhost:5005/api` |
| Admin login | `http://localhost:5173/admin/login` |

---

## Project Structure

```text
el-fatoora/
├── backend/
│   ├── docker-compose.yml       # Local PostgreSQL on host port 5440
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   ├── migrations/          # Prisma migrations
│   │   └── seed.ts              # Optional seed data
│   ├── src/
│   │   ├── controllers/         # Route handlers
│   │   ├── middleware/          # Auth and error handling
│   │   ├── routes/              # Express routers
│   │   ├── services/            # Domain services
│   │   └── utils/               # Shared backend helpers
│   └── .env.example
├── frontend/
│   ├── public/
│   │   └── invoicepro-favicon-512.png # InvoicePro browser icon source
│   ├── src/
│   │   ├── assets/              # InvoicePro PNG logo assets
│   │   ├── components/          # Shared UI components
│   │   ├── context/             # Auth and language contexts
│   │   ├── i18n/                # FR / EN / AR translations
│   │   ├── pages/               # Route-level pages
│   │   └── services/api.js      # Axios instance
│   ├── vite.config.js           # Vite base defaults to /
│   └── .env.example
└── docker-compose.prod.yml      # Production stack
```

---

## Development Notes

- Backend dev command: `npm run dev` from `backend/`.
- Frontend dev command: `npm run dev` from `frontend/`.
- Backend default port comes from `backend/.env`; this project uses `5005` locally.
- PostgreSQL local Docker port is `5440`, mapped to container port `5432`.
- Rate limits are relaxed in development and stricter in production.
- Add new UI translation keys to all three language blocks: French, English, and Arabic.
- Do not commit real `.env` files or private certificates.
