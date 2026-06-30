# Taytlo Next

Это первая backend-ready версия Taytlo на Next.js. Старый рабочий сайт в `outputs/anime-site` не тронут.

## Что уже есть

- Next.js App Router.
- Человекопонятные страницы: `/anime/provozhayuschaya-v-posledniy-put-friren`.
- API: `/api/anime`, `/api/anime/[slug]`, `/api/schedule`.
- API серий AniLibria: `/api/anilibria/[slug]/episodes`.
- Встроенный HLS-плеер для доступных серий AniLibria.
- Локальные избранное, список просмотра, история, прогресс серии и комментарии под сериями.
- Профиль `/profile`: регистрация, вход, выход и просмотр своей библиотеки.
- Dev-backend для аккаунтов и библиотеки через `data/dev-db.json`.
- Переключатель тёмной/светлой темы, новый favicon, поиск по жанрам/франшизам, топ запросов, обновления, популярное и порядок просмотра франшизы.
- SEO: metadata, `sitemap.xml`, `robots.txt`, JSON-LD на страницах аниме.
- Импорт текущего каталога, постеров, Shikimori-рейтингов и календаря.
- Prisma-схема под PostgreSQL: пользователи, избранное, история просмотра, комментарии, кэш рейтингов, расписание.
- Закрытая основа админки: `/admin?token=...`.

## Как запустить локально

```bat
cd outputs\taytlo-next
start-dev.cmd
```

После запуска открой:

```text
http://localhost:3000
```

## Как пересобрать данные и production build

```bat
cd outputs\taytlo-next
build-next.cmd
```

## Админка

Создай `.env.local` по примеру `.env.example` и укажи длинный `ADMIN_TOKEN`.

```env
ADMIN_TOKEN="very-long-secret-token"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Пока это защитный слой для разработки. Для настоящего релиза лучше добавить логин, роли и хранение пользователей в PostgreSQL.

## Аккаунты

В разработке аккаунты сохраняются в `data/dev-db.json`. Файл не нужно коммитить: он игнорируется в `.gitignore`.

Сейчас это удобно для проверки регистрации, избранного, списков, прогресса просмотра и комментариев. Перед реальным хостингом этот слой нужно заменить на PostgreSQL через Prisma.

## PostgreSQL / Prisma

По умолчанию сайт использует dev-хранилище `data/dev-db.json`, чтобы локально ничего не настраивать.

Для продакшена включи Prisma:

```env
TAYTLO_STORE="prisma"
DATABASE_URL="postgresql://user:password@host:5432/taytlo?schema=public"
```

Затем выполни:

```bat
pnpm db:generate
pnpm db:push
```

После этого auth API, профиль, избранное, списки, история, прогресс и комментарии будут сохраняться в PostgreSQL.

## Следующий этап

1. Поднять реальную PostgreSQL-базу на хостинге.
2. Включить `TAYTLO_STORE="prisma"` и выполнить `pnpm db:push`.
3. Добавить OAuth/почтовую верификацию или нормальный password reset.
4. Сделать полноценную админку для обновления каталога, постеров и SEO.
