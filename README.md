# IntentDay

A personal calendar where every time block is colored by **intention** (Deep Work, Recovery, Connection, Admin)—not just meeting titles.

## Spec documents

Product and technical specs live in the repo root:

- `planning.md` — user profile, emotional value, core experience
- `role-actor.md`, `business-flow.md`, `technology-stack.md`
- `page-outlines.md`, `database.md`, `api.md`, `design-note.md`

## Setup

1. Copy `.env.example` to `.env` and fill in values.
2. Create a PostgreSQL database (e.g. [Neon](https://neon.tech)).
3. Create a [GitHub OAuth App](https://github.com/settings/developers) with callback `http://localhost:3000/api/auth/callback/github`.
4. Install and migrate:

```bash
pnpm install
pnpm db:push
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm db:push` | Sync Prisma schema to DB |
# cursor-generated-calendar-app
