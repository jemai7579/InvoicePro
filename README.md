# El Fatoora — Tunisian E-Invoicing SaaS

<<<<<<< ours
A full-stack SaaS platform for generating, signing, and submitting electronic invoices compliant with Tunisia's **TEIF / UBL 2.1** standard and the **TradeNet (TTN)** national network.
=======
El Fatoora is a full-stack SaaS platform for Tunisian electronic invoicing. It supports invoice, quote, product, client, project, payment, network, messaging, audit, and compliance workflows around TEIF / UBL-style documents and TradeNet (TTN) submission.
>>>>>>> theirs

---

## Tech Stack

| Layer | Technology |
|---|---|
<<<<<<< ours
| Backend | Node.js 20 · Express 5 · TypeScript · Prisma ORM |
| Database | PostgreSQL 15 |
| Frontend | React 19 · Vite · Tailwind CSS 3 |
| Auth | JWT (30-day) · bcryptjs |
| AI | Google Gemini 1.5 Flash |
| E-Signature | XAdES-B (P12/PFX certificate) |
=======
| Backend | Node.js 20+ · Express 5 · TypeScript · Prisma ORM |
| Database | PostgreSQL 15 |
| Frontend | React 19 · Vite · Tailwind CSS 3 |
| Auth | JWT · bcryptjs |
| AI | Google Gemini, when `GEMINI_API_KEY` is configured |
| E-Signature / TEIF | Certificate-based signing workflow and TTN simulation/submit flow |
>>>>>>> theirs
| Containers | Docker + Docker Compose |

---

<<<<<<< ours
## Quick Start (Development)

### Prerequisites
- Node.js 20+
- PostgreSQL 15 running locally (or Docker)
- A `backend/.env` file (copy from `backend/.env.example`)

### 1. Database

```bash
# With Docker (recommended)
docker run --name elfatoora-pg -e POSTGRES_USER=elfatoora \
  -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=elfatooradb \
  -p 5432:5432 -d postgres:15-alpine
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate deploy   # run migrations
npx prisma db seed          # optional: seed admin + sample data
npm run dev                 # starts on :5000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                 # starts on :5173
```

### 4. Admin account

After seeding, the default admin credentials are set by `prisma/seed.ts`.  
Login at `/admin/login`.
=======
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

### 2. Configure the backend

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

If you are using an existing non-empty local database that was not created through Prisma migrations, use:

```bash
npx prisma db push
```

Optional seed data:

```bash
npx tsx prisma/seed.ts
```

Seeded admin credentials:

```text
Email: admin@elfatoora.tn
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

### 3. Configure the frontend

```bash
cd frontend
cp .env.example .env
npm install
```

Development API URL:

```env
VITE_API_URL=http://localhost:5005/api
```

Start the frontend:

```bash
npm run dev
```

Frontend dev URL:

```text
http://localhost:5173
```

The Vite config currently sets `base: '/frontend/'`, so production builds expect the app to be served from `/frontend/`.
>>>>>>> theirs

---

## Environment Variables

<<<<<<< ours
### `backend/.env` (required)

| Variable | Description |
|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/dbname` |
| `JWT_SECRET` | Strong random string (min 32 chars) |
| `NODE_ENV` | `development` or `production` |
| `FRONTEND_URL` | Frontend origin for CORS (e.g. `http://localhost:5173`) |

### `backend/.env` (optional integrations)

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio key — enables AI Assistant |
| `TTN_API_URL` | TradeNet base URL — enables real TTN submission |
| `TTN_API_KEY` | TradeNet API key |
| `SMTP_HOST` | SMTP server for email sending |
| `SMTP_PORT` | Default: 587 |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | Sender address |

> **Note:** Without `TTN_API_URL` / `TTN_API_KEY`, the platform runs in **simulation mode** — all TTN submissions succeed locally without reaching TradeNet. Without `GEMINI_API_KEY`, the AI Assistant returns a 503 error.

### `frontend/.env`

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL, e.g. `http://localhost:5000/api` |

---

## Production Deployment (Docker)

```bash
# Set required build variables
export DB_PASSWORD="<strong-random-password>"
export VITE_API_URL="https://api.your-domain.com/api"

# Create backend production env file
cp backend/.env.example backend/.env.production
# Edit backend/.env.production:
#   DATABASE_URL=postgresql://elfatoora:<DB_PASSWORD>@postgres:5432/elfatooradb
#   JWT_SECRET=<very-long-random-string>
#   NODE_ENV=production
#   FRONTEND_URL=https://your-domain.com
#   ... (add GEMINI, TTN, SMTP credentials)

# Build and start
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker exec elfatoora_backend npx prisma migrate deploy
```

The frontend is served by **Nginx on port 80**. The backend is internal to the Docker network and not exposed publicly.

---

## Key Features

| Feature | Plan |
|---|---|
| Create & manage clients | All |
| Create invoices (up to 7/month) | STARTER |
| Unlimited invoices | PROFESSIONAL + |
| Generate TEIF/UBL XML | All |
| XAdES-B e-signature | All (requires P12 cert) |
| TTN submission | All |
| PDF generation | All |
| Email sending (SMTP) | All |
| Quote (Devis) workflow | All |
| AI Assistant (Gemini) | PROFESSIONAL + |
| Analytics & Reports | PROFESSIONAL + |
| Multi-language (FR/EN/AR) | All |

---

## Subscription Plans

| Plan | Monthly Invoice Limit | AI | Reports |
|---|---|---|---|
| STARTER | 7 | No | No |
| PROFESSIONAL | Unlimited | Yes | Yes |
| ENTERPRISE | Unlimited | Yes | Yes |

Plan management is done from the **Admin Panel** at `/admin`.

---

## Admin Panel

Accessible at `/admin/login`. Admins can:
- View all registered companies
- Change subscription plans
- Activate / deactivate accounts
- View activity logs

---

## Certificate Setup (TEIF Signing)

1. Obtain a **TunTrust P12 certificate** for the company.
2. In the app, go to **Settings → Certificate**.
3. Upload the `.p12` / `.pfx` file and enter its password.
4. The system will use it to sign TEIF XML invoices with XAdES-B.

---

## External Credentials Required Before Go-Live

| Credential | Where to Obtain |
|---|---|
| `TTN_API_URL` + `TTN_API_KEY` | Request from TradeNet (Tunisie TradeNet) |
| `GEMINI_API_KEY` | Google AI Studio (aistudio.google.com) |
| TunTrust P12 certificate | TunTrust certification authority |
| SMTP credentials | Any email provider (SendGrid, Mailgun, etc.) |
| PostgreSQL production password | Self-generated |
| `JWT_SECRET` | Self-generated (use `openssl rand -hex 32`) |
=======
### Backend Required

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string. Local Docker default: `postgresql://elfatoora:secretpassword@localhost:5440/elfatooradb` |
| `JWT_SECRET` | Long random JWT signing secret, at least 32 characters |
| `PORT` | Backend port. Development default: `5005` |
| `NODE_ENV` | `development` or `production` |
| `FRONTEND_URL` | Frontend origin allowed by CORS. Development default: `http://localhost:5173` |

### Backend Optional

| Variable | Description |
|---|---|
| `TTN_API_URL` | TradeNet / TTN API base URL. Leave empty for simulation mode |
| `TTN_API_KEY` | TradeNet / TTN API key |
| `GEMINI_API_KEY` | Enables the AI Assistant |
| `SMTP_HOST` | SMTP host. If omitted, mail features use the development fallback |
| `SMTP_PORT` | SMTP port. Default: `587` |
| `SMTP_SECURE` | `true` for TLS, otherwise `false` |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL. Development default: `http://localhost:5005/api` |
| `VITE_APP_VERSION` | Optional app version shown in the UI |

Notes:

- Without `TTN_API_URL` / `TTN_API_KEY`, TTN submission runs in simulation mode.
- Without `GEMINI_API_KEY`, the AI Assistant returns a disabled/unavailable response.
- Without SMTP credentials, email-related endpoints use development mail behavior and may expose preview URLs.

---

## Production Deployment

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

In production, the frontend container serves Nginx on port `80`. The backend listens on port `5005` inside the Docker network and is reached by Nginx.

---

## Main Features

| Area | Capability |
|---|---|
| Companies & auth | Registration, login, profile, subscription-aware access |
| Clients & network | Client management, network clients, public offer links |
| Products | Product catalog for invoices and quotes |
| Invoices | Invoice creation, tracking, PDF/XML generation, TTN workflow |
| Quotes / devis / offers | Quote workflows, offer responses, conversion paths |
| Payments | Payment records and payment status tracking |
| Projects | Project collaboration and related email notifications |
| Messages | In-app messaging routes and UI |
| Audit trail | Activity and audit history |
| Reports | Analytics and reporting pages |
| Settings | Company settings, logo upload, certificate-related configuration |
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
>>>>>>> theirs

---

## Project Structure

<<<<<<< ours
```
el-fatoora/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/       # Auth, error handling
│   │   ├── routes/           # Express routers
│   │   ├── services/         # TTN, email, AI, PDF, XML
│   │   └── utils/            # Helpers (JWT, etc.)
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── migrations/       # SQL migrations
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/            # Route-level components
│   │   ├── components/       # Shared UI components
│   │   ├── context/          # Auth, Language contexts
│   │   ├── i18n/             # FR/EN/AR translations
│   │   └── services/api.js   # Axios instance + interceptors
│   └── .env.example
└── docker-compose.prod.yml
=======
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
│   ├── src/
│   │   ├── components/          # Shared UI components
│   │   ├── context/             # Auth and language contexts
│   │   ├── i18n/                # FR / EN / AR translations
│   │   ├── pages/               # Route-level pages
│   │   └── services/api.js      # Axios instance
│   ├── vite.config.js           # React plugin and /frontend/ base
│   └── .env.example
└── docker-compose.prod.yml      # Production stack
>>>>>>> theirs
```

---

## Development Notes

<<<<<<< ours
- **Rate limiting:** 100 req/15min general, 10 req/15min for login endpoints (production)
- **TTN simulation mode:** Active when `TTN_API_URL` is not set — submissions always return `SENT_TO_TTN` without calling the real API
- **SMTP dev mode:** Without SMTP credentials, emails use Ethereal (test accounts) — a preview URL is returned in the API response
- **React i18n:** All UI strings live in `frontend/src/i18n/translations.js` — add new keys to all 3 language blocks (fr/en/ar)
=======
- Backend dev command: `npm run dev` from `backend/`.
- Frontend dev command: `npm run dev` from `frontend/`.
- Backend default port comes from `backend/.env`; this project uses `5005` locally.
- PostgreSQL local Docker port is `5440`, mapped to container port `5432`.
- Rate limits are relaxed in development and stricter in production.
- Add new UI translation keys to all three language blocks: French, English, and Arabic.
- Do not commit real `.env` files or private certificates.
>>>>>>> theirs
