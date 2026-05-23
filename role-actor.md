# Roles
- TimeOwner: Own personal calendar blocks, intent categories, weekly intent budgets, and day reflections.
- SystemScheduler: Persist data, enforce validation, compute intent-vs-budget aggregates, and run scheduled maintenance.

# Actors
## EndUser
### Description
A solo knowledge worker who plans and reviews their own time on IntentDay. They use the web app in a browser to shape days around intentional work, not only external meetings.
### RoleScope
- TimeOwner

## WebApplication
### Description
The Next.js application served to the browser. It renders UI, invokes server actions, and applies authorization boundaries for the signed-in user.
### RoleScope
- TimeOwner

## Database
### Description
PostgreSQL (via Prisma) storing users, intent types, time blocks, weekly budgets, and reflections. It does not initiate business flows on its own except through application calls.
### RoleScope
- SystemScheduler

## DailyMaintenanceTimer
### Description
A scheduled job (cron via hosting platform or `node-cron` in dev) that archives stale draft blocks and refreshes materialized weekly stats if used.
### RoleScope
- SystemScheduler
