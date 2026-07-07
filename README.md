# Taytlo

Taytlo is a Next.js anime catalog with clean title pages, Shikimori ratings, AniLibria episode availability, favorites, watch history, user lists, comments, search, genres, franchises, schedule pages, and SEO-friendly anime URLs.

## Features

- Next.js App Router.
- Human-readable anime pages, for example `/anime/provozhayuschaya-v-posledniy-put-friren`.
- Anime catalog API and title detail API.
- AniLibria episode API integration for legal public release data.
- Built-in HLS player for available AniLibria episodes.
- Favorites, watch history, watch progress, user lists and episode comments.
- Profile page with registration, login and personal library.
- Dark/light theme, responsive navigation, mobile-first catalog layout.
- Search by anime title, genre and franchise.
- Shikimori ratings with cached catalog data.
- Episode schedule and upcoming releases.
- SEO metadata, `sitemap.xml`, `robots.txt` and JSON-LD on anime pages.
- PostgreSQL-ready Prisma schema for production storage.

## Local Development

```bat
cd outputs\taytlo-next
start-dev.cmd
```

Then open:

```text
http://localhost:3000
```

## Production Build

```bat
cd outputs\taytlo-next
build-next.cmd
```

Or run directly:

```bat
pnpm run build
```

## Data Storage

By default, local development can use a simple dev storage file for accounts and user activity. For production, use PostgreSQL through Prisma.

Example production environment:

```env
TAYTLO_STORE="prisma"
DATABASE_URL="postgresql://user:password@host:5432/taytlo?schema=public"
NEXT_PUBLIC_SITE_URL="https://taytlo.com"
```

Then prepare Prisma:

```bat
pnpm run db:deploy
pnpm run db:seed
```

`db:deploy` applies committed Prisma migrations. `db:seed` syncs `data/catalog.json` into PostgreSQL so admin health checks, comments and user activity can reference anime rows immediately.

For a fresh production database, the combined command is:

```bat
pnpm run backend:prepare
```

Admin health is available through the protected admin area and `/api/admin/health`. Keep the admin token in environment variables only.

## Deployment

The project is ready for Vercel. Push changes to the GitHub repository connected to Vercel, and Vercel will build and deploy the latest version automatically.

Recommended Vercel settings:

- Framework: Next.js
- Build command: `pnpm run build`
- Install command: `pnpm install`
- Production branch: `main`

After creating a production PostgreSQL database, add these environment variables in Vercel:

```text
TAYTLO_STORE=prisma
DATABASE_URL=<your production postgres url>
NEXT_PUBLIC_SITE_URL=https://taytlo.com
ADMIN_TOKEN=<long private token>
```

## SEO

The site exposes:

- `/sitemap.xml`
- `/robots.txt`
- Open Graph metadata
- anime page metadata
- JSON-LD structured data

After deploying to a real domain, add the domain to Google Search Console and submit:

```text
https://taytlo.com/sitemap.xml
```

## Notes

Private maintenance notes should not be stored in this public README.
