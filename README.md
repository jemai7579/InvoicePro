# InvoicePro  — Tunisian Electronic Invoicing SaaS Platform

## Executive Summary

InvoicePro is a SaaS platform for Tunisian companies that need a structured way to manage commercial invoicing and prepare for electronic invoicing workflows.

The platform includes tools for:

- Clients
- Products and services
- Invoices
- Quotes / devis
- Payments tracking
- Reports
- Company settings and legal profile
- Electronic invoice preparation
- TEIF/XML generation
- Electronic signature workflow
- TTN / El Fatoora workflow preparation
- Admin supervision
- Audit trail
- Support/help requests
- AI assistant when the required API key is configured

The commercial management part can be used normally after deployment, once the database, backend, frontend, SMTP, and access configuration are correctly set.

The legal electronic invoicing workflow is production-safe, but it must remain blocked until the project owner provides official TTN access, official TEIF/XSD validation resources, and a real electronic signature provider/certificate. The platform must not be presented as legally TTN-compliant until real TTN responses and a real legal signature workflow are configured and tested.

## Current Production Status

Commercial modules are ready for server deployment. Legal e-invoicing activation must remain blocked until official TTN configuration, official TEIF/XSD validation, and a real electronic signature provider are configured and tested.

Current status:

| Area | Status | Important note |
|---|---|---|
| Commercial invoicing SaaS | Ready for deployment | Requires normal production setup: database, secrets, SMTP if email is used, server storage, HTTPS, and migrations. |
| TTN legal submission | Not fully active | Real legal TTN submission requires official TTN API documentation, credentials, endpoints, and sandbox/production access. |
| Electronic signature | Partial / configurable | Mock signature is demo-only. Legal signature requires a real certificate/provider/HSM and official signing rules. |
| TEIF/XML generation | Implemented as backend workflow | Official XSD validation requires the official TEIF XSD file and official validation rules. |
| AI assistant | Conditional | Uses Google Gemini in the current backend and requires `GEMINI_API_KEY`. |
| Online subscription payment | Not complete as an automatic gateway | The code tracks billing/integration status, but a real payment provider must be chosen and integrated for automated online subscription payment. |
| Invoice payment tracking | Implemented | This is business payment tracking for invoices, separate from SaaS subscription payment. |

The app is ready to be deployed as a commercial invoice management SaaS. Real TTN legal production must remain disabled until the missing official external dependencies are provided.

## Features Overview

| Module | Description | Status | Notes / Missing dependency |
|---|---|---|---|
| Public landing page | Public marketing and navigation entry page. | Implemented | Route: `/`. |
| E-invoice guide page | Explains the electronic invoicing preparation workflow. | Implemented | Must avoid claiming legal TTN acceptance without real TTN response. |
| Authentication | Company registration, login, JWT authentication, bcrypt password hashing. | Implemented | Production requires strong `JWT_SECRET`. |
| User dashboard / client dashboard | Business summary, invoice/payment overview, readiness and subscription status. | Implemented | Uses backend data through `/api/dashboard/summary`. |
| Admin dashboard | Platform owner area for companies, users, support, payments, settings, compliance, and activity. | Implemented / evolving | Admin access must stay separated from normal user access. |
| Clients management | Create, list, update, and manage client records. | Implemented | Company isolation is required on all API access. |
| Products/services management | Manage products/services used in invoices and quotes. | Implemented | Includes TVA and pricing fields. |
| Invoice management | Create, list, track, and manage invoices. | Implemented | Legal/e-invoice status is separate from payment status. |
| Invoice PDF generation | Generates invoice PDFs with business and compliance information. | Implemented | Uses backend PDFKit. Must not show fake legal TTN references. |
| XML/TEIF generation | Generates TEIF-oriented XML artifacts from invoice data. | Implemented | Official validation requires official XSD. |
| Electronic signature workflow | Supports signature workflow and mock/real provider separation. | Partial / safe-blocked | Legal use requires real provider/certificate/HSM. |
| TTN submission workflow | Backend workflow and UI preparation for TTN submission/status. | Partial / safe-blocked | Official TTN API contract is still required. |
| Payments tracking | Tracks invoice payments, paid amount, partial payment, and balance. | Implemented | Not the same as online SaaS subscription payment. |
| Quotes/devis | Quote management and conversion workflow. | Implemented | Email delivery depends on SMTP configuration. |
| Reports | Financial and operational reports. | Implemented | Export behavior depends on current page implementation. |
| Settings/company file | Company legal profile, logo, readiness, signature/TTN settings surfaces. | Implemented | Production readiness depends on official external config. |
| Notifications | Notification list, unread count, read actions, and navigation. | Implemented | Notifications must remain scoped to the authenticated company/user. |
| Audit trail | Activity and history logging. | Implemented | Sensitive actions should always be audited. |
| AI assistant | Business assistant backed by Gemini. | Conditional | Requires `GEMINI_API_KEY`; usage may create API cost. |
| Subscription/access control | Account/subscription status checks and access guards. | Implemented | Admin approval or extension may be manual. |
| Support/help requests | User support page and admin support management. | Implemented | Reply/email behavior depends on SMTP and implemented workflow. |
| Network/messages/offers/projects | Collaboration/business networking modules. | Implemented in UI/API | Confirm exact business scope with the owner before production messaging. |
| Analytics/SEO admin | Admin monitoring for analytics/search integrations. | Implemented as integration/status surfaces | Requires GA/GTM/Search Console configuration if used. |

## Pages and Modules Explanation

### Public Pages

| Page | Purpose | What users can do | Data used | Current status | Missing dependency |
|---|---|---|---|---|---|
| Landing page `/` | Public introduction to InvoicePro. | Learn about the product and navigate to registration/login. | Static frontend content and analytics events. | Implemented | None. |
| Login `/login` | Company user login. | Authenticate and access the protected app. | Backend auth API. | Implemented | Backend API and JWT secret. |
| Register `/register` | Company/user registration. | Create an account and select initial access/plan details where supported. | Backend auth/register API. | Implemented | Admin approval/payment flow may be manual depending on setup. |
| Pricing `/pricing` and `/tarifs` | Public offer/pricing display. | Review available offers. | Frontend and offer data where configured. | Implemented | Real subscription payment gateway if automated purchase is required. |
| E-invoice guide `/e-invoice-guide` | Owner/user education for TEIF/signature/TTN preparation. | Understand e-invoice readiness steps. | Static/controlled UI content. | Implemented | Must be kept legally cautious. |
| Signature/TTN guide `/signature-ttn` | Explains signature and TTN workflow. | Review workflow and limitations. | Frontend content and backend status where connected. | Implemented | Official TTN/signature details. |
| Public offer `/public/offers/:token` | Public offer/devis sharing. | View a shared offer by token. | Public offer API. | Implemented | Email/share flow depends on configured usage. |
| Contact, privacy, terms, legal pages | Public legal/contact information. | Read legal pages or contact information. | Static frontend pages. | Implemented | Owner should review legal text before launch. |

### User / Client Pages

| Page | Purpose | What the user can do | Data used | Current status | Missing dependency |
|---|---|---|---|---|---|
| Dashboard `/dashboard` | Main business overview. | View invoice/payment summaries, recent activity, readiness and access status. | `/api/dashboard/summary` and related APIs. | Implemented | Accurate production data requires seeded/migrated database. |
| Clients `/clients` | Manage customer records. | Create, update, delete/list clients. | Clients API and company database records. | Implemented | None beyond database. |
| Products `/products` | Manage catalog items. | Create, update, delete/list products and services. | Products API. | Implemented | TVA/product rules should be reviewed by owner/accountant. |
| Invoices `/invoices` | Manage invoices. | Create, update/list invoices, generate documents, use workflow actions. | Invoice, client, product, payment, TEIF/signature/TTN data. | Implemented | Legal workflow depends on TTN/signature config. |
| Invoice tracking `/invoice-tracking` | Track invoice lifecycle. | Review invoice status and workflow progress. | Invoice API/status fields. | Implemented | TTN status is legal only after real TTN response. |
| Payments `/payments` and `/reglements` | Track payments received for invoices. | Add/list payments and monitor paid/unpaid balances. | Payments and invoices APIs. | Implemented | Does not process online subscription payments. |
| Devis/quotes `/devis`, `/quotes`, `/mes-devis` | Manage quotes. | Create, list, update, send, and convert quotes where supported. | Devis API, clients, line items. | Implemented | Email sending depends on SMTP. |
| Reports `/reports` | Business reporting. | View financial and invoice/payment reports. | Reports API and company records. | Implemented | Export capability depends on current report implementation. |
| Settings `/settings` | Company profile and configuration. | Update company legal info, logo, readiness-related settings, password/configuration areas. | Settings API, company record, readiness services. | Implemented | TTN, signature, SMTP, AI credentials if used. |
| TEIF/compliance center `/teif` and `/compliance-center` | TEIF and e-invoice workflow area. | Generate/review TEIF-related status and actions. | Invoice compliance workflow services. | Implemented | Official TEIF XSD required for official validation. |
| Audit trail `/audit-trail` and `/historique` | User/company activity history. | Review actions and history. | Audit trail API. | Implemented | None. |
| AI assistant `/ai` | AI business assistant. | Ask assistant questions. | Gemini API through backend. | Conditional | Requires `GEMINI_API_KEY`. |
| Notifications | Top bar/dropdown notifications. | Read, click, navigate, mark as read. | Notifications API. | Implemented | None beyond backend. |
| Help/support `/help` and `/support` | User support request area. | Send help/support requests. | Support API. | Implemented | Email notification/reply requires SMTP if used. |
| Network/messages/offers/projects/opportunities | Collaboration/business workflow pages. | Manage professional network, messages, offers, projects, and opportunities. | Related APIs. | Implemented | Business rules should be confirmed before production launch. |

### Admin Pages

| Page | Purpose | What admin can do | Data used | Current status | Missing dependency |
|---|---|---|---|---|---|
| Admin login `/admin/login` | Admin-only authentication. | Login to the admin area. | Admin auth API. | Implemented | Strong production admin credentials. |
| Admin dashboard `/admin` and `/admin/dashboard` | Platform overview. | View SaaS-wide KPIs and operational status. | Admin API. | Implemented | None beyond migrated database. |
| Companies `/admin/companies` | Company/account management. | View companies, statuses, subscriptions, payment/access state, and take account actions where enabled. | Admin companies API. | Implemented | Manual business process for payment/access approval may be required. |
| Users `/admin/users` | User/account supervision. | Review account/user information. | Admin users API. | Implemented | None. |
| Subscriptions `/admin/subscriptions` | Access/subscription supervision. | Monitor plans, access status, subscription state. | Admin subscription data. | Implemented | Real online billing provider if automation is required. |
| Admin payments `/admin/payments` | Platform payment/subscription payment monitoring. | Review recorded admin/platform payments. | Admin payment APIs/models. | Implemented | Real gateway integration if automatic payment is required. |
| Admin invoices `/admin/invoices` | Platform invoice monitoring. | Review invoice activity and status. | Admin invoice APIs. | Implemented | None. |
| TTN `/admin/ttn` | TTN monitoring/configuration surface. | Review TTN state and workflow readiness. | Admin TTN/compliance APIs. | Implemented as preparation/status surface | Official TTN API details required. |
| Compliance `/admin/compliance` | E-invoice readiness overview. | Review companies/invoices compliance state. | Compliance and readiness APIs. | Implemented | Official XSD, real signature, TTN config. |
| Support `/admin/support` | Support ticket management. | Read and update support requests. | Admin support APIs. | Implemented | SMTP if replies/emails are sent. |
| Activity logs `/admin/activity` | Audit and admin activity. | Review platform/admin actions. | Admin activity/audit API. | Implemented | None. |
| System errors `/admin/system-errors` | Operational monitoring. | Review system-level errors. | Admin system error data. | Implemented | Production logging policy. |
| Settings/integrations `/admin/settings` and `/admin/integrations` | Global integration status/configuration. | Configure or inspect TTN, AI, SMTP, billing, analytics, and signature settings where implemented. | Integration settings service and env variables. | Implemented | Secrets must be configured securely. |
| Analytics/SEO `/admin/analytics-seo` | Marketing/analytics status. | Review analytics/search configuration. | GA/GTM/Search Console integration status. | Implemented | Third-party analytics credentials if used. |

## TTN / El Fatoora Integration Status

The platform prepares the TTN / El Fatoora workflow, but real TTN production integration requires official elements from TTN.

Missing TTN requirements:

| Requirement | Why it is needed |
|---|---|
| Official TTN API documentation | Required to implement authentication, submission, status checks, and error handling correctly. |
| TTN API base URL | Required for sandbox and production HTTP calls. |
| TTN API key or credentials | Required to authenticate requests. |
| Authentication method | Required to know whether TTN uses API key, OAuth, client credentials, username/password, certificates, or another method. |
| Sandbox access | Required for non-legal integration testing. |
| Production access | Required for real legal submission. |
| Official TEIF version | Required to generate the correct XML structure. |
| Official TEIF XSD file | Required for official XML validation. |
| Official XML signature rules | Required for legal electronic signature before submission. |
| Official submit endpoint | Required to send signed XML to TTN. |
| Official status endpoint | Required to check accepted/rejected/pending states. |
| Official proof/download endpoint | Required if TTN returns proof documents. |
| Official rejection/error codes | Required to display precise business/legal errors. |
| QR code/reference rules | Required before showing any official QR code or TTN reference. |

Current behavior:

- Mock/simulation can be used for internal demonstration only.
- Mock TTN must not be considered legal.
- Production must not generate fake TTN accepted status.
- Production must not generate fake TTN reference.
- Production must not generate fake QR code.
- An invoice can only be officially accepted after a real TTN response.
- The current real TTN provider is a safe placeholder until official TTN details are available.

Warning: TTN legal activation is blocked by design until official TTN configuration is provided.

## Electronic Signature Status

The platform has an electronic signature workflow, but legal signature depends on real external configuration.

Current status:

| Area | Status |
|---|---|
| Signature workflow | Implemented. |
| Mock signature provider | Present for demo/development only. |
| Real signature provider | Partially implemented around certificate-based signing configuration. |
| Legal signature readiness | Not guaranteed until official provider/certificate/HSM and TTN-required signature format are confirmed. |
| Production mock safety | Mock signature must remain blocked in production/legal mode. |

Important rules:

- A visual signature or stamp on a PDF is not a legal XML signature.
- Mock signature is for demo only.
- The platform must not display mock signature as legal signature.
- Signed XML must be generated by a real signature provider before real TTN submission.
- Production use requires official signature rules and a validated provider/certificate workflow.

Missing/required configuration:

| Requirement | Purpose |
|---|---|
| Real signature provider | Required to perform legal XML signing. |
| Certificate or HSM access | Required for legal signing material. |
| Certificate storage strategy | Required to keep private keys/certificates outside public folders. |
| Signature mode | Required to distinguish mock, sandbox, certificate, HSM, or remote provider mode. |
| Signing endpoint/provider credentials | Required if using a remote signature provider. |
| Official signature format required by TTN | Required to make signed TEIF/XML acceptable to TTN. |

## Payment and Subscription Status

There are two different payment concepts in this project:

1. Invoice payment tracking
2. SaaS subscription/access payment

Invoice payment tracking is implemented. Users can track payments against invoices, including paid amount, remaining balance, unpaid, partial, and paid states. This is business accounting/payment tracking and does not automatically mean that an invoice is legally accepted by TTN.

SaaS subscription/access payment appears to be handled through admin supervision and integration configuration. The code contains billing integration settings such as `BILLING_PROVIDER`, `BILLING_API_KEY`, and `BILLING_WEBHOOK_SECRET`, but no confirmed automatic payment gateway flow should be presented as complete unless the owner configures and tests a real provider.

If no real payment gateway is configured:

- The owner/admin must approve or manage access manually.
- Online subscription payment is not automatic.
- Real payment gateway integration is required for automated online subscription payments.

Possible future providers may include Stripe, Paymee, Konnect, Flouci, or another provider chosen by the owner. This README does not claim any of them are already implemented as a complete production payment flow.

Payment status and legal/e-invoice status must stay separate:

- A paid invoice is not automatically accepted by TTN.
- A TTN-accepted invoice is not automatically paid.

## AI Assistant Status

The current backend uses Google Gemini through the `@google/generative-ai` package.

Required key:

| Variable | Provider | Status |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini | Required for the current AI assistant to work. |

Additional generic integration variables exist (`AI_PROVIDER`, `AI_API_KEY`) for integration status/configuration surfaces, but the implemented AI controller currently checks and uses `GEMINI_API_KEY`.

Important notes:

- AI works only when the required API key is configured.
- Without `GEMINI_API_KEY`, the AI endpoint should return a clear unavailable/configuration message.
- No AI key should be committed to GitHub.
- API usage may create cost for the owner.
- The owner must provide the key before production activation of the AI assistant.

## Tech Stack

| Area | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router |
| Backend | Node.js 20+, Express 5, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT, bcryptjs |
| PDF generation | Backend PDFKit; frontend also includes jsPDF/html2canvas for frontend exports where used |
| XML/TEIF | Backend TEIF/XML generator using XML utilities |
| Electronic signature | Backend signature provider abstraction, mock provider, certificate-based signing utilities |
| TTN workflow | Backend TTN provider abstraction with mock and safe placeholder provider |
| AI provider | Google Gemini via `@google/generative-ai` |
| Email | Nodemailer / SMTP |
| Security middleware | Helmet, CORS, selected rate limiting |
| File uploads | Multer and backend storage paths |
| Deployment | cPanel/Passenger supported; Docker/Docker Compose files are present for local/VPS use |
| Admin | Separate admin frontend context and backend middleware |

## Architecture Overview

Simple architecture:

```text
Browser frontend -> Backend API -> Services -> Prisma -> PostgreSQL
```

Responsibilities:

- The frontend handles UI, routing, forms, dashboards, admin pages, and user interaction.
- The backend handles authentication, authorization, company isolation, business logic, PDF/XML generation, signature/TTN workflow control, notifications, support, reporting, and audit logs.
- Prisma handles database access and schema migrations.
- Service modules handle invoice logic, TEIF, signature, TTN, PDF, mail, audit, AI usage, login protection, integration settings, analytics, and admin operations.
- External systems include TTN, electronic signature provider/certificate/HSM, Gemini AI, SMTP, analytics services, and any future payment provider.

## Environment Variables

Never commit real `.env` files. Keep only `.env.example` in GitHub.

### Backend Variables

| Variable | Required | Development example | Production note |
|---|---:|---|---|
| `NODE_ENV` | Yes | `development` | Use `production` on server. |
| `APP_ENV` | Recommended | `development` | Use `production` on server. |
| `E_INVOICE_MODE` | Yes | `mock` | Use safe non-mock mode for hosted/legal preparation; never treat mock as legal. |
| `PORT` | Yes | `5005` | Match reverse proxy/cPanel configuration. |
| `DATABASE_URL` | Yes | `postgresql://user:pass@localhost:5440/db?schema=public` | Use private production DB credentials only on server. |
| `JWT_SECRET` | Yes | Placeholder long random string | Must be strong, unique, and private. |
| `JWT_EXPIRES_IN` | Optional | `12h` | Adjust according to owner security policy. |
| `FRONTEND_URL` | Yes | `http://localhost:5173` | Use exact production frontend origin for CORS. |
| `AUTH_FAILED_LOGIN_MAX` | Optional | `10` | Login protection threshold. |
| `AUTH_FAILED_LOGIN_WINDOW_MINUTES` | Optional | `15` | Login protection window. |
| `REGISTER_RATE_LIMIT_MAX` | Optional | `20` | Registration anti-spam limit. |
| `REGISTER_RATE_LIMIT_WINDOW_MINUTES` | Optional | `60` | Registration anti-spam window. |
| `AI_MONTHLY_TOKEN_LIMIT` | Optional | `250000` | Monthly AI usage limit per company where enforced. |
| `GENERAL_RATE_LIMIT_MAX` | Optional | `5000` | Reserved/general guard setting. |
| `GENERAL_RATE_LIMIT_WINDOW_MS` | Optional | `900000` | Reserved/general guard window. |
| `GEMINI_API_KEY` | Required for AI | Empty in local example | Required before enabling AI assistant. |
| `AI_PROVIDER` | Optional | Empty | Integration status/configuration field. |
| `AI_API_KEY` | Optional | Empty | Generic integration field; current AI uses `GEMINI_API_KEY`. |
| `TTN_API_URL` | Required for TTN | Empty | Official TTN value required. |
| `TTN_BASE_URL` | Required for TTN | Empty | Official TTN value required. |
| `TTN_AUTH_MODE` | Required for TTN | Empty | Must match official TTN auth method. |
| `TTN_AUTH_ENDPOINT` | Required for TTN | Empty | Official endpoint required. |
| `TTN_SUBMIT_INVOICE_ENDPOINT` | Required for TTN | Empty | Official endpoint required. |
| `TTN_STATUS_ENDPOINT` | Required for TTN | Empty | Official endpoint required. |
| `TTN_PROOF_ENDPOINT` | Optional | Empty | Required only if TTN provides proof downloads. |
| `TTN_API_KEY` | Required for TTN | Empty | Secret; do not commit. |
| `TTN_CLIENT_ID` | Conditional | Empty | If TTN auth requires client credentials. |
| `TTN_CLIENT_SECRET` | Conditional | Empty | Secret; if TTN auth requires it. |
| `TTN_USERNAME` | Conditional | Empty | If TTN auth requires username/password. |
| `TTN_PASSWORD` | Conditional | Empty | Secret; if TTN auth requires it. |
| `TEIF_XSD_PATH` | Required for official validation | Empty | Path to official XSD outside public web root. |
| `TEIF_SCHEMA_VERSION` | Recommended | Empty | Use official TEIF version. |
| `STORAGE_PATH` | Recommended | `uploads` | Store sensitive artifacts outside public folders where possible. |
| `SIGNATURE_PROVIDER` | Required for legal signature | Empty or `mock` locally | Must be real provider/certificate mode for legal use. |
| `SIGNATURE_MODE` | Required for legal signature | Empty | Defines mock/certificate/HSM/remote strategy. |
| `SIGNATURE_PROVIDER_NAME` | Optional | Empty | Display/configuration label. |
| `SIGNATURE_API_KEY` | Conditional | Empty | Secret for remote provider if used. |
| `SIGNATURE_CERT_PATH` | Conditional | Empty | Certificate path; keep outside public folders. |
| `SIGNATURE_CERT_PASSWORD` | Conditional | Empty | Secret; do not commit. |
| `SIGNATURE_CERT_ALIAS` | Optional | Empty | Certificate identifier/alias. |
| `SIGNATURE_KEY_PATH` | Conditional | Empty | Private key path if used; never public. |
| `SIGNATURE_HSM_URL` | Conditional | Empty | HSM endpoint if used. |
| `SIGNATURE_HSM_TOKEN` | Conditional | Empty | Secret HSM token if used. |
| `SMTP_HOST` | Required for email | Empty | Required for real email sending. |
| `SMTP_PORT` | Required for email | `587` | Match SMTP provider. |
| `SMTP_USER` | Required for email | Empty | SMTP account. |
| `SMTP_PASS` | Required for email | Empty | SMTP password/secret. |
| `ENCRYPTION_KEY` | Recommended | Empty | Required if encrypted integration secrets are stored. |
| `BILLING_PROVIDER` | Conditional | Empty | Required if online billing is implemented/enabled. |
| `BILLING_API_KEY` | Conditional | Empty | Secret billing key. |
| `BILLING_WEBHOOK_SECRET` | Conditional | Empty | Secret webhook verification value. |
| `BILLING_SUCCESS_URL` | Conditional | Empty | Used if billing checkout is implemented. |
| `BILLING_CANCEL_URL` | Conditional | Empty | Used if billing checkout is implemented. |
| `BILLING_SUBSCRIPTION_INVOICES_ENABLED` | Optional | Empty | Admin/status setting for subscription invoice behavior. |
| `GA4_MEASUREMENT_ID` | Optional | Empty | Google Analytics integration. |
| `GTM_CONTAINER_ID` | Optional | Empty | Google Tag Manager integration. |
| `GOOGLE_SEARCH_CONSOLE_SITE_URL` | Optional | Empty | Search Console status/config. |
| `GOOGLE_SERVICE_ACCOUNT_JSON_PATH` | Optional | Empty | Keep service account JSON private. |
| `META_PIXEL_ID` | Optional | Empty | Meta Pixel integration. |

### Frontend Variables

| Variable | Required | Development example | Production note |
|---|---:|---|---|
| `VITE_API_URL` | Yes | `http://localhost:5005/api` | Use production API URL, for example `https://api.example.com/api`. |
| `VITE_BASE_PATH` | Optional | `/` | Use only if app is deployed under a sub-path. |
| `VITE_APP_VERSION` | Optional | `1.2.0` | Display/version metadata if used. |

## Local Development Setup

### Prerequisites

- Node.js 20 or newer
- npm
- Docker Desktop if using the included PostgreSQL service
- PostgreSQL if not using Docker
- Git

### 1. Clone the repository

```bash
git clone <repository-url>
cd el-fatoora
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Configure backend environment

Create `backend/.env` from `backend/.env.example`.

Minimum local example:

```env
NODE_ENV=development
APP_ENV=development
E_INVOICE_MODE=mock
PORT=5005
DATABASE_URL="postgresql://elfatoora:secretpassword@localhost:5440/elfatooradb?schema=public"
JWT_SECRET="development_only_replace_with_a_random_secret_of_at_least_48_chars"
JWT_EXPIRES_IN="12h"
FRONTEND_URL="http://localhost:5173"
GEMINI_API_KEY=""
```

### 5. Configure frontend environment

Create `frontend/.env` from `frontend/.env.example`.

```env
VITE_API_URL=http://localhost:5005/api
VITE_BASE_PATH=/
VITE_APP_VERSION=1.2.0
```

If the backend is on port `5005`, the frontend must point to `http://localhost:5005/api`.

### 6. Start PostgreSQL with Docker

From the repository root:

```bash
docker compose -f backend/docker-compose.yml up -d
```

The included local PostgreSQL service publishes port `5440`.

### 7. Generate Prisma client and run migrations

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

For disposable local development only, `npx prisma db push` may be used when appropriate. Do not use `db push` on production.

### 8. Seed development data

```bash
npm run seed
```

Development seed credentials:

| Account | Email | Password |
|---|---|---|
| Admin | `admin@invoicepro.tn` | `adminpassword123` |
| Demo company user | `demo@invoicepro.tn` | `password123` |

These are for local/demo use only. Never use them in production.

### 9. Start backend

```bash
cd backend
npm run dev
```

Health check:

```text
http://localhost:5005/health
```

Expected response:

```json
{"success":true,"status":"OK"}
```

### 10. Start frontend

```bash
cd frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

Admin login:

```text
http://localhost:5173/admin/login
```

## Production Deployment Notes

Before production deployment:

- Use strong secrets.
- Configure a production PostgreSQL database.
- Configure `DATABASE_URL`.
- Configure `JWT_SECRET`.
- Configure `FRONTEND_URL`.
- Configure frontend `VITE_API_URL`.
- Configure CORS through `FRONTEND_URL`.
- Configure HTTPS.
- Configure Nginx/Apache SPA fallback for the frontend.
- Run Prisma migrations.
- Configure private storage folders for sensitive PDF/XML/TEIF/signature artifacts.
- Configure SMTP if email sending is required.
- Configure `GEMINI_API_KEY` only if the AI assistant should work.
- Configure TTN only when official credentials and documentation are available.
- Configure a real signature provider before enabling legal e-invoice workflow.
- Configure a real payment provider before enabling automatic subscription payment.
- Do not enable fake legal statuses in production.

### Backend build

```bash
cd backend
npm install
npm run build
npx prisma generate
npx prisma migrate deploy
npm start
```

### Frontend build

```bash
cd frontend
npm install
npm run build
```

Deploy only the generated `frontend/dist` static files to the frontend web root.

### cPanel / Passenger note

The backend can be deployed as a Node.js Passenger application:

| Setting | Value |
|---|---|
| Node.js version | 20.x |
| Application mode | Production |
| Startup file | `dist/index.js` |
| Backend health URL | `/health` |

The frontend should be deployed as a static Vite build. Configure Apache/Nginx fallback so React routes such as `/login`, `/dashboard`, and `/admin/login` load `index.html`.

## Security Notes

- Do not commit `.env` files.
- Do not commit API keys.
- Do not commit production database credentials.
- Do not commit certificates or private keys.
- Do not store certificates/private keys in `public`, `public_html`, or any static frontend folder.
- Protect PDF/XML/TEIF/signed XML downloads through authenticated backend routes.
- Keep company data isolated by authenticated company/user ID.
- Keep admin and user access separated.
- Use HTTPS in production.
- Use a strong JWT secret.
- Restrict CORS to the production frontend domain.
- Do not run demo seed data in production.
- Do not expose logs/uploads if they contain personal or commercial data.
- Do not show TTN accepted, legal signature completed, official reference, or official QR code unless produced by real external systems.

## Known Missing Dependencies

| Dependency | Why it is needed | Current status | Who must provide it |
|---|---|---|---|
| TTN API credentials | Required for real TTN authentication and submission. | Missing/not configured. | Project owner / TTN. |
| TTN official documentation | Required to implement correct API contract. | Missing. | Project owner / TTN. |
| TTN sandbox access | Required for integration testing. | Missing/not configured. | Project owner / TTN. |
| TTN production access | Required for legal production submission. | Missing/not configured. | Project owner / TTN. |
| Official TEIF XSD | Required for official XML validation. | Missing/not configured. | Project owner / TTN / official source. |
| Official XML signature rules | Required for legal signed XML. | Missing/not confirmed. | Project owner / TTN / signature authority. |
| Real signature provider/certificate | Required for legal electronic signature. | Missing/not configured. | Project owner / certificate provider. |
| Certificate/HSM storage strategy | Required to protect signing keys. | Must be finalized before legal use. | Project owner + developer/admin. |
| AI API key | Required for AI assistant. | `GEMINI_API_KEY` missing unless owner provides it. | Project owner. |
| Payment gateway solution | Required for automated online subscription payment. | Not confirmed as fully integrated. | Project owner. |
| SMTP credentials | Required for real email sending. | Optional/missing unless configured. | Project owner. |
| Production domain and SSL | Required for public production use. | Must be configured on hosting. | Project owner/hosting admin. |
| Server database credentials | Required for production database. | Must be configured privately. | Project owner/hosting admin. |
| Analytics credentials | Required only for analytics integrations. | Optional. | Project owner. |

## Owner Checklist Before Production

- [ ] Provide production domain.
- [ ] Provide server/hosting access.
- [ ] Provide production database credentials.
- [ ] Provide SMTP credentials if email sending is required.
- [ ] Provide `GEMINI_API_KEY` if AI assistant should work.
- [ ] Choose payment provider for online subscription payment.
- [ ] Provide payment provider API keys if automated billing is required.
- [ ] Obtain TTN official documentation.
- [ ] Obtain TTN sandbox credentials.
- [ ] Obtain TTN production credentials.
- [ ] Provide official TEIF XSD.
- [ ] Confirm official XML signature rules required by TTN.
- [ ] Choose/provide real electronic signature provider, certificate, or HSM.
- [ ] Test user registration and login.
- [ ] Test admin login and company approval/access flow.
- [ ] Test invoice creation.
- [ ] Test PDF generation.
- [ ] Test payment tracking.
- [ ] Test quotes/devis creation and conversion.
- [ ] Test settings/company file readiness.
- [ ] Test notifications.
- [ ] Test support requests.
- [ ] Test TEIF generation.
- [ ] Test real signature in sandbox once provider is available.
- [ ] Test TTN sandbox submission once TTN access is available.
- [ ] Test backup and restore strategy.

## Developer Checklist Before Pushing to GitHub

- [ ] Remove real `.env` files from Git tracking.
- [ ] Keep only `.env.example` files.
- [ ] Remove private certificates and keys.
- [ ] Remove sensitive logs.
- [ ] Remove sensitive uploads or generated documents.
- [ ] Run backend build/typecheck.
- [ ] Run frontend lint.
- [ ] Run frontend build.
- [ ] Run Prisma generate.
- [ ] Run e-invoice verification script.
- [ ] Verify README accuracy against current code.
- [ ] Verify no secrets are committed.

Useful commands:

```bash
cd backend
npm run build
npm run lint
npm run verify:einvoice
npx prisma generate
```

```bash
cd frontend
npm run lint
npm run build
```

## Current Limitations

- TTN legal production depends on official TTN configuration, official documentation, official endpoints, and sandbox/production credentials.
- Electronic signature legal production depends on a real provider/certificate/HSM and official TTN signature rules.
- Official TEIF validation depends on the official TEIF XSD.
- Automatic SaaS subscription payment requires a real payment gateway integration if the owner wants online payment.
- AI assistant requires `GEMINI_API_KEY`.
- SMTP email sending requires real SMTP credentials.
- Some admin/integration surfaces expose configuration/status management, but external systems still need real credentials and final provider-specific testing.
- Mock/demo e-invoice workflows are not legal and must never be presented as production acceptance.

## Final Owner Summary

The platform is a strong base for commercial invoicing and preparation for Tunisian e-invoicing. The owner can deploy and test the commercial modules, while TTN legal submission, real electronic signature, AI assistant, and automated online payment require the missing external credentials/providers listed above.

