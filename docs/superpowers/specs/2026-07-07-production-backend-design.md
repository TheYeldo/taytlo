# Production Backend Design

Goal: make Taytlo ready for real production storage on PostgreSQL while keeping the current Next.js app and user-facing behavior intact.

Scope:
- Use the existing Prisma schema as the source of truth for production database tables.
- Add a committed initial Prisma migration so Vercel/Postgres can be prepared with `prisma migrate deploy`.
- Add a catalog sync script that copies the static anime catalog into the `Anime` and `AnimeExternalId` tables.
- Add a shared backend health helper for the admin page and `/api/admin/health`.
- Keep local development on `dev-json` unless `TAYTLO_STORE=prisma` or a production `DATABASE_URL` is configured.

Non-goals:
- Do not replace the current UI.
- Do not add paid auth providers yet.
- Do not expose admin instructions or secrets in public docs.
- Do not require a database for local static builds.

Operational flow:
1. Create a Postgres database.
2. Add `DATABASE_URL`, `TAYTLO_STORE=prisma`, `ADMIN_TOKEN`, and `NEXT_PUBLIC_SITE_URL` in Vercel.
3. Run `pnpm run db:deploy`.
4. Run `pnpm run db:seed`.
5. Check `/admin?token=...` and `/api/admin/health` for backend status.

Verification:
- `pnpm run db:generate`
- `pnpm run typecheck`
- `pnpm run build`
