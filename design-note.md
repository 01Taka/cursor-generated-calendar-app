# IntentDay — Design Notes

## Product name and positioning
**IntentDay** is a personal intent calendar: every block is colored by *why* time is spent (Deep Work, Recovery, Connection, Admin), not only *what* meeting title says. Target: solo knowledge workers who feel their calendar is full but meaningless.

## Timezone and date boundaries
- All `date` route params are `YYYY-MM-DD` in the **user's timezone** (`User.timezone`, default `UTC`).
- Day range query: `[startOfDay, startOfDay + 1 day)` in user TZ converted to UTC for DB `timestamptz`.
- ISO week starts **Monday** (`weekStart` is that Monday's date string).

## Overlap policy (MVP)
- Overlapping blocks are **allowed** with a subtle warning stripe in UI (no hard reject). Rationale: meetings + focus overlay happen in real life; emotional goal is clarity not policing.

## Drag timeline (client)
- Grid: 6:00–23:00 visible, 15-minute snap on drag end.
- Minimum block duration: 5 minutes (server enforced).
- Optimistic updates via Zustand; rollback on server action failure toast.

## Auth (MVP scope)
- GitHub OAuth via Auth.js v5; Prisma adapter tables `Account`, `Session`, `User`.
- No email magic link in v1 to reduce setup friction.
- `seedUserDefaults` runs in `signIn` event callback.

## Visual design tokens
| Token | Light | Dark |
|-------|-------|------|
| surface | `#FAFAF9` | `#0C0A09` |
| card | `#FFFFFF` | `#1C1917` |
| border | `#E7E5E4` | `#292524` |
| accent | `#4F46E5` | `#818CF8` |

Intent colors come from DB `colorHex`, not theme tokens.

## Environment variables
```
DATABASE_URL=
AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

## Out of scope (v1)
- External calendar sync (Google/Outlook)
- Multi-user sharing
- Mobile native apps
- Recurring events
- Notifications / reminders

## File structure convention
```
src/
  app/           # Next.js routes
  components/    # UI
  lib/           # prisma, auth, dates, actions
  stores/        # zustand
prisma/
  schema.prisma
  seed.ts
```

## Cron (optional deploy)
`GET /api/cron/maintenance` with `Authorization: Bearer ${CRON_SECRET}` deletes draft blocks older than 7 days.
