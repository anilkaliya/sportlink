
## What is SportLink

SportLink is a professional networking platform for Indian athletes — LinkedIn for sports. It connects athletes with jobs, scouts, federations, and brands. The two core MVP features are:

1. **Athlete Profile** — a "Sports Passport" equivalent to LinkedIn's work history
2. **Connections** — LinkedIn-style connection requests between users

## Architecture

### Runtime & Framework
- **Runtime**: Bun (not Node.js — use `Bun.file()`, `bun:sqlite`, not `fs` or `better-sqlite3`)
- **Web server**: Elysia (not Express/Fastify/Hono)
- **Query builder**: Kysely (not Prisma/Drizzle/raw SQL)
- **Database**: SQLite via `bun:sqlite` (MVP) → PostgreSQL post-scale
- **Language**: TypeScript, strict mode, no `any`

### Project layout
```
backend/
├── src/
│   ├── index.ts           # server boot + migrations
│   ├── db/
│   │   ├── connection.ts  # single Kysely db instance
│   │   ├── schema.ts      # Database interface (all 11 tables)
│   │   ├── migrate.ts     # Kysely Migrator runner, called on boot
│   │   └── migrations/
│   │       ├── 001_initial_schema.ts  # DDL for ALL tables (single source of truth)
│   │       └── 002_seed_lookups.ts    # sports + tournaments seed data
│   ├── modules/           # feature modules
│   │   ├── athlete/
│   │   │   ├── athlete.routes.ts
│   │   │   ├── athlete.service.ts
│   │   │   └── athlete.types.ts
│   │   ├── users/
│   │   │   ├── user.routes.ts
│   │   │   ├── user.service.ts
│   │   │   └── user.types.ts
│   │   ├── connections/
│   │   │   ├── connections.routes.ts
│   │   │   ├── connections.service.ts
│   │   │   └── connections.types.ts
│   │   └── lookups/
│   │       └── lookups.routes.ts
│   └── shared/
│       ├── auth-guard.ts  # authGuard (beforeHandle) + extractUser (inside handlers)
│       ├── errors.ts      # notFound | validationError | conflict | serverError | forbidden
│       ├── jwt.ts         # signAccessToken | verifyAccessToken | AccessTokenPayload
│       ├── token-store.ts
│       └── id.ts          # generateId() → crypto.randomUUID()
├── sportlink_schema.sql   # reference only — migrations are source of truth
└── sportlink.db           # gitignored
```

### Module pattern
Every feature is a module under `src/modules/`. Each module has exactly three files:
- `.routes.ts` — Elysia route definitions, validation, request/response shaping
- `.service.ts` — business logic + Kysely queries, no HTTP concerns
- `.types.ts` — input/output TypeScript types for that module

Routes import services. Services import `db` from `connection.ts`. Never import routes from services.

---

## Database Schema

### Migrations

Kysely's built-in `Migrator` is used.

- **Source of truth**: `src/db/migrations/` — numbered TypeScript files
- **Tracking**: Kysely auto-manages a `kysely_migration` table in the DB
- **Boot behaviour**: `runMigrations()` in `migrate.ts` is called from `index.ts` on every boot — only pending migrations run
- **Idempotent**: Safe to call repeatedly. Already-applied migrations are skipped.
- **Never edit** an existing migration file after it has been applied to any environment. Always add a new numbered file.
- **All DDL lives in `001_initial_schema.ts`** — refresh_tokens, connection_requests, and connections were merged into 001 (separate 004/005 files deleted). If you reset the DB, a single `001` run creates everything.

Adding a schema change:
```
src/db/migrations/003_your_change_name.ts  ← new file, never edit existing ones
```

Resetting local DB after migration consolidation:
```bash
rm sportlink.db && bun run src/index.ts
```

### Tables (11 total)

| Table | Type | Purpose |
|---|---|---|
| `sports` | Lookup | Master list of sports (seeded) |
| `tournaments` | Lookup | Master list of tournaments (seeded) |
| `users` | Auth | Auth only — email, phone, password_hash, role |
| `refresh_tokens` | Auth | Hashed refresh tokens with expiry, FK → users (cascade delete) |
| `athlete_profiles` | Core | Main profile card |
| `sports_passport` | Core | Tournament history — one row per appearance |
| `verification_badges` | Core | Federation/SAI verification badges |
| `athlete_education` | Core | 1:many education entries |
| `athlete_skills` | Core | Skills with endorsement counts |
| `connection_requests` | Social | Directed connection requests between users |
| `connections` | Social | Accepted connections stored as a normalised ordered pair |

### Key design decisions (do not reverse these)

**`athlete_sports` table was intentionally removed.**
`is_primary` and `is_still_competing` live directly on `athlete_profiles` as `primary_sport_id` and `is_still_competing`. Querying an athlete's sports uses `sports_passport` directly:
```sql
SELECT DISTINCT sport_id FROM sports_passport WHERE athlete_id = ?
```

**`personal_bests` table was intentionally removed.**
Personal bests are stored as columns on `sports_passport`: `is_personal_best`, `pb_value`, `pb_unit`. A PB is just a passport entry with a flag.

**`skills_lookup` table was intentionally removed.**
`athlete_skills.skill_name` is free text. Frontend autocomplete enforces consistency. No FK to a lookup table.

**`athlete_languages` table was intentionally removed.**
Languages stored as CSV string on `athlete_profiles.languages`. e.g. `'hi,en,kn'`. Parse in application code.

**`athlete_media` table is deferred post-MVP.**
Do not add it until explicitly requested.

**`level` on `sports_passport` is nullable — derived from `tournaments.level` via FK.**
Only populate `level_override` when `tournament_id IS NULL` (custom tournament entry).

**`connections` uses a normalised ordered pair.**
`user_id_a` is always lexicographically less than `user_id_b`. This makes (A,B) == (B,A) without duplicates. `CHECK(user_id_a < user_id_b)` + `UNIQUE(user_id_a, user_id_b)` enforce this. Always sort with `orderedPair()` in application code before inserting.

**`connection_requests` is a directed table.**
`UNIQUE(sender_id, receiver_id)` prevents duplicate requests in the same direction. A reverse request (B→A while A→B is pending) triggers auto-accept in the service layer — do not handle this in the route.

### ENUMs (SQLite CHECK constraints)
SQLite has no native ENUM. These are enforced as `CHECK(col IN (...))`:

```
sports.sport_category:              individual | team | combat | racket | aquatic | other
tournaments.level:                  international | national | state | district
users.role:                         athlete | recruiter | admin
athlete_profiles.gender:            male | female | other
athlete_profiles.profile_status:    draft | active | suspended
sports_passport.level_override:     international | national | state | district
sports_passport.medal:              gold | silver | bronze | none
sports_passport.pb_unit:            seconds | meters | kg | points | other
athlete_skills.category:            sport_specific | soft_skill | technical | leadership
connection_requests.status:         pending | accepted | rejected | cancelled
```

### Boolean columns
SQLite has no BOOLEAN. All boolean columns are `INTEGER` with `CHECK(col IN (0, 1))`.
In application code, treat as `0 | 1`. Do not coerce to `true/false` at DB layer.

### IDs
All primary keys are UUIDs stored as `TEXT`. Generate with `generateId()` from `shared/id.ts` (`crypto.randomUUID()`). Never use auto-increment integers.

### Timestamps
All timestamp columns are `TEXT` storing ISO 8601 UTC strings: `new Date().toISOString()` → `'2026-04-28T10:30:00.000Z'`.

### Required PRAGMAs on every connection
```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
```
These are set in `db/connection.ts` and apply automatically.

---

## Domain Rules

### Sports Passport
- One row = one tournament appearance
- A single athlete can have many passport entries for the same sport (different tournaments, different years)
- `tournament_id` FK → `tournaments` OR `tournament_name_override` + `level_override` must be set — never both null (enforced by CHECK constraint)
- When `tournament_id` is set, derive the tournament's level from `tournaments.level` — do not duplicate it on `sports_passport` unless it's a custom entry

### Open to Work
`athlete_profiles.is_open_to_work = 1` means the athlete wants to be discovered by recruiters. The job board and recruiter search should filter on this. There is a partial index on this column.

### Connections
- Self-requests are blocked at service layer (`sender_id !== receiver_id`)
- Duplicate requests (same direction) are blocked by `UNIQUE(sender_id, receiver_id)` + an explicit pending check
- Reverse-direction pending request triggers auto-accept: the existing request is marked `accepted` and a `connections` row is created — no new `connection_requests` row is written for the incoming sender
- Only the **receiver** can accept or reject a request (403 otherwise)
- Only the **sender** can cancel a request (403 otherwise)
- Actions on non-pending requests return 409
- `connections` rows are never deleted — connections are permanent in MVP

---

## API Conventions

### Base URL
`http://localhost:3000` (dev)

### Auth
All routes under `/api` except the public paths below require `Authorization: Bearer <access_token>`.

Public paths (no token needed):
```
POST /api/user/register
POST /api/user/login
POST /api/user/refresh
POST /api/user/logout
GET  /api/health
GET  /api/sports
GET  /api/tournaments
```

Inside protected handlers, get the current user via:
```ts
import { extractUser } from '../../shared/auth-guard'
const { userId, role } = extractUser(headers)
```

### Response shape — success
```json
{ "data": { ... } }
```

### Response shape — error
```json
{ "error": "NOT_FOUND", "message": "Athlete not found" }
```

### HTTP status codes
| Scenario | Code |
|---|---|
| Created | 201 |
| Success | 200 |
| Not found | 404 |
| Validation error | 400 |
| Conflict (duplicate) | 409 |
| Forbidden (wrong actor) | 403 |
| Unauthorized (no/bad token) | 401 |
| Server error | 500 |

### ID format
All IDs in URLs are UUIDs: `/athletes/550e8400-e29b-41d4-a716-446655440000`

### Connections endpoints
| Method | Path | Actor | Description |
|---|---|---|---|
| `POST` | `/api/connections/request` | sender | Send a request — body: `{ receiver_id }` |
| `PATCH` | `/api/connections/:id/accept` | receiver | Accept pending request |
| `PATCH` | `/api/connections/:id/reject` | receiver | Reject pending request |
| `DELETE` | `/api/connections/:id` | sender | Cancel pending request |
| `GET` | `/api/connections` | me | List my accepted connections |
| `GET` | `/api/connections/requests` | me | List pending `{ incoming, outgoing }` |

---

## Current Implementation Status

| Module | Status |
|---|---|
| DB connection + schema | ✅ Done |
| Seed runner | ✅ Done |
| Auth (register / login / refresh / logout) | ✅ Done |
| Athlete profile CRUD | ✅ Done |
| Sports passport CRUD | ✅ Done |
| Athlete skills CRUD | ✅ Done |
| Athlete education CRUD | ✅ Done |
| Connections (send / accept / reject / cancel / list) | ✅ Done |
| Verification badges | ⏳ Schema present, no routes/service yet |
| Jobs / recruiter search | ⏳ Not started |

---

## SQLite → PostgreSQL Migration Notes

When the time comes to migrate:

1. `TEXT CHECK(col IN (...))` → `CREATE TYPE ... AS ENUM(...)` + column type change
2. `languages TEXT` (CSV) → `languages TEXT[]` (native array)
3. `INTEGER` booleans → `BOOLEAN` native type
4. `PRAGMA` calls removed — PostgreSQL handles this natively
5. Tool: `pgloader sqlite:///sportlink.db postgresql://localhost/sportlink`
6. Manual fixups: ENUMs, arrays, boolean columns (~2 hours)
7. Kysely dialect: swap `BunSqliteDialect` for `PostgresDialect` — query code unchanged

## Seed Data Sources

| Table | Source |
|---|---|
| `sports` | MYAS recognised national sports federations list |
| `tournaments` | SAI Khelo India portal + IOA + individual federation websites |
| `athlete_skills.skill_name` | Frontend autocomplete list (not DB seeded) — sourced from LinkedIn skills taxonomy + NSQF sports competency framework |
