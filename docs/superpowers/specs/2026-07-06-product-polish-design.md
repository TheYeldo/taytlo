# Product Polish Design

Goal: make the live Taytlo experience feel more trustworthy and finished without changing the core architecture.

Scope:
- Anime cards should stop showing placeholder question marks for episode counts.
- Detail pages should use clearer labels for rating, episodes, release source, and next episode information.
- SEO metadata should expose canonical URLs and useful Open Graph URLs for anime pages.
- Visual changes should stay inside the current Taytlo style: compact dark interface, mint/blue accents, and responsive card layouts.

Approach:
- Add small formatting helpers near the components that need them.
- Keep existing data sources and APIs unchanged.
- Avoid fake values. If data is unknown, show honest text such as "серии уточняются" or "оценка недоступна".

Verification:
- Run TypeScript checks.
- Run production build.
- Inspect changed files and git diff before committing.
