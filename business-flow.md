# PlanDayWithIntents
## Actors
- EndUser
- WebApplication
- Database
## Prerequisites
- User is authenticated.
- At least one IntentType exists for the user (seeded defaults or custom).
## Trigger
User opens `/day/[date]` or navigates to a specific calendar day.
## Goal
The selected day displays all TimeBlocks for that date with correct intent colors, and any unsaved draft from a prior session is either restored or discarded per user choice.
## Process
- LoadDayContext: Fetch intent types, blocks for the date, and weekly budget snapshot for the ISO week containing the date.
- RenderTimeline: Paint hour grid and blocks; enable drag-resize handles.
- EditBlock: User creates or updates a block (title, intent, start/end); server validates overlap rules (warn, not hard-block for MVP).
- PersistBlock: Save block via server action; return updated aggregates for the week intent meter.
- OptionalReflectPrompt: If local time is after 20:00 and no reflection exists, show dismissible link to reflection flow.

## Exceptions
### UnauthenticatedAccess
- Step: LoadDayContext
- Conditions: Session missing or expired.
- Destination: Terminate (redirect to `/login`)

### InvalidBlockRange
- Step: PersistBlock
- Conditions: endAt <= startAt or duration < 5 minutes.
- Destination: Terminate (inline validation error)

## NFRs
### DayLoadLatency
- Step: LoadDayContext
- Purpose: Day view must feel instant when switching dates.
- Border: p95 server response < 300ms for ≤ 50 blocks on cold DB; client paint < 100ms after data received on mid-tier laptop.

# SetWeeklyIntentBudget
## Actors
- EndUser
- WebApplication
- Database
## Prerequisites
- User is authenticated.
- Current ISO week is computable from client date picker.
## Trigger
User opens `/week` and edits hour targets per intent type.
## Goal
WeeklyIntentBudget rows for (userId, weekStart) are upserted; week dashboard shows planned vs actual hours per intent.
## Process
- LoadWeekSummary: Fetch blocks in week range and existing budget rows.
- EditBudgetTargets: User adjusts hour inputs per intent (0–168 total across intents allowed to exceed 168 with warning only).
- SaveBudget: Upsert budget records atomically per intent type.
- RecomputeActuals: Sum block durations grouped by intent; return chart data.

## Exceptions
### NegativeHours
- Step: SaveBudget
- Conditions: Any target < 0.
- Destination: Terminate

## NFRs
### BudgetConsistency
- Step: SaveBudget
- Purpose: Avoid partial writes leaving week in inconsistent state.
- Border: Single transaction; all intents saved or none.

# EndOfDayReflection
## Actors
- EndUser
- WebApplication
- Database
## Prerequisites
- User is authenticated.
- At least one TimeBlock exists on the reflection date (optional for MVP—allow empty with note).
## Trigger
User opens `/reflect/[date]` or accepts prompt from day view.
## Goal
A DayReflection record exists with optional note and selected carry-forward block IDs copied to next day as drafts.
## Process
- LoadReflectionContext: Fetch blocks and existing reflection if any.
- ComposeReflection: User writes short note (≤ 2000 chars) and checks blocks to carry forward.
- SaveReflection: Upsert reflection; clone selected blocks as next-day drafts with start times shifted by +1 day preserving duration.
- NavigateNext: Offer link to tomorrow's day view.

## Exceptions
### CarryForwardConflict
- Step: SaveReflection
- Conditions: Target day already has block with identical client temp id (retry).
- Destination: Pass (idempotent upsert by sourceBlockId)

## NFRs
### ReflectionDurability
- Step: SaveReflection
- Purpose: Users trust nightly notes are not lost.
- Border: Write acknowledged only after DB commit; optimistic UI rolls back on failure.

# AuthenticateUser
## Actors
- EndUser
- WebApplication
- Database
## Prerequisites
- Auth provider credentials configured in environment.
## Trigger
User submits login form or OAuth callback completes.
## Goal
Valid session established; User row exists linked to provider subject.
## Process
- PresentLogin: Show email magic link or OAuth (GitHub) per stack.
- VerifyCredential: Auth library validates token / code.
- UpsertUser: Create or update User by provider id.
- EstablishSession: Set HTTP-only session cookie.
- RedirectHome: Send to `/day/today` (computed server-side in user TZ).

## Exceptions
### InvalidCredential
- Step: VerifyCredential
- Conditions: Token invalid or expired.
- Destination: Terminate (error message on login page)

## NFRs
### SessionSecurity
- Step: EstablishSession
- Purpose: Protect calendar data.
- Border: Cookies `Secure`, `HttpOnly`, `SameSite=Lax`; session max 30 days sliding.

# ManageIntentTypes
## Actors
- EndUser
- WebApplication
- Database
## Prerequisites
- User is authenticated.
## Trigger
User opens `/settings/intents`.
## Goal
User-defined IntentType list updated; default palette preserved; blocks referencing deleted intents reassigned to system "Uncategorized" intent.
## Process
- ListIntents: Return ordered intents with color hex and archived flag.
- MutateIntent: Create, rename, recolor, reorder, or archive intent.
- ReassignOnArchive: Soft-archive; blocks keep foreign key; UI maps archived to read-only color.

## Exceptions
### DuplicateName
- Step: MutateIntent
- Conditions: Name collides case-insensitively among active intents.
- Destination: Terminate

## NFRs
### IntentCatalogLimit
- Step: MutateIntent
- Purpose: Keep UI manageable.
- Border: Max 12 active intents per user.
