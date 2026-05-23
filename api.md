# getDayView
## Description
Load intent types, time blocks for a calendar date in the user's timezone, weekly budget for the containing ISO week, and whether a reflection exists for that date.
## SideEffects
1. None (read-only)
## Endpoint
- Type: Server Action (POST)
- URL: (internal) getDayView
## ArgumentsSchema
```ts
z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})
```
## Returns
### Success
- Valid session and date parses in user TZ
- Status: 200
#### Schema
```ts
z.object({
  date: z.string(),
  blocks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    intentTypeId: z.string(),
    intentName: z.string(),
    colorHex: z.string(),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    isDraft: z.boolean(),
  })),
  intents: z.array(z.object({
    id: z.string(),
    name: z.string(),
    colorHex: z.string(),
    sortOrder: z.number(),
    archived: z.boolean(),
  })),
  weekSummary: z.object({
    weekStart: z.string(),
    budgets: z.array(z.object({
      intentTypeId: z.string(),
      targetHours: z.number(),
      actualHours: z.number(),
    })),
  }),
  hasReflection: z.boolean(),
})
```
### Unauthorized
- No session
- Status: 401
#### Schema
```ts
z.object({ error: z.literal('UNAUTHORIZED') })
```

# upsertTimeBlock
## Description
Create or update a time block for the authenticated user. Recomputes week actual hours for affected intent.
## SideEffects
1. INSERT or UPDATE TimeBlock row
2. (implicit) touch User.updatedAt via Prisma @updatedAt on block
## Endpoint
- Type: Server Action (POST)
- URL: (internal) upsertTimeBlock
## ArgumentsSchema
```ts
z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  intentTypeId: z.string().uuid(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  isDraft: z.boolean().default(false),
})
```
## Returns
### Success
- Valid range (end > start, duration >= 5 min)
- Status: 200
#### Schema
```ts
z.object({
  block: z.object({
    id: z.string(),
    title: z.string(),
    intentTypeId: z.string(),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    isDraft: z.boolean(),
  }),
  weekSummary: z.object({
    weekStart: z.string(),
    budgets: z.array(z.object({
      intentTypeId: z.string(),
      targetHours: z.number(),
      actualHours: z.number(),
    })),
  }),
})
```
### ValidationError
- Invalid range or unknown intent
- Status: 400
#### Schema
```ts
z.object({ error: z.enum(['INVALID_RANGE', 'INTENT_NOT_FOUND']) })
```

# deleteTimeBlock
## Description
Remove a time block by id if owned by user.
## SideEffects
1. DELETE TimeBlock row
## Endpoint
- Type: Server Action (POST)
- URL: (internal) deleteTimeBlock
## ArgumentsSchema
```ts
z.object({ id: z.string().uuid() })
```
## Returns
### Success
- Status: 200
#### Schema
```ts
z.object({ ok: z.literal(true), weekSummary: z.object({
  weekStart: z.string(),
  budgets: z.array(z.object({
    intentTypeId: z.string(),
    targetHours: z.number(),
    actualHours: z.number(),
  })),
}) })
```
### NotFound
- Status: 404
#### Schema
```ts
z.object({ error: z.literal('NOT_FOUND') })
```

# getWeekView
## Description
Return blocks grouped by day for ISO week and budget/actual aggregates.
## SideEffects
1. None
## Endpoint
- Type: Server Action (POST)
- URL: (internal) getWeekView
## ArgumentsSchema
```ts
z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})
```
## Returns
### Success
- Status: 200
#### Schema
```ts
z.object({
  weekStart: z.string(),
  days: z.array(z.object({
    date: z.string(),
    blocks: z.array(z.object({
      id: z.string(),
      title: z.string(),
      colorHex: z.string(),
      startAt: z.string().datetime(),
      endAt: z.string().datetime(),
    })),
  })),
  intents: z.array(z.object({
    id: z.string(),
    name: z.string(),
    colorHex: z.string(),
  })),
  budgets: z.array(z.object({
    intentTypeId: z.string(),
    targetHours: z.number(),
    actualHours: z.number(),
  })),
})
```

# saveWeeklyIntentBudgets
## Description
Upsert target hours per intent for a weekStart (Monday ISO).
## SideEffects
1. UPSERT WeeklyIntentBudget rows in transaction
## Endpoint
- Type: Server Action (POST)
- URL: (internal) saveWeeklyIntentBudgets
## ArgumentsSchema
```ts
z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targets: z.array(z.object({
    intentTypeId: z.string().uuid(),
    targetHours: z.number().min(0).max(168),
  })),
})
```
## Returns
### Success
- Status: 200
#### Schema
```ts
z.object({
  budgets: z.array(z.object({
    intentTypeId: z.string(),
    targetHours: z.number(),
    actualHours: z.number(),
  })),
})
```

# getReflection
## Description
Load blocks for reflectDate and existing reflection note + carry selections.
## SideEffects
1. None
## Endpoint
- Type: Server Action (POST)
- URL: (internal) getReflection
## ArgumentsSchema
```ts
z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})
```
## Returns
### Success
- Status: 200
#### Schema
```ts
z.object({
  date: z.string(),
  blocks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    intentTypeId: z.string(),
    colorHex: z.string(),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
  })),
  reflection: z.object({
    note: z.string(),
    carryBlockIds: z.array(z.string()),
  }).nullable(),
})
```

# saveDayReflection
## Description
Upsert reflection note and clone selected blocks to next calendar day as drafts.
## SideEffects
1. UPSERT DayReflection
2. REPLACE DayReflectionCarryBlock join rows
3. INSERT draft TimeBlock copies for carry-forward (idempotent on sourceBlockId + target date)
## Endpoint
- Type: Server Action (POST)
- URL: (internal) saveDayReflection
## ArgumentsSchema
```ts
z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(2000),
  carryBlockIds: z.array(z.string().uuid()),
})
```
## Returns
### Success
- Status: 200
#### Schema
```ts
z.object({
  reflectionId: z.string(),
  carriedCount: z.number(),
  tomorrowDate: z.string(),
})
```

# listIntentTypes
## Description
List all intent types for user ordered by sortOrder.
## SideEffects
1. None
## Endpoint
- Type: Server Action (POST)
- URL: (internal) listIntentTypes
## ArgumentsSchema
```ts
z.object({})
```
## Returns
### Success
- Status: 200
#### Schema
```ts
z.object({
  intents: z.array(z.object({
    id: z.string(),
    name: z.string(),
    colorHex: z.string(),
    sortOrder: z.number(),
    archived: z.boolean(),
    isDefault: z.boolean(),
  })),
})
```

# upsertIntentType
## Description
Create or update an intent type; enforce max 12 active and unique name.
## SideEffects
1. INSERT or UPDATE IntentType
## Endpoint
- Type: Server Action (POST)
- URL: (internal) upsertIntentType
## ArgumentsSchema
```ts
z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(50),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  sortOrder: z.number().int().min(0).optional(),
})
```
## Returns
### Success
- Status: 200
#### Schema
```ts
z.object({ intent: z.object({
  id: z.string(),
  name: z.string(),
  colorHex: z.string(),
  sortOrder: z.number(),
  archived: z.boolean(),
}) })
```
### ValidationError
- Status: 400
#### Schema
```ts
z.object({ error: z.enum(['DUPLICATE_NAME', 'MAX_INTENTS']) })
```

# archiveIntentType
## Description
Soft-archive intent (set archivedAt timestamp).
## SideEffects
1. UPDATE IntentType.archivedAt
## Endpoint
- Type: Server Action (POST)
- URL: (internal) archiveIntentType
## ArgumentsSchema
```ts
z.object({ id: z.string().uuid() })
```
## Returns
### Success
- Status: 200
#### Schema
```ts
z.object({ ok: z.literal(true) })
```
### Forbidden
- Default system intents cannot archive
- Status: 403
#### Schema
```ts
z.object({ error: z.literal('CANNOT_ARCHIVE_DEFAULT') })
```

# seedUserDefaults
## Description
Idempotent seed of default intent types on first login.
## SideEffects
1. INSERT default IntentType rows if none exist for user
## Endpoint
- Type: Server Action (internal, called from auth callback)
- URL: (internal) seedUserDefaults
## ArgumentsSchema
```ts
z.object({ userId: z.string().uuid() })
```
## Returns
### Success
- Status: 200
#### Schema
```ts
z.object({ created: z.number() })
```
