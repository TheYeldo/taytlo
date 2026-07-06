# Product Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve anime cards and detail pages so the live site feels cleaner and more trustworthy.

**Architecture:** Keep the current Next.js App Router structure. Add formatting helpers in the components/pages that render the labels, and add metadata fields through the existing `generateMetadata` function.

**Tech Stack:** Next.js 14, React 18, TypeScript, CSS modules through global CSS.

---

### Task 1: Card Labels

**Files:**
- Modify: `src/components/AnimeCard.tsx`
- Modify: `src/app/globals.css`

- [ ] Replace `? серий` with a formatter that shows known episode count, movie/special labels, or "серии уточняются".
- [ ] Make card chips use stable sizing so genre text fits without clipped first/last letters.
- [ ] Keep existing links and image behavior unchanged.

### Task 2: Detail Page Trust Cues

**Files:**
- Modify: `src/app/anime/[slug]/page.tsx`
- Modify: `src/app/globals.css`

- [ ] Reuse the same episode formatter on the anime page.
- [ ] Make the main CTA say "Смотреть серии" only when AniLibria episodes are available; otherwise guide to details.
- [ ] Improve Shikimori and next episode labels without inventing missing values.

### Task 3: SEO Metadata

**Files:**
- Modify: `src/app/anime/[slug]/page.tsx`

- [ ] Add canonical URL for each anime page.
- [ ] Add Open Graph URL/type and Twitter card metadata using the existing image and description.

### Task 4: Verification

**Commands:**
- `pnpm run typecheck`
- `pnpm run build`

- [ ] Typecheck passes.
- [ ] Production build passes.
- [ ] Review `git diff --check`.

### Task 5: Detail Navigation SEO

**Files:**
- Modify: `src/app/anime/[slug]/page.tsx`
- Modify: `src/app/globals.css`

- [ ] Add visible breadcrumbs from Taytlo to catalog to franchise.
- [ ] Make anime genre tags link back to filtered catalog pages.
- [ ] Add `BreadcrumbList` structured data alongside existing anime JSON-LD.
