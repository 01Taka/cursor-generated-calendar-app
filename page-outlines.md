# Layouts
## RootLayout
### Description
Global HTML shell, font, theme tokens, and AuthSessionProvider for client islands.
### Features
- ThemeProvider: Light/dark CSS variables for intent colors and surfaces.
- SessionProvider: Auth.js session context for client components.

## AppShellLayout
### Description
Authenticated chrome with sidebar navigation and week intent summary strip.
### Features
- SideNav: Links to Today, Week, Reflect, Settings.
- WeekIntentMeter: Mini bar showing planned vs actual hours for current week.
- UserMenu: Sign out and profile shortcut.

# Pages
## `/`
- Rendering: Static
### Layouts
- RootLayout
### Description
Marketing-style landing that explains IntentDay and routes signed-in users to today.
### Features
- HeroSection: Value proposition copy.
- SignInButton: Navigate to login.
- AutoRedirect: Server check session → `/day/[today]`.
### Transitions
- `/login` via SignInButton
- `/day/[date]` via AutoRedirect when authenticated

## `/login`
- Rendering: Dynamic
### Layouts
- RootLayout
### Description
Authentication entry with GitHub OAuth.
### Features
- GitHubSignInButton: Start OAuth flow.
- ErrorAlert: Show auth errors from query params.
### Transitions
- `/day/[date]` after successful auth (callback)

## `/day/[date]`
- Rendering: Dynamic
### Layouts
- RootLayout
- AppShellLayout
### Description
Primary day timeline: view and edit time blocks with intent colors; core product surface.
### Features
- DateNavigator: Prev/next day, jump to today.
- DayTimeline: Hour grid with draggable/resizable blocks.
- QuickAddBar: Parse "Deep work 9-11" style quick create (MVP: simple time + intent picker).
- BlockEditorSheet: Edit title, intent, times for selected block.
- ReflectBanner: Link to reflection when evening and no reflection yet.
### Transitions
- `/week` via SideNav
- `/reflect/[date]` via ReflectBanner
- `/settings/intents` via SideNav

## `/week`
- Rendering: Dynamic
### Layouts
- RootLayout
- AppShellLayout
### Description
Week overview: seven-column block summary and intent budget editor.
### Features
- WeekGrid: Compact blocks per day column.
- IntentBudgetForm: Target hours per intent for ISO week.
- IntentDistributionChart: Stacked bar planned vs actual.
- WeekPicker: Change ISO week.
### Transitions
- `/day/[date]` by clicking a day column
- `/settings/intents` via SideNav

## `/reflect/[date]`
- Rendering: Dynamic
### Layouts
- RootLayout
- AppShellLayout
### Description
End-of-day reflection note and carry-forward block selection.
### Features
- DaySummaryList: Read-only blocks for the date.
- ReflectionNote: Textarea for daily note.
- CarryForwardChecklist: Select blocks to clone to tomorrow.
- SaveReflectionButton: Persist and optional navigate tomorrow.
### Transitions
- `/day/[date]` for same date (back)
- `/day/[date]` for tomorrow after save

## `/settings/intents`
- Rendering: Dynamic
### Layouts
- RootLayout
- AppShellLayout
### Description
Manage intent types: name, color, order, archive.
### Features
- IntentList: Sortable list with color swatch.
- IntentForm: Create/edit intent fields.
- ArchiveIntentButton: Soft-archive intent.
### Transitions
- `/day/[date]` via SideNav

## `/api/auth/[...nextauth]`
- Rendering: Dynamic
### Layouts
- (none)
### Description
Auth.js route handler for OAuth and session.
### Features
- AuthHandler: Standard NextAuth catch-all.
### Transitions
- (OAuth provider)
