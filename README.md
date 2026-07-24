# Taytlo

Taytlo is a modern anime catalog for discovering titles, checking ratings, saving favorites, and finding what to watch next.

Visit: [taytlo.com](https://taytlo.com)

## What Taytlo Includes

- Anime catalog with search and filters.
- Clean anime pages with readable URLs.
- Shikimori ratings.
- Genres and franchises.
- Favorites, watch history, and personal lists.
- Episode availability where legal public data is available.
- Responsive design for desktop and mobile.
- Dark and light themes.

## Tech Stack

- Next.js
- React
- TypeScript
- Prisma
- PostgreSQL-ready backend

## Requirements

- Node.js 20 or newer
- pnpm 9 or newer

## Local Development

```bash
git clone https://github.com/TheYeldo/taytlo.git
cd taytlo
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The example environment uses `TAYTLO_STORE="dev"`, so local accounts, sessions, and libraries are written to the ignored `data/dev-db.json` file. PostgreSQL is not required for this development mode.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical URL used by metadata, the sitemap, and robots configuration. |
| `NEXT_PUBLIC_YANDEX_METRIKA_ID` | No | Yandex Metrika counter ID. |
| `ADMIN_TOKEN` | For admin access | Protects administrative health and moderation actions. |
| `TAYTLO_STORE` | No | Selects `dev` for the local JSON store or `prisma` for PostgreSQL during development. |
| `DATABASE_URL` | For PostgreSQL | Prisma connection string used by the production backend and optional local database mode. |

Never commit real tokens or database credentials. Keep local overrides in `.env.local`.

## Data Store Modes

- Development defaults to the local JSON store unless `TAYTLO_STORE="prisma"` is selected.
- Prisma mode requires `DATABASE_URL`; run `pnpm db:migrate` before starting the application against a new local database.
- Production requires `DATABASE_URL` and uses the Prisma/PostgreSQL store. Apply committed migrations with `pnpm db:deploy` during deployment.

## Validation Commands

```bash
pnpm test       # Run the Node test suite
pnpm typecheck  # Check TypeScript without emitting files
pnpm build      # Create a production build
```

## Project Status

Taytlo is actively being improved. New anime, better pages, mobile polish, and discovery features are added over time.

## Legal Note

Taytlo is an anime discovery and catalog project. Availability information is based on public or legal sources where possible.
