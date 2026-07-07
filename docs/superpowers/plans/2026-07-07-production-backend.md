# Production Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare Taytlo for real PostgreSQL-backed production storage through Prisma.

**Architecture:** Keep the existing Next.js API routes and account store abstraction. Add Prisma deployment scripts, a catalog sync script, committed migration SQL, and a shared health helper consumed by the admin page and admin API.

**Tech Stack:** Next.js 14 App Router, Prisma 5, PostgreSQL, TypeScript, Vercel.

---

### Task 1: Prisma Migration

**Files:**
- Create: `prisma/migrations/20260707000000_init/migration.sql`

- [ ] Add SQL generated from the current Prisma schema.
- [ ] Include enums, tables, indexes, unique constraints, and foreign keys.

### Task 2: Production Scripts

**Files:**
- Modify: `package.json`
- Create: `scripts/sync-catalog-prisma.mjs`

- [ ] Add `postinstall`, `db:deploy`, `db:seed`, and `backend:prepare` scripts.
- [ ] Add a catalog sync script that upserts anime rows and external IDs from `data/catalog.json`.

### Task 3: Backend Health

**Files:**
- Create: `src/lib/backend-health.ts`
- Modify: `src/app/api/admin/health/route.ts`
- Modify: `src/app/admin/page.tsx`

- [ ] Add a shared health function that reports store mode, env readiness, database connectivity, latency, and counts.
- [ ] Use the helper in the admin API.
- [ ] Show database status and counts in the admin page.

### Task 4: Documentation

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

- [ ] Document production env vars.
- [ ] Document migration and catalog sync commands.
- [ ] Keep private admin-token usage out of public README details.

### Task 5: Verification

**Commands:**
- `pnpm run db:generate`
- `pnpm run typecheck`
- `pnpm run build`

- [ ] Prisma client generation passes.
- [ ] TypeScript passes.
- [ ] Production build passes.

### Task 6: Normalized User Activity Tables

**Files:**
- Create: `src/lib/prisma-anime.ts`
- Modify: `src/lib/prisma-store.ts`
- Modify: `src/lib/user-comments.ts`
- Modify: `src/lib/backend-health.ts`
- Modify: `src/app/admin/page.tsx`

- [ ] Add a shared helper that upserts catalog anime into the Prisma `Anime` table.
- [ ] Keep `UserLibrary` JSON for compatibility while also syncing `Favorite`, `WatchListItem`, and `WatchProgress`.
- [ ] Reuse the shared anime helper for episode comments.
- [ ] Expose normalized table counts in backend health and admin UI.
