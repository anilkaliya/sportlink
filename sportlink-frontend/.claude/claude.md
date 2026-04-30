## What is SportLink (Frontend)
React SPA that renders public athlete profiles (LinkedIn-style — same view for owner and visitor).
Currently shows one page: the athlete profile.

## Stack

| Layer | Tool | Version |
|---|---|---|
| Bundler | Vite | 5.x |
| UI | React | 18.x |
| Language | TypeScript | 5.x strict |
| Global state | Zustand | 4.x |
| Server state / caching | TanStack Query | v5 |
| Styling | CSS Modules + CSS variables | — |
| Routing | React Router | v6 |
| HTTP | native `fetch` | — |

**No extra utility libraries** — no `clsx`, no `lodash`, no date library.
Template literals are used for conditional classes. Do not add new deps without a clear reason.

## Project Structure

```
sportlink-frontend/
├── index.html
├── vite.config.ts          ← proxy: /api → localhost:3000
├── tsconfig.json
├── src/
│   ├── vite-env.d.ts       ← `/// <reference types="vite/client" />` + CSS module type
│   ├── main.tsx            ← QueryClientProvider wraps App
│   ├── App.tsx             ← BrowserRouter + Routes
│   ├── styles/
│   │   └── global.css      ← CSS variables, resets, @keyframes, Google Fonts import
│   ├── types/
│   │   └── athlete.ts      ← all API types + 3 helper functions
│   ├── api/
│   │   ├── client.ts       ← apiFetch<T>() generic fetch wrapper
│   │   └── athlete.ts      ← athleteApi.getById / getPassport / getSkills
│   ├── stores/
│   │   └── athleteStore.ts ← Zustand store
│   ├── lib/
│   │   └── stats.ts        ← deriveStats() + formatPb()
│   ├── components/
│   │   ├── Nav/
│   │   │   ├── Nav.tsx
│   │   │   └── Nav.module.css
│   │   ├── ProfileHero/
│   │   │   ├── ProfileHero.tsx
│   │   │   └── ProfileHero.module.css
│   │   ├── SportsPassport/
│   │   │   ├── SportsPassport.tsx
│   │   │   ├── PassportEntry.tsx
│   │   │   └── SportsPassport.module.css
│   │   ├── SkillsCard/
│   │   │   ├── SkillsCard.tsx
│   │   │   └── SkillsCard.module.css
│   │   ├── EducationCard/
│   │   │   ├── EducationCard.tsx
│   │   │   └── EducationCard.module.css
│   │   └── ui/             ← shared primitives (all share ui.module.css)
│   │       ├── Card.tsx
│   │       ├── LevelBadge.tsx
│   │       ├── SkillTag.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorMessage.tsx
│   │       └── ui.module.css
│   └── pages/
│       └── ProfilePage/
│           ├── ProfilePage.tsx
│           └── ProfilePage.module.css
```

---

## Routing

```typescript
// App.tsx
<Route path="/profile/:id" element={<ProfilePage />} />
<Route path="/"            element={<Navigate to={`/profile/${MVP_ATHLETE_ID}`} replace />} />
```

`MVP_ATHLETE_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d001'` — defined in `ProfilePage.tsx`, exported and used in `App.tsx`.

Root `/` redirects to the seed athlete's profile. All new routes go in `App.tsx`.

---

## Data Flow

```
GET /api/athletes/:id
    ↓
TanStack Query (useQuery in ProfilePage)
    ↓ useEffect watching `data`
Zustand athleteStore.setAthleteData({ profile, passport, education, skills })
    ↓ useAthleteStore(s => s.X)
Components (ProfileHero, SportsPassport, SkillsCard, EducationCard)
```

**Rules:**
- Fetch only in page-level components (`pages/`), never in individual display components.
- Use `useEffect` to sync query data to Zustand — TanStack Query v5 removed `onSuccess`.
- `clearAthlete()` is called on route `id` change via a cleanup `useEffect`.
- Components read from store with granular selectors to avoid unnecessary re-renders.

```typescript
// TanStack Query v5 pattern (no onSuccess)
const { data, isLoading, isError, error } = useQuery({
  queryKey: ['athlete', id],
  queryFn: () => athleteApi.getById(id),
})
useEffect(() => {
  if (!data) return
  const { passport, education, skills, ...profileFields } = data.data
  setAthleteData({ profile: profileFields, passport, education, skills })
}, [data, setAthleteData])
```

---

## API Layer

### `src/api/client.ts` — `apiFetch<T>(path, options?)`

- Base URL: `import.meta.env['VITE_API_URL'] ?? '/api'`
- Sets `Content-Type: application/json` on every request
- On non-OK response: parses `{ error, message }` JSON, throws `new Error(message)`
- In dev: Vite proxies `/api/*` → `http://localhost:3000/api/*` (no path rewrite needed)

### `src/api/athlete.ts` — `athleteApi`

```typescript
athleteApi.getById(id)      // GET /athletes/:id → AthleteFullProfile
athleteApi.getPassport(id)  // GET /athletes/:id/passport → { data: PassportEntry[] }
athleteApi.getSkills(id)    // GET /athletes/:id/skills   → { data: Skill[] }
```

Only `getById` is used in the MVP. `getPassport` and `getSkills` are available but unused.

### Response envelope

```typescript
// Success
{ data: T }

// Error
{ error: string, message: string }
```

---

## Types (`src/types/athlete.ts`)

All types mirror actual backend DB columns. Do not invent field names — check against the schema.

```typescript
// Union types
type SportLevel   = 'international' | 'national' | 'state' | 'district'
type Medal        = 'gold' | 'silver' | 'bronze' | 'none'
type PbUnit       = 'seconds' | 'meters' | 'kg' | 'points' | 'other'
type SkillCategory = 'sport_specific' | 'soft_skill' | 'technical' | 'leadership'

// Key interfaces
AthleteProfile    // athlete_profiles row + full_name joined from users
PassportEntry     // sports_passport row + tournament_name + tournament_level (joined)
EducationEntry    // athlete_education row
Skill             // athlete_skills row
AthleteFullProfile // { data: AthleteProfile & { passport, education, skills } }
```

**Field naming — actual column names (not aliases):**
- Photo: `profile_photo_url` (not `avatar_url`)
- PK fields: `athlete_id`, `passport_id`, `education_id`, `skill_id`
- Boolean DB columns are `0 | 1`, not `boolean` — always check with `=== 1`
- Nullable columns are `T | null`, never `T | undefined`
- `languages` is a CSV string `'en,hi,kn'` — use `parseLanguages()` to split

**Helper functions (exported from `types/athlete.ts`):**
```typescript
parseLanguages(csv)          // 'en,hi,kn' → ['en', 'hi', 'kn']
resolveLevel(entry)          // entry.tournament_level ?? entry.level_override ?? null
resolveTournamentName(entry) // entry.tournament_name ?? entry.tournament_name_override ?? 'Tournament'
```

---

## Zustand Store (`src/stores/athleteStore.ts`)

```typescript
interface AthleteState {
  profile:   AthleteProfile | null
  passport:  PassportEntry[]
  education: EducationEntry[]
  skills:    Skill[]
  setAthleteData(data: { profile, passport, education, skills }): void
  clearAthlete(): void
}
```

`setAthleteData` does a full `set(data)` — overwrites all four fields atomically.
`clearAthlete` resets all fields to null/empty arrays.

---

## Stats Library (`src/lib/stats.ts`)

```typescript
interface AthleteStats {
  yearsActive:    number
  goldMedals:     number
  nationalTitles: number
  secondsPB:      PassportEntry | undefined   // lowest pb_value where pb_unit='seconds'
  metersPB:       PassportEntry | undefined   // highest pb_value where pb_unit='meters'
}

deriveStats(passport: PassportEntry[]): AthleteStats
formatPb(value, unit): string   // → '9.98s' | '6.12m' | '80kg' | '—'
```

`yearsActive` = `currentYear - Math.min(...years)`, 0 if no entries.
`nationalTitles` = national-level gold medals only (uses `resolveLevel` logic inline).
Both PB finders use `is_personal_best === 1` as the gate.

---

## Component Details

### `Nav`
- Sticky, 60px height, `backdrop-filter: blur(16px)`
- Logo: `SPORT` (accent colour) + `LINK` (text colour), Bebas Neue 24px
- Tabs: "👤 Profile" (active), "💼 Job Board" (disabled)
- Actions: "Sign In" (outline), "Join Free" (accent fill)
- **Responsive (≤640px):** tabs and Sign In button hidden; only logo + Join Free shown

### `ProfileHero`
Props: `profile: AthleteProfile`, `passport: PassportEntry[]`

Internal `StatCell` component — takes `value`, `label`, `color: 'accent' | 'gold' | 'teal'`.
Stats are computed with `deriveStats(passport)` each render (no memoization).

Cover strip:
- 160px height, gradient `#1a1a2e → #16213e → #0f3460`
- `::before` diagonal stripe overlay at -45deg, rgba(232,255,60,0.07)

Avatar overlaps cover with `margin-top: -50px`. Size 100×100px, border 4px solid `var(--bg)`.
Fallback when no `profile_photo_url`: 🏃 emoji at 42px.

Profile info: name (Bebas Neue 36px), sport headline (first part of bio before `—`), meta line (city/state + languages).

Action buttons: "Connect", "Message" (outline), "⋮" more button. These are static — no handlers yet.

Stats row: 5 cells (Years Active, Gold Medals, 100m PB, Distance PB, Nat. Titles).
PB label is dynamic from `entry.notes` (e.g. "100m PB", "LJ PB").

**Responsive breakpoints:**
- `≤768px`: padding 20px, name 28px, stats wrap 3-per-row, stat values 24px
- `≤480px`: cover 120px, avatar 80px, profile info beside avatar, actions full-width below, name 24px, stats wrap 2-per-row, stat values 20px

### `SportsPassport`
Sorts entries by `year DESC` before rendering. Key: `passport_id`.

### `PassportEntry`
Level icon map: `{ international: '🌏', national: '🏅', state: '🏃', district: '📍' }`
Medal emoji map: `{ gold: '🥇', silver: '🥈', bronze: '🥉', none: '' }`
PB annotation: ` · PB 🔥` appended to subtitle when `is_personal_best === 1`.
Uses `resolveLevel()` and `resolveTournamentName()` from `types/athlete.ts`.

### `SkillsCard`
Renders skills as a flex-wrap row of `SkillTag`. No ordering applied.

### `SkillTag`
Category emoji map: `{ sport_specific: '🏃', soft_skill: '🤝', technical: '📊', leadership: '🎯' }`
Shows endorsement count as `+N` in accent colour when `endorsement_count > 0`.

### `EducationCard`
Internal `EduEntry` component. Years display: `start_year–end_year` (null end → "Present").
Degree line: `degree · field_of_study` joined, fallback "Education".

### `Card`
Generic wrapper: `background: var(--surface)`, `border`, `border-radius: 12px`, `padding: 24px`.
Accepts optional `className` for overrides.

### `LevelBadge`
Returns `null` if `level` is null. Maps level → CSS class from `ui.module.css`.

### `LoadingSpinner`
Full-page skeleton matching the real layout structure:
cover → hero (avatar + lines) → stats row (5 cells) → 2-col card grid.
Uses shimmer animation. Named `LoadingSpinner` but renders a skeleton, not a spinner.
**Responsive:** skeleton hero and grid padding reduce at 768px and 480px breakpoints.

### `ErrorMessage`
Props: `message: string`. Centered card with ⚠️, message, "Try again" button that calls `window.location.reload()`.

---

## Design System

### CSS Variables (defined in `global.css`)

```css
--bg:       #0a0a0f    /* page background */
--surface:  #12121a    /* card background */
--surface2: #1a1a26    /* input, tag, inner element background */
--border:   rgba(255,255,255,0.08)
--accent:   #e8ff3c    /* primary CTA, highlights, PB text — neon yellow-green */
--accent2:  #ff4c6a    /* error states, quota badges */
--accent3:  #3cffd4    /* teal — verification, distance PB stat */
--text:     #f0f0f5
--muted:    #6b6b80
--gold:     #ffcb47    /* gold medals, gold stat values */
```

Never hardcode hex values. Always use `var(--xxx)`.

### Typography Variables

```css
--font-display: 'Bebas Neue', sans-serif    /* headings, stat values, card titles, logo */
--font-body:    'DM Sans', sans-serif       /* body text, buttons, nav */
--font-mono:    'Space Mono', monospace     /* dates, PB values, level badges */
```

Loaded via Google Fonts import at top of `global.css`.

### Typography Usage Rules

| Element | Font | Size | Letter-spacing |
|---|---|---|---|
| Athlete name | display | 36px (24px mobile) | 2px |
| Card/section titles | display | 20px | 2px |
| Stat values | display | 32px (20px mobile) | — |
| Logo | display | 24px | 2px |
| Body text, buttons | body | 13–15px | — |
| Dates, IDs, PB values, level badges | mono | 11–12px | 0.5px |

### Level Badge Colours (in `ui.module.css`)

| Level | CSS class | Text | Background | Border |
|---|---|---|---|---|
| international | `.levelIntl` | `var(--accent)` | `rgba(232,255,60,0.12)` | `rgba(232,255,60,0.3)` |
| national | `.levelNational` | `var(--gold)` | `rgba(255,203,71,0.12)` | `rgba(255,203,71,0.3)` |
| state | `.levelState` | `var(--accent3)` | `rgba(60,255,212,0.12)` | `rgba(60,255,212,0.3)` |
| district | `.levelDistrict` | `var(--muted)` | `rgba(255,255,255,0.05)` | `var(--border)` |

### Animations (defined in `global.css`, used in component CSS)

```css
@keyframes fadeIn  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
```

`fadeIn` applied inline on `ProfileHero` (`style={{ animation: 'fadeIn 0.4s ease' }}`).
`shimmer` applied via CSS on skeleton elements with `background-size: 200% 100%`.
Card component applies `fadeIn 0.3s ease` via CSS.

### Layout Constants

```
Nav height:       60px, sticky top:0, z-index:100
Page padding:     0 40px (desktop) → 20px (tablet) → 16px (mobile)
Cover height:     160px (120px mobile)
Avatar size:      100×100px (80px mobile)
Avatar overlap:   margin-top: -50px (overlaps cover bottom)
Avatar border:    4px solid var(--bg)
Profile grid:     grid-template-columns: 2fr 1fr, gap: 20px → 1fr at ≤768px
Card padding:     24px
Card radius:      12px
Stats row radius: 12px
```

### Responsive Breakpoints

| Breakpoint | Scope |
|---|---|
| `≤768px` | Profile grid → 1-col; ProfileHero padding/font scale; skeleton adjustments |
| `≤640px` | Nav: tabs + Sign In hidden |
| `≤480px` | ProfileHero: avatar shrinks, actions wrap, stats 2-per-row |

---

## CSS Module Conventions

Each component has a co-located `.module.css` file. UI primitives share `ui/ui.module.css`.

- camelCase class names: `.profileTop`, `.statCell`, `.entryMeta`
- No BEM, no global class names, no `!important`
- Always `var(--xxx)` for colours and fonts
- Conditional classes via template literals: `` `${styles.base} ${condition ? styles.mod : ''}` ``

---

## TypeScript Conventions

- Component props typed as inline `interface Props { ... }`
- No `any` — use `unknown` and narrow
- Boolean DB columns: `0 | 1`, check with `=== 1`
- Nullable API data: `T | null`, never `T | undefined`
- `vite-env.d.ts` provides `/// <reference types="vite/client" />` (enables `import.meta.env`) and the CSS module type declaration

---

## API Contract — `GET /api/athletes/:id`

The only endpoint used in MVP. Returns everything in one call.

```typescript
{
  data: {
    // From athlete_profiles
    athlete_id: string
    user_id: string
    primary_sport_id: string | null
    date_of_birth: string | null
    gender: 'male' | 'female' | 'other' | null
    city: string | null
    state: string | null
    country: string
    bio: string | null
    profile_photo_url: string | null
    profile_status: 'draft' | 'active' | 'suspended'
    languages: string | null        // CSV: 'en,hi,kn'
    is_still_competing: 0 | 1
    is_open_to_work: 0 | 1
    created_at: string
    updated_at: string

    // Joined from users
    full_name: string

    // Nested arrays
    passport: PassportEntry[]       // sorted by year DESC from backend
    education: EducationEntry[]
    skills: Skill[]
  }
}
```

Each `PassportEntry` has `tournament_name: string | null` and `tournament_level: SportLevel | null`
resolved by the backend service (batch Map lookup, not a JOIN). The frontend never fetches
tournament data separately.

---

## Implementation Status

| Feature | Status |
|---|---|
| Project scaffold (Vite + React + TS) | ✅ Done |
| Global CSS + design tokens | ✅ Done |
| API client + athlete API | ✅ Done |
| Zustand athlete store | ✅ Done |
| Nav component | ✅ Done |
| ProfileHero (cover + avatar + stats) | ✅ Done |
| SportsPassport card + entries | ✅ Done |
| SkillsCard + SkillTag | ✅ Done |
| EducationCard | ✅ Done |
| LoadingSpinner (skeleton) | ✅ Done |
| ErrorMessage | ✅ Done |
| ProfilePage (TanStack Query + store) | ✅ Done |
| App shell + routing | ✅ Done |
| Responsive design (mobile/tablet) | ✅ Done |
| TypeScript build passing | ✅ Done |
| End-to-end profile load verified | ✅ Done 

---
## Dev Setup

```bash
# Backend (port 3000) — run from /sportlink/backend/
~/.bun/bin/bun run src/index.ts

# Frontend (port 5173, proxies /api → :3000) — run from /sportlink/sportlink-frontend/
npm run dev
```

- Frontend: `http://localhost:5173` (redirects to seed athlete profile)
- Seed athlete ID: `f47ac10b-58cc-4372-a567-0e02b2c3d001`
- Profile URL pattern: `http://localhost:5173/profile/{athlete_id}`

**Vite proxy rule:** `/api` prefix is forwarded as-is — no path rewrite. Backend serves at `/api/*`.
Do not add a `rewrite` to the proxy config.

**`bun` not in PATH** — use `~/.bun/bin/bun` explicitly; `bun` is not on the global PATH in this environment.
