# El Fatoora — Tunisian E-Invoicing SaaS

A full-stack SaaS platform for generating, signing, and submitting electronic invoices compliant with Tunisia's **TEIF / UBL 2.1** standard and the **TradeNet (TTN)** national network.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20 · Express 5 · TypeScript · Prisma ORM |
| Database | PostgreSQL 15 |
| Frontend | React 19 · Vite · Tailwind CSS 3 |
| Auth | JWT (30-day) · bcryptjs |
| AI | Google Gemini 1.5 Flash |
| E-Signature | XAdES-B (P12/PFX certificate) |
| Containers | Docker + Docker Compose |

---

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

---

## Environment Variables

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

---

## Project Structure

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
```

---

## Development Notes

- **Rate limiting:** 100 req/15min general, 10 req/15min for login endpoints (production)
- **TTN simulation mode:** Active when `TTN_API_URL` is not set — submissions always return `SENT_TO_TTN` without calling the real API
- **SMTP dev mode:** Without SMTP credentials, emails use Ethereal (test accounts) — a preview URL is returned in the API response
- **React i18n:** All UI strings live in `frontend/src/i18n/translations.js` — add new keys to all 3 language blocks (fr/en/ar)
