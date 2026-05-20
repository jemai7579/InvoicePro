# Role and permission notes

Date: 2026-05-20

## Current state

The application currently authenticates a `Company` account and a separate platform `Admin` account. There is not yet a full per-company user table with assignable roles such as owner, admin, accountant, signer, or viewer.

Because of that, existing company accounts are treated as `owner` by default.

## Minimal guards added

Backend route guards now support these future role concepts without changing the database yet:

- `owner`: default for current company accounts; can configure settings, upload signature certificate, create invoices, generate TEIF, sign, and submit to TTN.
- `admin`: can configure settings/signature and create invoices.
- `accountant`: can create invoices and generate TEIF.
- explicit `canSignInvoices`: can sign if a future user model provides this boolean.
- explicit `canSubmitTtn`: can submit to TTN if a future user model provides this boolean.

Protected sensitive routes:

- `PUT /api/settings`
- `POST /api/settings/certificate`
- `POST /api/invoices`
- `POST /api/invoices/:id/generate-teif`
- `POST /api/invoices/:id/sign-teif`
- `POST /api/invoices/:id/submit-ttn`

## Remaining TODO

A full role-management system should be implemented after the business decision is made:

- Add a `User` or `CompanyUser` model.
- Add roles: `owner`, `admin`, `accountant`, `signer`, `viewer`.
- Add permissions: `settings.manage`, `signature.configure`, `invoice.create`, `invoice.sign`, `ttn.submit`, `audit.read`.
- Update login/JWT payloads to identify the user and company separately.
- Add UI for inviting/managing users and assigning roles.
- Add audit logs for role changes.

The current cleanup does not introduce that full system because it would be a larger authentication and authorization change.
