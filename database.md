# ER Diagram
```mermaid
erDiagram
    User ||--o{ IntentType : owns
    User ||--o{ TimeBlock : owns
    User ||--o{ WeeklyIntentBudget : owns
    User ||--o{ DayReflection : owns
    User ||--o{ Account : has
    User ||--o{ Session : has

    IntentType ||--o{ TimeBlock : categorizes
    IntentType ||--o{ WeeklyIntentBudget : targets

    TimeBlock ||--o| TimeBlock : carryForwardSource

    User {
        string id PK
        string email UK
        string name
        string image
        string timezone
        datetime createdAt
        datetime updatedAt
    }

    IntentType {
        string id PK
        string userId FK
        string name
        string colorHex
        int sortOrder
        boolean isDefault
        boolean archivedAt
        datetime createdAt
        datetime updatedAt
    }

    TimeBlock {
        string id PK
        string userId FK
        string intentTypeId FK
        string title
        datetime startAt
        datetime endAt
        boolean isDraft
        string carryForwardSourceId FK
        datetime createdAt
        datetime updatedAt
    }

    WeeklyIntentBudget {
        string id PK
        string userId FK
        string intentTypeId FK
        date weekStart
        float targetHours
        datetime createdAt
        datetime updatedAt
    }

    DayReflection {
        string id PK
        string userId FK
        date reflectDate
        string note
        datetime createdAt
        datetime updatedAt
    }

    DayReflectionCarryBlock {
        string reflectionId FK
        string timeBlockId FK
    }

    DayReflection ||--o{ DayReflectionCarryBlock : selects
    TimeBlock ||--o{ DayReflectionCarryBlock : referenced

    Account {
        string id PK
        string userId FK
        string provider
        string providerAccountId
    }

    Session {
        string id PK
        string userId FK
        string sessionToken UK
        datetime expires
    }
```

# Initial Data
## IntentType
Seeded per new user on first login (application logic, not global table rows):
- name: Deep Work, colorHex: #4F46E5, sortOrder: 0, isDefault: true
- name: Recovery, colorHex: #10B981, sortOrder: 1, isDefault: true
- name: Connection, colorHex: #F59E0B, sortOrder: 2, isDefault: true
- name: Admin, colorHex: #6B7280, sortOrder: 3, isDefault: true
- name: Uncategorized, colorHex: #9CA3AF, sortOrder: 99, isDefault: true, archivedAt: false (system, non-deletable)

## User
- timezone: UTC (default until user changes in future settings)
