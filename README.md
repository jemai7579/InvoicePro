# InvoicePro

Professional SaaS platform for business invoicing, client management, payments tracking, and electronic invoicing preparation.

## Overview

InvoicePro is a web platform that helps businesses manage their commercial workflow from one space: clients, products and services, quotes, invoices, payments, reports, company settings, user access, admin supervision, electronic invoicing preparation, and AI assistance when configured.

The application is designed for teams that need a structured, secure, and practical way to manage invoicing operations while keeping electronic invoicing workflows organized and traceable.

## Platform Purpose

InvoicePro centralizes daily invoicing operations and gives companies a structured workflow to create, follow, export, and manage invoices and related business data.

The platform separates commercial invoice management from official electronic validation workflows. This gives users a clear operational flow for invoice preparation, document generation, payment follow-up, reporting, and administration.

## Main Modules

| Module | Description |
| --- | --- |
| Public landing page | Presents the platform, product value, electronic invoicing preparation, and access links. |
| Authentication | Handles registration, login, protected access, and user session management. |
| Client dashboard | Gives users a business overview with invoice, payment, and workflow indicators. |
| Admin control center | Provides supervision tools for accounts, access, configuration, support, and activity. |
| Clients | Manages customer records, fiscal information, contact details, and related business data. |
| Products and services | Stores catalog items used in quotes, invoices, and commercial documents. |
| Quotes / devis | Creates and manages quotes before conversion into invoices. |
| Invoices | Creates, edits, validates, exports, signs, and tracks invoice records. |
| Invoice tracking | Displays invoice workflow status from preparation through electronic invoicing steps. |
| Payments | Tracks payments, partial payments, remaining balances, and payment status. |
| Reports | Provides business reporting for invoices, payments, revenue, and activity. |
| Settings | Manages company profile, security, compliance configuration, subscription, help, and team options. |
| Notifications | Shows important user-facing updates related to workflow and account activity. |
| Support requests | Allows users and admins to manage support communication. |
| Audit logs | Records important actions for traceability and operational supervision. |
| AI assistant | Provides guided assistance when the Gemini API key is configured. |
| Electronic invoicing workflow | Structures TEIF/XML generation, signature steps, TTN submission steps, and response tracking. |

## User Area

### Dashboard

The dashboard gives users a clear overview of their invoices, payments, recent activity, and commercial workflow. It helps users understand what needs attention without leaving the main workspace.

### Clients

The clients page centralizes customer information such as company identity, contact details, fiscal identifiers, and address information. Client records are used throughout quotes, invoices, and reports.

### Products

The products page manages services and catalog items that can be reused in commercial documents. It helps keep invoice lines consistent and reduces repeated manual entry.

### Invoices

The invoices page is the main workspace for creating, editing, validating, exporting, and following invoices. It connects invoice preparation with PDF export, TEIF/XML generation, signature steps, and TTN workflow actions.

### Invoice Tracking

Invoice tracking presents the electronic invoicing workflow in a dedicated view. Users can follow invoice progress from preparation to XML generation, signature, TTN submission, and response/status tracking.

### Payments

The payments page tracks invoice settlement activity, including paid, partially paid, pending, and remaining amounts. It supports operational follow-up after invoice issuance.

### Quotes / Devis

The quotes section manages commercial proposals before invoicing. Users can prepare quotes, follow their status, and convert accepted business into invoice records.

### Reports

Reports provide visibility into revenue, invoicing activity, payment status, and business performance. They help owners and teams monitor operations from structured data.

### Settings

Settings centralize company profile information, security controls, electronic invoicing configuration, subscription information, help access, and team/CRM options.

### Assistant IA

The AI assistant supports users with platform guidance, invoice workflow explanations, and business content assistance when the Gemini provider key is configured.

### Messages and Network

The messaging and network sections support communication and collaboration around business relationships, client interactions, and professional opportunities where enabled in the application.

## Admin Area

The admin area is a simplified control center for platform supervision.

Admins can:

- approve accounts
- block or unblock accounts
- manage access and account status
- add access days
- manage configuration areas
- review support requests
- consult important activity logs

### Control Center

The control center gives admins a high-level overview of companies, usage, invoices, configuration health, and operational activity.

### Accounts

Account management allows admins to supervise user and company access. Admins can approve, block, unblock, and adjust account access according to platform rules.

### Configuration

Configuration tools allow admins to review and manage integration settings such as TTN, SMTP, AI, billing, and platform-level options.

### Support Requests

Support tools allow admins to review user requests, respond to issues, and follow support activity from one place.

### Audit Logs

Audit logs provide traceability for important actions across the platform. They help admins review sensitive changes, access activity, and operational events.

## Electronic Invoicing Workflow

InvoicePro includes a structured electronic invoicing workflow:

```text
Invoice preparation -> XML/TEIF generation -> electronic signature step -> TTN submission step -> response/status tracking
```

The workflow is designed to keep commercial invoice creation separate from official electronic validation steps. Users can prepare invoices, generate structured electronic data, apply the configured signature process, submit through the configured TTN connection, and track the returned status.

Official TTN submission depends on the configured TTN access and the applicable production environment.

## External Services Configuration

Some advanced features are activated through configuration variables and selected providers.

| Service | Configuration |
| --- | --- |
| TTN integration | Configured through TTN credentials, endpoints, and environment-based access settings. |
| Electronic signature | Configured through the selected certificate or signature provider. |
| AI assistant | Activated when the Google Gemini API key is configured. |
| Email / SMTP | Configured through SMTP host, port, user, and password credentials. |
| Online payment | Connected through the selected payment or billing provider configuration. |

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT, bcrypt |
| API | REST API |
| AI | Google Gemini via `@google/generative-ai` |
| Email | Nodemailer with SMTP configuration |
| Documents | PDF generation, XML/TEIF generation |
| Deployment | Docker, Docker Compose, Node.js server process |

## Architecture

```text
Frontend -> Backend API -> Services -> Prisma -> PostgreSQL
```

The frontend handles the user interface, routing, forms, tables, workflow screens, and dashboard views.

The backend handles authentication, authorization, business logic, API validation, document generation, workflow operations, and integration coordination.

Service modules handle invoices, PDF generation, TEIF/XML generation, signature workflow, TTN workflow, emails, AI usage, payments, support, notifications, and audit logs.

The database stores company data, users, clients, products, quotes, invoices, invoice lines, payments, support requests, configuration data, and activity logs.

## Environment Variables

Configuration is handled through local environment files. Use the provided example files as templates and keep real values private.

### Backend Configuration

```env
NODE_ENV=development
APP_ENV=development
PORT=5005
FRONTEND_URL=http://localhost:5173

DATABASE_URL=postgresql://USER:PASSWORD@localhost:5440/invoicepro?schema=public
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET

E_INVOICE_MODE=sandbox
TTN_API_URL=https://ttn.example/api
TTN_BASE_URL=https://ttn.example
TTN_AUTH_ENDPOINT=/auth
TTN_SUBMIT_INVOICE_ENDPOINT=/invoices/submit
TTN_STATUS_ENDPOINT=/invoices/status
TTN_PROOF_ENDPOINT=/invoices/proof
TTN_API_KEY=REPLACE_WITH_TTN_API_KEY
TTN_CLIENT_ID=REPLACE_WITH_TTN_CLIENT_ID
TTN_CLIENT_SECRET=REPLACE_WITH_TTN_CLIENT_SECRET
TTN_USERNAME=REPLACE_WITH_TTN_USERNAME
TTN_PASSWORD=REPLACE_WITH_TTN_PASSWORD

SIGNATURE_PROVIDER=certificate
SIGNATURE_CERT_PATH=/secure/path/certificate.p12
SIGNATURE_CERT_PASSWORD=REPLACE_WITH_CERTIFICATE_PASSWORD
SIGNATURE_HSM_URL=https://signature-provider.example
SIGNATURE_HSM_TOKEN=REPLACE_WITH_SIGNATURE_TOKEN

GEMINI_API_KEY=REPLACE_WITH_GEMINI_API_KEY
AI_PROVIDER=gemini

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=no-reply@example.com
SMTP_PASS=REPLACE_WITH_SMTP_PASSWORD
SMTP_SECURE=false

BILLING_PROVIDER=provider-name
BILLING_API_KEY=REPLACE_WITH_BILLING_API_KEY
BILLING_WEBHOOK_SECRET=REPLACE_WITH_BILLING_WEBHOOK_SECRET
BILLING_SUCCESS_URL=https://app.example.com/billing/success
BILLING_CANCEL_URL=https://app.example.com/billing/cancel
```

### Frontend Configuration

```env
VITE_API_URL=http://localhost:5005/api
VITE_BASE_PATH=/
VITE_APP_VERSION=1.2.0
```

Environment files are local configuration files. Real secrets, private keys, provider tokens, and certificate passwords should stay outside the repository.

## Local Setup

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment files

Create local environment files from the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Adjust values for the local database, API URL, JWT secret, and selected integrations.

### 3. Start PostgreSQL

```bash
docker compose -f backend/docker-compose.yml up -d
```

### 4. Generate Prisma client and run migrations

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

### 5. Start the backend

```bash
cd backend
npm run dev
```

### 6. Start the frontend

```bash
cd frontend
npm run dev
```

Default local URLs:

```text
Frontend: http://localhost:5173
Backend API: http://localhost:5005
Backend health: http://localhost:5005/health
```

## Production Deployment

Production deployment should use production environment variables, a managed PostgreSQL database or secured database service, HTTPS, and provider configuration aligned with the selected external services.

Typical deployment flow:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

cd ../frontend
npm install
npm run build
```

The application can be deployed with Docker, Docker Compose, or standard Node.js server processes depending on the hosting environment.

Production configuration includes:

- database connection
- JWT secret
- frontend origin
- backend API origin
- domain and HTTPS
- TTN configuration
- signature provider configuration
- SMTP configuration
- AI provider configuration
- billing or payment provider configuration

## Security

InvoicePro includes a security model built around protected access and company data isolation.

Key security areas:

- JWT authentication
- bcrypt password hashing
- protected API routes
- company-scoped data access
- admin/user separation
- protected document downloads
- audit logs for important actions
- environment-based secrets
- frontend-safe API configuration
- HTTPS recommended in production

API keys, provider secrets, certificate passwords, and private credentials are handled by the backend and are not exposed through frontend environment variables.

## Repository Structure

```text
.
├── backend/
│   ├── prisma/
│   ├── scripts/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── docker-compose.yml
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── i18n/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
├── docker-compose.prod.yml
└── README.md
```

## Summary

InvoicePro provides a complete foundation for business invoicing, client management, payments tracking, reporting, administration, and electronic invoicing preparation. The platform is designed to be deployed as a SaaS application and configured according to the selected external providers for TTN, signature, AI, email, and payment services.
