# TTN demo script

Date: 2026-05-20

## Goal

Show TTN that InvoicePro / El Fatoora is structurally ready for real integration while being honest about what is still mock/demo and what requires official TTN documentation.

## Demo setup

- Backend running locally.
- Frontend running locally.
- `APP_ENV=development`
- `E_INVOICE_MODE=mock`
- Demo company account available.
- Demo client/product/invoice data can be created live.

## Step-by-step demo

### 1. Open the landing page

Open:

```text
http://localhost:5173
```

Show the public first page and the existing branding.

### 2. Click Guide e-Facture

Click the header button:

```text
Guide e-Facture
```

Show:

- TTN / El Fatoora explanation.
- TEIF explanation.
- Electronic signature explanation.
- Company dossier requirements.
- Simulation, sandbox, and production modes.
- Source links to Idaraty, El Fatoora, and TTN documents.

### 3. Login

Open:

```text
http://localhost:5173/login
```

Login with the demo company.

### 4. Show settings/readiness

Open Settings and show:

- Mode actuel.
- TEIF configuré.
- Signature électronique configurée.
- TTN API connectée.
- Dossier entreprise complet.
- Peut émettre des factures légales.
- Exigences manquantes.

Explain that production mode blocks missing official TTN/TEIF/signature requirements.

### 5. Create a client

Open Clients and create a client with:

- Name/company name.
- Email if available.
- Address/city if available.
- Matricule fiscal if available.

### 6. Create a product/service

Open Products/Services and create one item:

- Name.
- Price HT.
- TVA rate.

Mention that invalid negative prices and invalid TVA rates are blocked.

### 7. Create an invoice

Open Invoices and create an invoice:

- Select the client.
- Select the product/service.
- Confirm HT, TVA, timbre fiscal, and TTC.

### 8. Generate TEIF

Click:

```text
Générer XML TEIF
```

Explain:

- The XML is generated from real invoice data.
- Issuer, customer, invoice lines, TVA, totals, date, and matricule fiscal are validated.
- XML path, hash, timestamp, and version are stored.
- In production, official TTN XSD is required.

### 9. Sign in mock mode

Click:

```text
Signer électroniquement
```

Show the required message:

```text
La facture a été signée en mode simulation. Ce document n'a pas de valeur légale.
```

Explain that production mode forbids mock signature.

### 10. Submit to TTN in mock mode

Click:

```text
Envoyer à TTN
```

Show the non-legal simulation badge:

```text
Mode simulation — non légal
```

Explain that production mode never generates fake TTN references and never marks acceptance without a real TTN response.

### 11. Show production mode blocks fake behavior

Explain the backend guards:

- `APP_ENV=production` with `E_INVOICE_MODE=mock` refuses startup.
- Production TEIF validation without official XSD throws:

```text
TEIF_XSD_NOT_CONFIGURED: Please configure the official TTN TEIF XSD before production use.
```

- Production/sandbox TTN actions without official config throw:

```text
TTN_API_NOT_CONFIGURED: Please configure official TTN API credentials and endpoints before production use.
```

### 12. Show audit logs

Open audit trail/history and show logs for:

- Login.
- Invoice creation/update.
- TEIF generation.
- Signature.
- TTN submission/status.
- PDF/XML downloads.
- Settings changes.

### 13. Show what we need from TTN

Open:

```text
TTN_MEETING_READINESS.md
```

Ask for:

- Official API documentation.
- Sandbox access.
- Authentication method.
- TEIF version and XSD.
- XML signature standard.
- Submit/status/proof endpoints.
- Error codes.
- QR/reference generation rules.
- SaaS multi-client/mandate rules.
- Legal archiving rules.
- Certification/testing process.

## Closing message

InvoicePro can demonstrate the complete invoice workflow in local mock mode today. For production, it intentionally blocks fake signature and fake TTN validation until TTN provides official API, schema, and signature requirements.
