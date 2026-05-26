# InvoicePro / El Fatoora — Tunisian Electronic Invoicing SaaS

InvoicePro / El Fatoora is a full-stack SaaS platform for managing Tunisian commercial invoicing workflows: customers, catalog items, quotes, invoices, payments, reporting, document exports, and compliance preparation.

The platform prepares a company for Tunisian electronic invoicing workflows through TEIF/XML generation, signature workflow support, and TTN / El Fatoora workflow screens. Real legal TTN integration is not active until official TTN API contracts and sandbox credentials, the official TEIF XSD, and a real electronic signature provider have been obtained, configured, implemented, and validated.

> **Compliance warning:** A deployed application is not, by itself, a legally operational TTN e-invoicing integration. `E_INVOICE_MODE=sandbox` is appropriate for a production-hosted test/preparation deployment; it does not issue legally accepted TTN invoices.

## Main Features

The following modules are present in the application:

| Module | Capability |
|---|---|
| Authentication | Company registration, login, authenticated application access |
| Dashboard | Business overview and workflow navigation |
| Clients | Client record management and commercial-document support |
| Products / services | Catalog management used by invoices and quotes |
| Invoices | Invoice creation, tracking, document delivery, and compliance workflow entry points |
| Payments | Payment records and payment status tracking |
| Devis / quotes | Quote management and conversion workflows |
| PDF export | Generated invoice and report documents |
| XML / TEIF generation | TEIF-oriented XML generation and protected downloads |
| Signature workflow | Certificate/settings flow and signature processing paths |
| TTN workflow preparation | Submission/status workflow screens and backend workflow controls |
| Reports and analytics | Reporting and analytics endpoints and pages |
| Settings | Company profile, logo, compliance, and configuration management |
| Admin panel | Administrative authentication and operational management screens |
| Audit trail | Activity logging and history |
| AI assistant | Gemini-backed assistant when `GEMINI_API_KEY` is configured |
| Network / collaboration | Network connections, messages, offers, and project-sharing functionality |

## Tech Stack

| Area | Technology |
|---|---|
| Backend | Node.js 20+, Express 5, TypeScript |
| Frontend | React 19, Vite, Tailwind CSS 3 |
| Database | PostgreSQL |
| ORM | Prisma ORM |
| Authentication | JWT, bcryptjs |
| AI | Google Gemini API when `GEMINI_API_KEY` is configured |
| Primary deployment | cPanel / Passenger Node.js App backend and static React frontend |
| Optional VPS deployment | Docker Compose files retained for a Docker-capable VPS |

## Local Development Setup

### Prerequisites

- Node.js 20 or newer
- PostgreSQL installed locally, or Docker for the included local PostgreSQL service
- A backend environment file at `backend/.env`
- A frontend environment file at `frontend/.env`

### 1. Start PostgreSQL

To use the included local Docker database, which publishes PostgreSQL on port `5440`:

```bash
cd backend
docker compose up -d
```

Alternatively, provide an equivalent local PostgreSQL database and update `DATABASE_URL`.

### 2. Configure and Start the Backend

Create `backend/.env` for local development:

```env
PORT=5005
NODE_ENV=development
APP_ENV=development
E_INVOICE_MODE=mock
DATABASE_URL="postgresql://elfatoora:secretpassword@localhost:5440/elfatooradb"
JWT_SECRET="local_development_jwt_secret_change_me_please_32_chars"
FRONTEND_URL="http://localhost:5173"
```

> `E_INVOICE_MODE=mock` is for development simulation only. It must never be used in production.

Install dependencies and prepare Prisma:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

For local-only prototyping against a disposable database, `npx prisma db push` may be used instead of migrations when appropriate. Do not use `prisma db push` against production.

The local backend health endpoint is:

```text
http://localhost:5005/health
```

### 3. Configure and Start the Frontend

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5005/api
VITE_BASE_PATH=/
```

Then run:

```bash
cd frontend
npm install
npm run dev
```

The Vite development application is served at:

```text
http://localhost:5173
```

## Production cPanel Deployment

The main deployment target is:

| Component | Production Value |
|---|---|
| Frontend website | `https://invoicepro.tn` |
| Backend API | `https://api.invoicepro.tn` |
| cPanel home directory | `/home/invoice` |
| Backend application root | `/home/invoice/backend` |
| Backend startup file | `dist/index.js` |
| Node.js version | `20.x` |
| Application mode | `Production` |

### Backend Deployment with cPanel Passenger

1. Upload the backend project directory to `/home/invoice/backend`, outside the public frontend document root.
2. In cPanel, open **Setup Node.js App** or **Application Manager** and create the API application with these settings:

| cPanel Setting | Value |
|---|---|
| Node.js version | `20.x` |
| Application mode | `Production` |
| Application root | `backend` |
| Application URL | `api.invoicepro.tn` |
| Application startup file | `dist/index.js` |

3. Configure the backend environment variables in the cPanel Node.js application:

```env
NODE_ENV=production
APP_ENV=production
E_INVOICE_MODE=sandbox
DATABASE_URL="postgresql://invoice_invoice:YOUR_POSTGRES_PASSWORD@localhost:5432/invoice_elfatoora?schema=public"
JWT_SECRET="CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_MINIMUM_48_CHARACTERS"
JWT_EXPIRES_IN="12h"
FRONTEND_URL="https://invoicepro.tn"
GEMINI_API_KEY=""
TTN_API_URL=""
TTN_API_KEY=""
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
```

> **Secrets:** Replace placeholder values in cPanel only. Do not add database passwords, JWT secrets, API keys, certificate passwords, or `.env` files to source control.

> **TTN status:** The current backend deliberately does not simulate legal TTN submission outside mock development mode. In `sandbox` mode, TTN workflow actions require official TTN configuration and the provider transport must be completed against the official contract before submission can operate.

When official TTN and signing integration is available, the backend configuration also uses the following code-supported variables:

```env
TEIF_XSD_PATH="/home/invoice/private/teif/official-schema.xsd"
TEIF_SCHEMA_VERSION="OFFICIAL_SCHEMA_VERSION"
SIGNATURE_PROVIDER="certificate"
SIGNATURE_CERT_PATH="/home/invoice/private/certificates/company.p12"
SIGNATURE_CERT_PASSWORD="YOUR_CERTIFICATE_PASSWORD"
TTN_BASE_URL="OFFICIAL_TTN_BASE_URL"
TTN_AUTH_ENDPOINT="OFFICIAL_TTN_AUTH_ENDPOINT"
TTN_SUBMIT_INVOICE_ENDPOINT="OFFICIAL_TTN_SUBMIT_ENDPOINT"
TTN_STATUS_ENDPOINT="OFFICIAL_TTN_STATUS_ENDPOINT"
TTN_API_KEY="OFFICIAL_TTN_API_KEY"
```

Keep XSD files, certificates, compliance artifacts, and their credentials outside `public_html`.

### Backend Build and Migration Commands

Run these commands inside **cPanel Terminal** or over SSH, not from the local Windows PowerShell terminal:

```bash
source /home/invoice/nodevenv/backend/20/bin/activate && cd /home/invoice/backend
rm -rf dist
npm install
npm run build
npx prisma generate
npx prisma validate
npx prisma migrate deploy
```

After these commands complete, restart the Node.js app from cPanel.

Do not:

- Use `E_INVOICE_MODE=mock` in production.
- Commit or upload `.env` files to a publicly accessible location.
- Reuse local development secrets in production.
- Run demo seed data in production.
- Use `prisma db push` or `prisma migrate dev` against the production database.

### Health Check

After restarting the application, verify:

```text
https://api.invoicepro.tn/health
```

Expected response:

```json
{"success":true,"status":"OK"}
```

## Frontend Production Deployment

Create or update `frontend/.env.production` before building:

```env
VITE_API_URL=https://api.invoicepro.tn/api
VITE_BASE_PATH=/
```

Build the static frontend:

```bash
cd frontend
npm install
npm run build
```

Upload only the contents of `frontend/dist/` to `public_html/`. The repository already provides `frontend/public/.htaccess`, which Vite copies into the production output. Confirm that the deployed `public_html/.htaccess` supports React Router SPA fallback:

```apacheconf
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
</IfModule>
```

With the fallback deployed, direct browser visits to frontend routes such as `/login` or `/invoices` should load the React application instead of producing an Apache 404 response.

## Database Setup on cPanel

Create and assign the production PostgreSQL database in cPanel:

| Setting | Value |
|---|---|
| Database | `invoice_elfatoora` |
| User | `invoice_invoice` |
| Host | `localhost` |
| Port | `5432` |
| Password | Keep private; never put the real password in this README |

Use the database password only in the private backend runtime environment:

```env
DATABASE_URL="postgresql://invoice_invoice:YOUR_POSTGRES_PASSWORD@localhost:5432/invoice_elfatoora?schema=public"
```

Upload the Prisma migration directory with the backend application, and apply schema migrations from `/home/invoice/backend` with:

```bash
npx prisma migrate deploy
```

## Production Safety Notes

- Real TTN production is not active until official TTN API details, sandbox/production credentials, the official XSD TEIF schema, and a real signature provider are configured and the official transport is implemented and validated.
- `E_INVOICE_MODE=sandbox` is the production-hosted preparation/testing mode. It has no legal invoice acceptance value.
- Mock legal signatures and simulated TTN acceptance are blocked by application startup and workflow guards in production.
- Workflow-controlled invoice statuses, including signed and TTN states, must not be manually editable by users.
- PDF, XML, TEIF, signed files, certificates, and TTN proof files must be served only through protected backend routes or stored outside public web roots. The backend exposes only logo uploads as static public assets.

## Security Checklist

- Do not upload `.git` to the hosting account document root.
- Do not upload `node_modules` manually; install server dependencies from the application root.
- Do not expose `.env` files or secret configuration through `public_html`.
- Do not expose `uploads/compliance`, certificates, signed documents, PDFs, or XML/TEIF artifacts publicly.
- Use a unique, random `JWT_SECRET` of at least 48 characters.
- Require HTTPS for `https://invoicepro.tn` and `https://api.invoicepro.tn`.
- Keep `FRONTEND_URL="https://invoicepro.tn"` strict so API CORS accepts only the deployed frontend origin.
- Run `npm audit` and evaluate any findings before production deployment.
- Do not run demo or development seed data in production.

## Useful Commands

### Backend

```bash
cd backend
npm install
npm run build
npm run typecheck
npx prisma generate
npx prisma validate
npx prisma migrate deploy
```

### Frontend

```bash
cd frontend
npm install
npm run lint
npm run build
```

## Troubleshooting

| Problem | Check |
|---|---|
| cPanel app does not launch | The startup file must be `dist/index.js`, not `dist/server.js`. |
| API fails after restart | Review Passenger/application logs, commonly `passenger.log`, and confirm the production environment values are present. |
| Prisma connection or migration fails | Verify `DATABASE_URL`, database permissions, host `localhost`, port `5432`, and that migrations were uploaded. |
| Frontend cannot register or login | Confirm `VITE_API_URL=https://api.invoicepro.tn/api` was used at build time and `FRONTEND_URL="https://invoicepro.tn"` is set on the API. |
| Frontend route returns 404 after browser refresh | Confirm `.htaccess` was uploaded to `public_html` and Apache rewrite rules are enabled. |
| TTN or signing action is unavailable in hosted sandbox | This is expected until official credentials, endpoints, schema, signature configuration, and TTN transport implementation are completed. |
| `source /home/invoice/nodevenv/...` fails locally | This is a Linux cPanel/SSH command. Run it in cPanel Terminal or SSH, not local Windows PowerShell. |

## Optional VPS Deployment with Docker

Docker is not the primary deployment method for this project. If deploying to a VPS where Docker is available, the retained `docker-compose.prod.yml` can be used as a starting point for a containerized PostgreSQL, backend, and frontend deployment. Configure strong production secrets, TLS/reverse proxy routing, protected uploads, and Prisma migrations separately for that environment.
