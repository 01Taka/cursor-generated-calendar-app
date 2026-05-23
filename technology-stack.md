# Frontend
- Language: TypeScript(5.7)
  Strict typing across UI and shared Zod schemas; aligns with Next.js 15 App Router docs volume.
- Framework: Next.js(15.1) + React(19.0)
  App Router for layouts, server components on read-heavy views, client components for drag timeline.
- Styling: Tailwind CSS(4.0) + tailwind-merge(2.6) + clsx(2.1)
  Utility-first styling with conflict-safe class merging for variant components.
- StateManagement: Zustand(5.0)
  Local UI state for drag interactions and optimistic block edits before server confirmation.

# Backend
- Language: TypeScript(5.7)
  Shared types with frontend via monorepo-style `/src` tree.
- Framework: Next.js(15.1) Server Actions + Route Handlers
  Colocate mutations with pages; minimal separate API surface for auth callbacks only.
- DatabaseConnection/ORM: Prisma(6.3) + @prisma/client(6.3)
  Type-safe schema, migrations, and seed for default intents.
- APICommunicationStandards: Zod(3.24)
  Validate all server action inputs and structured return unions.

# Database
- Database: PostgreSQL(16)
  Relational model for users, blocks, budgets, reflections; JSON only where needed for carry-forward metadata.
- Cache/KVS: (none for MVP)
  Skip Redis until multi-device realtime sync is required.

# Infrastructure/Hosting
- ApplicationHosting: Vercel
  Zero-config Next.js deploy; cron via Vercel Cron for daily maintenance endpoint.
- DatabaseHosting: Neon PostgreSQL
  Serverless Postgres with connection pooling compatible with Prisma.

# CrossPlatformService
- Authentication/Authorization: Auth.js / NextAuth(5.0) + @auth/prisma-adapter(2.7)
  GitHub OAuth for frictionless dev/demo; session in DB via Prisma adapter.
- ErrorMonitoring/Logging: console + (optional) Sentry later — omitted in MVP

# DevelopmentTooling/QualityAssurance
- Linter/Formatter: ESLint(9) + eslint-config-next(15.1) + Prettier(3.4)
- TestingFramework: Vitest(3.0) + @testing-library/react(16.0) — unit tests for date/intent math only in MVP
- PackageManager: pnpm(9.15)
