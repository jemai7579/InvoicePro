# E-Invoice Signature / TEIF / TTN Verification

This checklist must be completed before enabling legal e-invoice features for clients.

## Current Production-Safety Rule

Commercial modules may be deployed normally. Legal e-invoice workflow must remain blocked until:

- official TTN API/auth/status contracts are configured and tested
- a real signature provider/certificate or HSM is configured
- official TEIF XSD validation is configured
- mock mode is disabled in production

Simulation output is never legal.

## Automated Verification

Run from `backend/`:

```bash
npm run verify:einvoice
npx prisma generate
npm run build
npm run lint
```

## Manual End-to-End Tests

1. Create an invoice for the authenticated company.
2. Validate the invoice and generate TEIF XML.
3. Verify TEIF XML is generated from real invoice, company, client, line, TVA, stamp-duty, and total data.
4. Try signing without a certificate/provider. Expected: clear error, no legal signed state.
5. Set `APP_ENV=production` and `E_INVOICE_MODE=mock`. Expected: backend startup fails.
6. Set production e-invoice mode without real signature provider. Expected: signing blocked with “Signature électronique réelle non configurée”.
7. Configure a real provider/certificate or HSM in a private server path, not a public folder.
8. Sign TEIF with the real provider. Expected: signed XML exists, belongs to the same company/invoice, metadata contains provider, mode, signedAt, signatureHash, signedXmlPath, isMock=false, validationStatus.
9. Try submitting to TTN without TTN config. Expected: “Configuration TTN requise avant soumission réelle”.
10. Verify mock TTN is blocked in production.
11. Submit to sandbox only when sandbox credentials/endpoints are configured.
12. Check TTN status. Accepted status is allowed only from a real provider response with real TTN reference.
13. Generate PDF and verify wording:
    - mock mode: “Simulation / non légal”
    - TEIF generated but unsigned: “TEIF généré — signature requise”
    - mock signed: “Signature simulée — non légale”
    - real signed: “Signature électronique appliquée”
    - not submitted: “Non soumise à TTN”
    - missing TTN config: “Configuration TTN requise”
14. Download XML/PDF as the owning company. Expected: success.
15. Try downloading XML/PDF using another company account. Expected: 404/403, no file leakage.
16. Verify audit trail contains TEIF generation, signature success/failure, TTN submit/check, and PDF/XML downloads.

## Required Private Environment Variables

- `NODE_ENV`
- `APP_ENV`
- `E_INVOICE_MODE`
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `TTN_BASE_URL`
- `TTN_AUTH_MODE`
- `TTN_AUTH_ENDPOINT`
- `TTN_SUBMIT_INVOICE_ENDPOINT`
- `TTN_STATUS_ENDPOINT`
- `TTN_API_KEY` or OAuth/client credentials
- `TEIF_XSD_PATH`
- `TEIF_SCHEMA_VERSION`
- `SIGNATURE_PROVIDER`
- `SIGNATURE_MODE`
- `SIGNATURE_CERT_PATH` and `SIGNATURE_CERT_PASSWORD`, or HSM variables
- `STORAGE_PATH`

Never commit `.env`, private certificates, private keys, HSM tokens, signed XML, TEIF XML, TTN proof files, or production credentials.

## Official TTN Dependency

The real TTN provider remains intentionally blocked until official TTN documentation defines:

- authentication contract
- submit payload and response schema
- status lookup response schema
- rejection-code semantics
- official QR/proof source
- production certificate/signature expectations
