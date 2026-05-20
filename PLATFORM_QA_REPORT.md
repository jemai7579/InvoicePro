# Platform QA report

## Commands run

- `npm run build` in `backend` — passed.
- `npm run build` in `frontend` — passed.
- `npm run lint` in `frontend` — passed with 9 existing hook dependency warnings.
- `npx prisma migrate status` in `backend` — database reachable, but local DB is not migration-baselined.
- HTTP smoke checks:
  - `GET /health` — passed.
  - Frontend `/` — passed.
  - Frontend `/e-invoice-guide` — passed.
  - Unauthenticated `GET /api/invoices` — returned `401`, as expected.
- API workflow smoke test:
  - Register user — passed.
  - Update company dossier — passed.
  - Login token/protected calls — passed.
  - Create client — passed.
  - Create product/service — passed.
  - Create invoice — passed.
  - Validate invoice — passed.
  - Generate TEIF — passed.
  - Mock sign — passed with non-legal simulation message.
  - Mock TTN submit/check accepted — passed in mock mode.
  - PDF/XML downloads — passed.
  - Audit trail query — passed.
- Production guard checks:
  - `APP_ENV=production` + `E_INVOICE_MODE=mock` — blocked as expected.
  - Production TEIF without XSD — blocked with `TEIF_XSD_NOT_CONFIGURED`.
  - Production TTN without config — blocked with `TTN_API_NOT_CONFIGURED`.

## Successful checks

- Public landing and guide routes load.
- Landing header links to `Guide e-Facture`.
- Private invoice API is protected.
- Backend and frontend builds pass.
- Frontend lint has no errors.
- Local mock invoice workflow works end to end.
- Payment status remains separate from legal e-invoice status.
- Readiness endpoint returns mode, TEIF/signature/TTN readiness, company dossier status, and missing requirements.
- Mock signature and mock TTN are clearly demo-only.
- Production mode does not fake legal signature, TTN reference, or TTN acceptance.

## Bugs fixed

- Added `companyDossierComplete`, dossier status, and missing dossier fields to `/api/settings/einvoice/status`.
- Blocked signing and TTN submission when the company dossier is incomplete.
- Fixed TEIF matricule fiscal validation to accept the registration format `1234567/A/B/C/001`.
- Fixed frontend lint errors in guide/settings/invoice/devis/context/helper files.
- Fixed the Guide e-Facture dynamic icon lint issue.

## Remaining issues

- Frontend lint still reports 9 hook dependency warnings. They are not build blockers, but should be reviewed before a larger refactor.
- Prisma migrate status reports unapplied migrations because the existing local database is not migration-baselined. Local schema was previously synced with `prisma db push`.
- No backend or frontend test script exists in `package.json`.
- Role-based permissions for signing/TTN submission are not granular yet; current authorization is company-token based.
- Real TTN integration cannot be implemented until official TTN documentation is received.

## Files changed

- `backend/src/services/einvoiceConfig.ts`
- `backend/src/services/teifWorkflowService.ts`
- `backend/src/utils/teifGenerator.ts`
- `backend/src/controllers/settingsController.ts`
- `frontend/src/pages/Settings.jsx`
- `frontend/src/pages/EInvoiceGuide.jsx`
- `frontend/src/pages/Invoices.jsx`
- `frontend/src/pages/Devis.jsx`
- `frontend/src/pages/Demandes.jsx`
- `frontend/src/pages/Demo.jsx`
- `frontend/src/pages/SignatureTTN.jsx`
- `frontend/src/components/SettingsHistoryModal.jsx`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/context/AdminAuthContext.jsx`
- `frontend/src/context/LanguageContext.jsx`
- `frontend/vite.config.js`
- `frontend/test-translations.js`

## Files created

- `TTN_MEETING_READINESS.md`
- `PLATFORM_QA_REPORT.md`

## Database migrations

- Existing e-invoice migration: `backend/prisma/migrations/20260520_einvoice_readiness/migration.sql`.
- Local database status: reachable but not migration-baselined. Use `prisma migrate deploy` only after baselining or on a clean migration-managed database.

## Required env variables

- `APP_ENV`
- `E_INVOICE_MODE`
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `TTN_BASE_URL`
- `TTN_AUTH_ENDPOINT`
- `TTN_SUBMIT_INVOICE_ENDPOINT`
- `TTN_STATUS_ENDPOINT`
- `TTN_DOWNLOAD_PROOF_ENDPOINT`
- `TTN_API_KEY`
- `TTN_CLIENT_ID`
- `TTN_CLIENT_SECRET`
- `TTN_USERNAME`
- `TTN_PASSWORD`
- `TEIF_SCHEMA_VERSION`
- `TEIF_XSD_PATH`
- `SIGNATURE_PROVIDER`
- `SIGNATURE_CERT_PATH`
- `SIGNATURE_CERT_PASSWORD`
- `SIGNATURE_CERT_ALIAS`
- `SIGNATURE_HSM_URL`
- `SIGNATURE_HSM_TOKEN`

## Manual test checklist

- Landing page opens.
- Guide e-Facture opens from header.
- Register works.
- Login works.
- Dashboard opens.
- Company dossier update works.
- Client creation works.
- Product/service creation works.
- Invoice creation works.
- Invoice totals are correct.
- Payment status update works.
- PDF download works.
- TEIF generation works.
- Mock signature works only in mock mode.
- TTN mock works only in mock mode.
- Production mode blocks mock behavior.
- Readiness status endpoint works.
- Audit logs are created.

## Production blockers

- Official TEIF XSD must be configured.
- Real signature provider/certificate/HSM flow must be configured.
- Real TTN API credentials and endpoints must be configured.
- Migration baseline must be resolved for the target production database.
- Granular role permissions should be added if TTN requires signer/operator separation.

## TTN blockers

- Official API documentation.
- Sandbox credentials.
- Official TEIF version and XSD.
- Signature standard and certificate requirements.
- Submit/status/proof endpoints.
- Error code and rejection model.
- QR/reference rules.
- SaaS/multi-client mandate rules.
- Legal archiving requirements.

## Deployment notes

- Keep `E_INVOICE_MODE=mock` only for local/demo.
- Use `APP_ENV=production` and `E_INVOICE_MODE=production` only after TTN, TEIF XSD, and signature provider configuration are complete.
- Never store certificate passwords in the database.
- Do not expose TTN/signature secrets to the frontend.
