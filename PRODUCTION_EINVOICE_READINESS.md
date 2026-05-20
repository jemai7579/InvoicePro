# Production e-invoice readiness

## Implemented now

- Strict runtime modes: `APP_ENV=development|test|production` and `E_INVOICE_MODE=mock|sandbox|production`.
- Backend refuses `APP_ENV=production` with `E_INVOICE_MODE=mock`.
- TEIF generation uses real invoice, company, client, line, TVA, date, and total data validation.
- TEIF artifacts store XML path, SHA-256 hash, generation date, and configured TEIF version.
- Mock signature is allowed only in mock mode and is clearly labelled as non-legal.
- Production signature cannot use the mock provider and does not persist certificate passwords.
- TTN mock submission/acceptance is kept only for mock mode.
- Sandbox/production TTN paths require official endpoint and credential configuration before use.
- Invoice legal status and payment status are separated.
- Settings exposes `/api/settings/einvoice/status` and the UI shows missing production requirements.
- Audit logs are created for invoice creation/update, TEIF generation, signature success/failure, TTN submission/status, PDF/XML downloads, settings changes, and signature configuration changes.

## Still mock

- `E_INVOICE_MODE=mock` uses simulated signatures and simulated TTN references/acceptance for demos only.
- No official TTN endpoint contract is implemented yet because the official API documentation is still required.
- Official TEIF XSD validation is blocked in production unless `TEIF_XSD_PATH` and `TEIF_SCHEMA_VERSION` are configured.

## Modes

- `mock`: local demo mode. Simulates signature and TTN. Not legal.
- `sandbox`: reserved for official TTN test credentials. Does not fake TTN acceptance.
- `production`: strict legal mode. Blocks mock signature, fake TTN references, and fake TTN acceptance.

## Required env variables

Core:

```env
APP_ENV=production
E_INVOICE_MODE=production
DATABASE_URL=
JWT_SECRET=
FRONTEND_URL=
```

TEIF:

```env
TEIF_SCHEMA_VERSION=
TEIF_XSD_PATH=
```

Signature:

```env
SIGNATURE_PROVIDER=
SIGNATURE_CERT_PATH=
SIGNATURE_CERT_PASSWORD=
SIGNATURE_CERT_ALIAS=
SIGNATURE_HSM_URL=
SIGNATURE_HSM_TOKEN=
```

TTN:

```env
TTN_BASE_URL=
TTN_AUTH_ENDPOINT=
TTN_SUBMIT_INVOICE_ENDPOINT=
TTN_STATUS_ENDPOINT=
TTN_DOWNLOAD_PROOF_ENDPOINT=
TTN_API_KEY=
TTN_CLIENT_ID=
TTN_CLIENT_SECRET=
TTN_USERNAME=
TTN_PASSWORD=
```

## Configure TEIF XSD

Place the official TTN TEIF XSD on the server, set `TEIF_XSD_PATH` to that file path, and set `TEIF_SCHEMA_VERSION` to the official version. Production blocks TEIF validation with `TEIF_XSD_NOT_CONFIGURED` until this is done.

## Configure signature provider

Use `SIGNATURE_PROVIDER=mock` only in local mock mode. Production must use a real provider, certificate, HSM, or delegated signing service confirmed by the official workflow. Certificate passwords must stay in environment/secrets storage, not in the database.

## Configure TTN API

After TTN provides official documentation, implement the real calls in `backend/src/services/ttnProvider.ts` using the configured authentication, submit, status, and proof endpoints. Until then, sandbox/production will block instead of faking acceptance.

## Legal workflow

`draft -> teif_generated -> ready_for_signature -> signed -> submitted_to_ttn -> accepted_by_ttn | rejected_by_ttn -> archived`

Payment status is separate:

`unpaid | partially_paid | paid | overdue`

## Depends on TTN meeting

- Official authentication method.
- Official TEIF version and XSD.
- XML signature standard and whether signing happens before TTN or via a TTN-approved provider.
- Submit/status/proof endpoint shapes.
- Error codes, reference/QR rules, mandates, and archiving obligations.
