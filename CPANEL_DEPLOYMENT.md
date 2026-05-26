# InvoicePro / El Fatoora - cPanel Deployment

## Deployment Status

The web application can be deployed in production with legal e-invoice functions disabled or blocked. Do not enable `E_INVOICE_MODE=production` until an official TTN transport implementation and validated signature/XSD setup have been completed: the current non-mock TTN provider deliberately throws instead of faking a legal submission or acceptance.

Mock mode is for local development only and is refused when `NODE_ENV=production` or `APP_ENV=production`.

## Build Before Uploading

Use Node.js 20 or newer locally:

```bash
cd backend
npm install
npx prisma generate
npx prisma validate
npm run typecheck
npm run build

cd ../frontend
npm install
npm run lint
VITE_API_URL="https://api.example.com/api" npm run build
```

The Vite build copies `frontend/public/.htaccess` into `frontend/dist/.htaccess` for Apache SPA routing.

Do not upload `.env`, `.git`, logs, local `uploads`, `node_modules`, or development Docker files as web-accessible content.

## Frontend In `public_html`

1. Upload the contents of `frontend/dist/` to `public_html/`, including `.htaccess`.
2. Confirm `public_html/.htaccess` contains the SPA fallback:

```apacheconf
Options -Indexes
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>
```

3. Confirm direct visits to routes such as `/login` and `/invoices` serve `index.html`.

## Backend As A cPanel Node.js App

cPanel shared hosting normally runs Node applications through Passenger/Application Manager. Docker Compose is not assumed or required.

1. Upload the `backend/` folder outside `public_html`, for example `~/apps/invoicepro-backend`.
2. In **Setup Node.js App** / **Application Manager**, create a Node.js 20+ application.
3. Set **Application Root** to `apps/invoicepro-backend`.
4. Set **Application URL** to the API subdomain or path, for example `https://api.example.com`.
5. Set **Application startup file** to `dist/index.js`.
6. Open the cPanel terminal in the application root and run:

```bash
npm install --omit=dev
npm run build
npx prisma generate
npx prisma migrate deploy
```

`npm run build` requires TypeScript to be available. If the cPanel install with `--omit=dev` omits the compiler, build `backend/dist` locally and upload it, then run only `npm install --omit=dev`, `npx prisma generate`, and `npx prisma migrate deploy` on the server.

7. Configure the environment variables listed below in the Node.js App interface.
8. Restart the Node.js application from cPanel.

Never use `prisma migrate dev` or `prisma db push` on the production database. Production schema changes use:

```bash
npx prisma migrate deploy
```

## Required Production Variables

General production configuration:

```env
NODE_ENV=production
APP_ENV=production
PORT=5005
DATABASE_URL="postgresql://DB_USER:STRONG_DB_PASSWORD@DB_HOST:5432/DB_NAME?schema=public"
JWT_SECRET="GENERATE_A_UNIQUE_RANDOM_SECRET_AT_LEAST_48_CHARACTERS_LONG"
JWT_EXPIRES_IN="12h"
FRONTEND_URL="https://app.example.com"
E_INVOICE_MODE=sandbox
```

Use `E_INVOICE_MODE=sandbox` only for non-legal testing with official sandbox configuration. Production startup refuses `mock`. The legal production workflow is blocked until the official TTN implementation is completed.

Optional features:

```env
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="no-reply@example.com"
SMTP_PASS="STRONG_SMTP_PASSWORD"
GEMINI_API_KEY=""
```

Frontend build-time production variable:

```env
VITE_API_URL=https://api.example.com/api
VITE_BASE_PATH=/
```

When official e-invoice production integration is implemented and validated, `E_INVOICE_MODE=production` also requires:

```env
TEIF_XSD_PATH="/home/CPANEL_USER/private/teif/official-schema.xsd"
TEIF_SCHEMA_VERSION="OFFICIAL_SCHEMA_VERSION"
SIGNATURE_PROVIDER="certificate"
SIGNATURE_CERT_PATH="/home/CPANEL_USER/private/certificates/company.p12"
SIGNATURE_CERT_PASSWORD="CERTIFICATE_SECRET"
TTN_BASE_URL="OFFICIAL_TTN_BASE_URL"
TTN_AUTH_ENDPOINT="OFFICIAL_AUTH_ENDPOINT"
TTN_SUBMIT_INVOICE_ENDPOINT="OFFICIAL_SUBMIT_ENDPOINT"
TTN_STATUS_ENDPOINT="OFFICIAL_STATUS_ENDPOINT"
TTN_API_KEY="OFFICIAL_API_SECRET"
```

Store certificates, TTN materials, and XSD files outside `public_html`.

## PostgreSQL And Prisma

1. Create the PostgreSQL database and database user in cPanel.
2. Grant the user access to the database.
3. Set `DATABASE_URL` to that database.
4. Confirm migration folders are uploaded in `backend/prisma/migrations/`.
5. Run from the backend application root:

```bash
npx prisma generate
npx prisma validate
npx prisma migrate deploy
```

Do not run the demo seed in production; it is guarded to refuse production execution.

## Post-Deployment Verification

After restarting Passenger:

```bash
curl https://api.example.com/health
```

Expected response:

```json
{"success":true,"status":"OK"}
```

Verify in the browser:

1. The frontend loads and direct SPA routes do not return Apache 404 pages.
2. Register/login reaches the production API URL.
3. Authenticated invoice PDF/XML access works only for the owning company.
4. Manual requests to set `SIGNED`, `SENT_TO_TTN`, or `ACCEPTED_TTN` receive HTTP `403`.
5. Legal workflow buttons remain blocked until real XSD, signing, and TTN integration are configured.

## VPS Alternative

`docker-compose.prod.yml` may remain an alternative for a VPS where Docker is available. It is not the shared-cPanel deployment method.
