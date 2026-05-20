# Platform functionality audit

Date: 2026-05-20

## 1. Features audited

- Public landing page, header navigation, login/register links, and public guide route.
- Guide e-Facture content, source links, legal wording, and public access.
- Authentication, JWT-protected backend routes, register/login/get-me/logout flow.
- Dashboard, reports, clients, products/services, invoices, payments, devis, settings, company dossier, audit trail, and AI assistant surface.
- TEIF generation, validation rules, XML artifact storage, XML hash, TEIF version, and generation timestamp.
- Electronic signature provider abstraction, mock signature mode, production signature guards, certificate-secret handling.
- TTN provider abstraction, mock TTN mode, production/sandbox configuration guards, status checking, and proof-download placeholder.
- PDF/XML download routes and artifact storage.
- Environment validation, Docker/PostgreSQL local configuration, Prisma schema/migrations, Vite/React build, backend TypeScript build.

## 2. Issues found

- Production safety needed explicit blocking for `APP_ENV=production` with `E_INVOICE_MODE=mock`.
- TEIF production validation could not be considered real without an official TTN XSD path.
- Mock signature and mock TTN behavior needed hard boundaries so they cannot create fake legal outcomes in production.
- Payment status and legal electronic invoice status needed to stay separate.
- Company dossier completeness was not part of legal readiness.
- Product/service inputs could accept invalid numeric values, which could later produce incorrect invoice totals.
- The backend was serving the whole `uploads` directory publicly, which risked exposing private XML/PDF/signature/certificate artifacts.
- Login was not represented in the audit trail.
- The local database schema is reachable, but the existing database is not migration-baselined, so `prisma migrate status` reports unapplied migrations even after schema sync.
- The project has no backend test script, no backend lint script, no frontend test script, and no frontend typecheck script.
- No granular role model exists for separate signing/TTN permissions; current authorization is company-token based.
- TTN official endpoints, authentication, TEIF XSD, signature profile, QR/reference rules, and proof payloads are still unknown.

## 3. Issues fixed

- Added strict e-invoice environment validation for `APP_ENV` and `E_INVOICE_MODE`.
- Added TTN, TEIF, and signature placeholders to environment examples.
- Added production guard for missing official TEIF XSD:
  `TEIF_XSD_NOT_CONFIGURED: Please configure the official TTN TEIF XSD before production use.`
- Added sandbox/production guard for missing TTN API config:
  `TTN_API_NOT_CONFIGURED: Please configure official TTN API credentials and endpoints before production use.`
- Added TEIF validation for issuer, customer, lines, TVA, invoice date, totals, timbre fiscal, TTC, and Tunisian matricule fiscal formats.
- Stored TEIF XML path, XML hash, generation timestamp, and TEIF version.
- Added signature provider checks, mock-mode messaging, production mock blocking, signed XML reference, signature timestamp, signed-by user, certificate identifier, and audit logs.
- Added TTN provider abstraction methods for authentication, submit, status, and proof download.
- Separated `paymentStatus` from legal `legalStatus`.
- Added dossier readiness into `/api/settings/einvoice/status`.
- Added public Guide e-Facture route and replaced the visible landing header "Tarifs" link with "Guide e-Facture".
- Added audit metadata fields for IP, user agent, metadata, and error message.
- Added login audit logging.
- Limited public static uploads to `/uploads/logos` only.
- Added product/service validation for required name, non-negative price, and TVA rate between 0 and 100.
- Fixed frontend lint errors; remaining frontend lint output is warnings only.

## 4. Incomplete features requiring TTN official information

- Real TTN authentication flow.
- Official submit/status/proof endpoint paths and payloads.
- Official TEIF version and XSD/schema validation package.
- XML signature profile, required algorithms, canonicalization rules, and accepted certificates.
- Whether signature is performed before TTN submission or inside a TTN/provider flow.
- TTN reference and QR code generation rules.
- Official rejection codes and error payloads.
- Sandbox credentials, certification process, rate limits, retries, idempotency, and legal archiving requirements.

## 5. Incomplete features requiring business decisions

- Granular user roles and permissions for signing, TTN submission, admin settings, and audit review.
- Dossier document approval workflow and who validates each file.
- Multi-client mandate model for accountants or SaaS operators.
- Retention policy and archive export workflow.
- Exact production UI copy after TTN confirms the legal process.

## 6. Commands run

- Backend: `npm run build`
- Frontend: `npm run lint`
- Frontend: `npm run build`
- Prisma: `npx prisma migrate status`
- Public smoke checks: `GET /health`, `GET /`, `GET /e-invoice-guide`
- API smoke checks: unauthenticated invoices request, register, settings update, readiness check, client creation, product creation, invoice creation, TEIF generation, mock signature, mock TTN submission/status, PDF download, XML download, audit trail fetch.
- Production guard checks against compiled backend services.

## 7. Build results

- Backend TypeScript build: passed.
- Frontend Vite build: passed.
- Frontend ESLint: passed with React Hook dependency warnings only.
- Prisma database connection: reachable.
- Prisma migration status: database is reachable, but local DB is not baselined and reports existing migrations as unapplied.

## 8. Test results

- Landing page returned HTTP 200.
- Guide e-Facture returned HTTP 200 and is public.
- Protected invoice API returned HTTP 401 without token.
- Register/login smoke flow worked.
- Company dossier readiness returned complete after filling required profile fields.
- Client/product/invoice creation worked.
- Invoice totals smoke result: HT 200, TVA 38, TTC 239.
- TEIF generation worked in mock mode.
- Mock signature worked and returned the required non-legal simulation message.
- Mock TTN submission/status worked only in mock mode.
- PDF/XML protected downloads returned HTTP 200 for the authenticated company.
- Audit trail returned entries for sensitive workflow actions.
- Production strict guards blocked mock mode, missing TEIF XSD, and missing TTN config.

## 9. Manual testing checklist

- Landing page opens.
- Header "Guide e-Facture" opens `/e-invoice-guide`.
- Login and register links still work.
- Register a company with required legal fields.
- Login, logout, and revisit a private route.
- Dashboard opens with empty and populated data.
- Update company dossier in Settings.
- Check `/api/settings/einvoice/status`.
- Create, edit, search, and delete a client.
- Create, edit, search, and delete a product/service.
- Create an invoice with product and manual lines.
- Verify HT, TVA, timbre fiscal, TTC, due date, and invoice number.
- Add partial and full payments; verify payment status only.
- Generate PDF and TEIF XML.
- Sign in mock mode and verify the non-legal message.
- Submit/check TTN in mock mode and verify non-legal labeling.
- Switch to production configuration in a safe local copy and verify mock behavior is blocked.
- Confirm audit logs for create/update/download/sign/submit/payment/settings actions.

## 10. Remaining risks

- Official TTN behavior cannot be fully tested until TTN provides documentation and sandbox access.
- Local migration history needs a clean baseline before a real deployment migration process.
- Existing generated `dist` and local upload artifacts are dirty in the worktree; they should be reviewed before committing.
- No automated test suite exists, so the current verification is build plus manual/API smoke testing.
- Role-based signing/submission permissions need a schema/business decision.

## 11. Files modified

- `backend/src/index.ts`
- `backend/src/controllers/authController.ts`
- `backend/src/controllers/productController.ts`
- `backend/src/controllers/invoiceController.ts`
- `backend/src/controllers/paymentController.ts`
- `backend/src/controllers/settingsController.ts`
- `backend/src/routes/settingsRoutes.ts`
- `backend/src/services/auditTrailService.ts`
- `backend/src/services/complianceStorage.ts`
- `backend/src/services/einvoiceConfig.ts`
- `backend/src/services/signatureProvider.ts`
- `backend/src/services/teifWorkflowService.ts`
- `backend/src/services/ttnProvider.ts`
- `backend/src/services/ttnService.ts`
- `backend/src/utils/pdfGenerator.ts`
- `backend/src/utils/teifGenerator.ts`
- `backend/prisma/schema.prisma`
- `backend/.env.example`
- `frontend/src/App.jsx`
- `frontend/src/pages/Landing.jsx`
- `frontend/src/pages/EInvoiceGuide.jsx`
- `frontend/src/pages/Invoices.jsx`
- `frontend/src/pages/Settings.jsx`
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
- Documentation files listed below.

## 12. Files created

- `PLATFORM_FUNCTIONALITY_AUDIT.md`
- `PLATFORM_QA_REPORT.md`
- `PRODUCTION_EINVOICE_READINESS.md`
- `TTN_MEETING_CHECKLIST.md`
- `TTN_MEETING_READINESS.md`
- `backend/prisma/migrations/20260520_einvoice_readiness/migration.sql`
- `frontend/src/pages/EInvoiceGuide.jsx`
