# TTN meeting readiness

## 1. Project summary

InvoicePro / El Fatoora is a Tunisian electronic invoicing SaaS built on React/Vite/Tailwind, Node.js/Express/TypeScript, PostgreSQL, and Prisma.

Main modules:

- Public landing page and public Guide e-Facture page.
- Authentication, subscription/quota checks, and protected dashboard.
- Clients, products/services, devis/quotes, invoices, payments, reports, settings, company dossier, audit trail, and AI assistant.
- TEIF XML generation, PDF generation, signature provider abstraction, TTN provider abstraction, and local compliance artifact storage.

Invoice lifecycle:

1. Draft invoice is created.
2. Invoice is validated.
3. TEIF XML is generated from real invoice data.
4. XML is signed.
5. Signed invoice is submitted to TTN / El Fatoora.
6. TTN status is checked.
7. Accepted invoices allow final PDF/XML/proof handling.

Modes:

- Mock: local demo mode only. Simulation is clearly non-legal.
- Sandbox: future TTN test environment if TTN provides one. No fake legal acceptance.
- Production: strict mode. Mock signature, fake TTN references, and fake TTN acceptance are blocked.

## 2. What is already ready

- Invoice creation, validation, totals, lines, TVA, timbre fiscal, PDF download.
- Client and product/service management.
- Product/service validation now blocks invalid prices and invalid TVA rates.
- Payment tracking separated from legal e-invoice status.
- TEIF generator structure with issuer/customer/line/TVA/totals validation.
- TEIF artifact storage with XML path, hash, version, and generation timestamp.
- Signature provider abstraction with mock and real-provider placeholder.
- TTN service abstraction with `authenticate`, `submitSignedInvoice`, `getSubmissionStatus`, and proof-download placeholder.
- Audit logs for sensitive invoice/settings/payment/download/login actions.
- `/api/settings/einvoice/status` readiness endpoint.
- Public Guide e-Facture page for user education.
- Private compliance artifacts are no longer served as public static files; downloads go through authenticated routes.
- Production guards:
  - `APP_ENV=production` + `E_INVOICE_MODE=mock` is blocked.
  - Missing official TEIF XSD blocks production TEIF validation.
  - Missing TTN config blocks sandbox/production TTN actions.

## 2.1 QA status on 2026-05-20

- Backend build passed.
- Frontend build passed.
- Frontend lint passed with warnings only.
- Public landing page and `/e-invoice-guide` returned HTTP 200.
- Protected invoice API returned HTTP 401 without authentication.
- Demo API smoke flow passed: register, settings readiness, client, product, invoice, TEIF generation, mock signature, mock TTN submit/status, PDF/XML download, and audit trail.
- Production strict checks passed: mock mode is blocked in production, production TEIF validation requires the official XSD, and production/sandbox TTN actions require official config.
- Local Prisma connection works, but the current local database is not migration-baselined; this must be cleaned up before deployment migrations.

## 3. What we need from TTN

- Official API documentation.
- Sandbox access and test credentials.
- Production access procedure.
- Authentication method.
- Official base URL and endpoint paths.
- Official TEIF version.
- Official TEIF XSD/schema package.
- XML signature requirements and accepted algorithms/profile.
- Certificate requirements and accepted providers.
- Confirmation whether signing is done before submission or through TTN.
- Submit invoice endpoint.
- Check status endpoint.
- Download proof endpoint.
- Official error codes and rejection payloads.
- QR code/reference generation rules.
- Multi-client, mandate, accountant, or SaaS-provider rules.
- Legal archiving rules and retention duration.
- Rate limits and retry/idempotency rules.
- Testing procedure and approval/certification process for our platform.

## 4. Questions to ask TTN

### Français

1. Pouvez-vous nous fournir la documentation officielle de l’API El Fatoora / TTN ?
2. Existe-t-il un environnement sandbox avec des identifiants de test ?
3. Quelle méthode d’authentification est utilisée : API key, OAuth2, certificat, mTLS, login/mot de passe ou autre ?
4. Quelle est la version officielle actuelle du format TEIF ?
5. Pouvez-vous fournir le XSD officiel TEIF et les règles de validation ?
6. Quel standard de signature XML est exigé ?
7. La signature doit-elle être faite avant l’envoi ou via un fournisseur/flux TTN ?
8. Quels certificats ou prestataires de signature sont acceptés ?
9. Quels sont les endpoints officiels pour soumettre, suivre le statut et télécharger la preuve ?
10. Quels sont les codes d’erreur et les motifs de rejet possibles ?
11. Qui génère la référence TTN et le QR code : TTN ou la plateforme ?
12. Quelles sont les règles pour une plateforme SaaS multi-clients ?
13. Faut-il un mandat par client/entreprise ?
14. Quelles sont les obligations d’archivage légal ?
15. Quelle procédure de test ou certification TTN doit-on suivre avant production ?

### English

1. Can you provide the official El Fatoora / TTN API documentation?
2. Is a sandbox environment available with test credentials?
3. Which authentication method is required: API key, OAuth2, certificate, mTLS, username/password, or another method?
4. What is the current official TEIF version?
5. Can you provide the official TEIF XSD and validation rules?
6. Which XML signature standard/profile is required?
7. Must signing happen before submission or through a TTN/provider workflow?
8. Which certificates or signature providers are accepted?
9. What are the official submit, status, and proof-download endpoints?
10. What are the error codes and rejection payloads?
11. Who generates the TTN reference and QR code: TTN or the platform?
12. What rules apply to a multi-client SaaS platform?
13. Is a mandate required per client/company?
14. What are the legal archiving requirements?
15. What test or certification process is required before production?

## 5. Demo checklist for the meeting

- Show landing page.
- Show Guide e-Facture page.
- Show company dossier/readiness status.
- Create a client and product/service.
- Create an invoice and verify totals.
- Generate TEIF XML.
- Show signature simulation with “Mode simulation — non légal”.
- Show production strict guards for missing TTN/TEIF configuration.
- Show PDF/XML downloads.
- Show audit logs.
- Show where TTN credentials and TEIF/signature settings will be configured.
