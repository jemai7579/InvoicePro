# Prisma migration fix

Date: 2026-05-20

## What was found

`npx prisma migrate status` can connect to the local PostgreSQL database, but it reports these migrations as unapplied:

- `20260420_business_numbering_and_product_lines`
- `20260518_network_clients_separation`
- `20260518_project_owner_feedback_v2`
- `20260519_e_houwiya_onboarding`
- `20260520_einvoice_readiness`

This usually means the database schema was previously synchronized with `prisma db push`, manual SQL, or another migration path, but the `_prisma_migrations` table was not baselined with the migration history.

## What not to do

Do not run `prisma migrate reset` on any database that contains useful data. It drops and recreates the schema.

Do not manually delete rows or tables to make migration status look clean.

## Safest local/dev solution

Use this path only for a local development database after backing it up.

1. Confirm the database is local/dev:

```powershell
cd backend
npx prisma migrate status
```

2. If the schema already matches the migration files and you want to preserve local data, baseline each existing migration as applied:

```powershell
cd backend
npx prisma migrate resolve --applied 20260420_business_numbering_and_product_lines
npx prisma migrate resolve --applied 20260518_network_clients_separation
npx prisma migrate resolve --applied 20260518_project_owner_feedback_v2
npx prisma migrate resolve --applied 20260519_e_houwiya_onboarding
npx prisma migrate resolve --applied 20260520_einvoice_readiness
npx prisma migrate status
```

3. If this is a disposable local database with no useful data, the simpler option is:

```powershell
cd backend
npx prisma migrate reset
npx prisma migrate dev
```

Only use this disposable path when losing local data is acceptable.

## Safest production solution

Before production, do not baseline blindly.

1. Take a verified database backup.
2. Compare the production schema against `backend/prisma/schema.prisma`.
3. Inspect each migration SQL file and confirm whether its changes are already present.
4. If a migration's changes are already present, mark only that migration as applied:

```powershell
cd backend
npx prisma migrate resolve --applied <migration_folder_name>
```

5. If a migration's changes are not present, apply migrations normally:

```powershell
cd backend
npx prisma migrate deploy
```

6. Re-run:

```powershell
npx prisma migrate status
```

## Recommendation

For the current local database, the safest non-destructive fix is to baseline the five reported migrations with `prisma migrate resolve --applied` after confirming the schema already contains those columns/tables. For production, perform the same decision migration-by-migration only after backup and schema comparison.
