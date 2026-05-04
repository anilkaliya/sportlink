# SportLink Frontend — Knowledge Base
> Load this at the start of every frontend task on this project.
> Last audited: 2026-05-04 (reflects actual built code)

---

## What is SportLink (Frontend)

React SPA with an athlete dashboard, profile pages, and full auth + onboarding wizard.
The dashboard is the main landing page for authenticated users, showing performance stats,
suggested athletes, pending actions, connection requests, and opportunities.
Profile pages show public athlete profiles (LinkedIn-style). Registration is a 3-step wizard.
The UI is light-themed, wired to the SportLink backend REST API via a Vite dev proxy.

---

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

---

## Project Structure

```
sportlink-frontend/
├── index.html
├── vite.config.ts          ← proxy: /api → localhost:3000
├── tsconfig.json
├── src/
│   ├── vite-env.d.ts
│   ├── main.tsx            ← QueryClientProvider wraps App
│   ├── App.tsx             ← BrowserRouter + Routes; root / → /signin
│   ├── styles/
│   │   └── global.css      ← CSS vars (dark + --reg-* light), resets, @keyframes, fonts
│   ├── types/
│   │   └── athlete.ts      ← all API types + 3 helper functions
│   ├── api/
│   │   ├── client.ts       ← apiCall<T>() generic fetch wrapper (exported as apiCall)
│   │   ├── athlete.ts      ← athleteApi.getById / getPassport / getSkills / create / addPassportEntry
│   │   ├── user.ts         ← userApi.register / login / logout
│   │   ├── sports.ts       ← sportsApi.getSports / getTournaments
│   │   └── connections.ts  ← connectionsApi (getStatus / sendRequest / acceptRequest / rejectRequest / cancelRequest)
│   ├── stores/
│   │   ├── athleteStore.ts ← Zustand store for profile page data
│   │   └── authStore.ts    ← Zustand store for auth state (isAuthenticated, accessToken, userId)
│   ├── lib/
│   │   └── stats.ts        ← deriveStats() + formatPb()
│   ├── hooks/
│   │   ├── useConnectionStatus.ts  ← TanStack Query wrapper for connection status
│   │   └── useConnectionActions.ts ← optimistic mutation actions for connections
│   ├── components/
│   │   ├── Nav/
│   │   │   ├── Nav.tsx             ← tabs: Dashboard/Profile/Athletes/Requests + user dropdown
│   │   │   └── Nav.module.css
│   │   ├── Dashboard/
│   │   │   ├── WelcomeBanner/      ← gradient banner with name, location, sport, profile strength
│   │   │   ├── PerformanceSnapshot/ ← stats row: years active, medals, PBs, titles
│   │   │   ├── SuggestedAthletes/  ← horizontal scroll of athlete cards with Connect btn
│   │   │   ├── RecentActivity/     ← horizontal scroll of activity feed items
│   │   │   ├── PendingActions/     ← sidebar: connection requests, profile completion, achievements
│   │   │   ├── ConnectionRequests/ ← sidebar: accept/ignore incoming requests
│   │   │   └── Opportunities/     ← sidebar: trials, workshops, camps
│   │   ├── AuthWizard/
│   │   │   ├── AuthWizard.tsx      ← shell: dark left panel + white right panel
│   │   │   ├── WizardLeftPanel.tsx ← step track dots (done/active/pending)
│   │   │   ├── MobileStepBar.tsx   ← mobile step progress bar
│   │   │   └── authForm.module.css ← shared form styles using --reg-* vars
│   │   ├── ProfileHero/
│   │   │   ├── ProfileHero.tsx     ← uses ConnectionButton; reads userId from authStore
│   │   │   └── ProfileHero.module.css
│   │   ├── ConnectionButton/
│   │   │   ├── ConnectionButton.tsx        ← stateful connect/pending/accept/connected
│   │   │   └── ConnectionButton.module.css
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
│   │   └── ui/
│   │       ├── Card.tsx
│   │       ├── LevelBadge.tsx
│   │       ├── SkillTag.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorMessage.tsx
│   │       └── ui.module.css
│   └── pages/
│       ├── DashboardPage/
│       │   ├── DashboardPage.tsx       ← 2-col layout: main (4 sections) + sidebar (3 sections)
│       │   └── DashboardPage.module.css
│       ├── ProfilePage/
│       │   ├── ProfilePage.tsx
│       │   └── ProfilePage.module.css
│       ├── SignInPage/
│       │   ├── SignInPage.tsx
│       │   └── SignInPage.module.css
│       ├── RegisterPage/
│       │   ├── RegisterPage.tsx          ← wizard orchestrator; fetches sports/tournaments on mount
│       │   └── steps/
│       │       ├── Step1Account.tsx      ← calls POST /user/register; stores sl_user_id
│       │       ├── Step2Profile.tsx      ← calls POST /api/athletes; stores sl_athlete_id, sl_sport_id
│       │       ├── Step3Passport.tsx     ← calls POST /api/athletes/:id/passport; navigates to profile
│       │       └── StepSuccess.tsx       ← navigates to /profile/:athleteId
│       └── ForgotPasswordPage/
│           └── ForgotPasswordPage.tsx
```

---

## Routing

```typescript
// App.tsx
<Route path="/"                element={<Navigate to="/signin" replace />} />
<Route path="/dashboard"       element={<DashboardPage />} />
<Route path="/signin"          element={<SignInPage />} />
<Route path="/register"        element={<RegisterPage />} />
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/profile/:id"     element={<ProfilePage />} />
<Route path="/athletes"        element={<AthletesPage />} />
<Route path="/connections/requests" element={<RequestsPage />} />
```

Root `/` redirects to `/signin`. Nav is suppressed on auth paths (`/signin`, `/register`, `/forgot-password`).
Nav tabs: Dashboard, Profile, Athletes, Requests (with pending count badge).
All new routes go in `App.tsx`.

---

## Data Flow — Profile Page

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

### `src/api/client.ts` — `apiCall<T>(path, options?)`

- **Export name is `apiCall`** (not `apiFetch` — never use `apiFetch` in new code)
- Base URL: `import.meta.env['VITE_API_URL'] ?? '/api'`
- Sets `Content-Type: application/json` on every request
- Accepts raw objects as `body` — do NOT pre-stringify with `JSON.stringify` before passing
- On non-OK response: parses `{ error, message }` JSON, throws `new Error(message)`
- In dev: Vite proxies `/api/*` → `http://localhost:3000/api/*` (no path rewrite needed)

### `src/api/athlete.ts` — `athleteApi`

```typescript
athleteApi.getById(id)                      // GET /athletes/:id → AthleteFullProfile
athleteApi.getPassport(id)                  // GET /athletes/:id/passport
athleteApi.getSkills(id)                    // GET /athletes/:id/skills
athleteApi.create(payload)                  // POST /athletes → { data: { athlete_id: string } }
athleteApi.addPassportEntry(id, payload)    // POST /athletes/:id/passport
```

`create()` payload: `{ user_id, primary_sport_id, date_of_birth, gender, city, state, country, bio, languages }`.
Do NOT include `is_still_competing` — not accepted by POST schema.
`country` is hardcoded `'India'` for MVP.

### `src/api/user.ts` — `userApi`

```typescript
userApi.register({ email, mobile_number, password })  // POST /user/register → { data: { user_id } }
userApi.login({ email, password })                    // POST /user/login → UserResponse
userApi.logout()                                      // POST /user/logout
```

`UserResponse` includes: `user_id`, `onboarding_step: number`, `onboarding_complete: boolean`, `athlete_id?: string`, `accessToken`.

**IMPORTANT**: User API uses path `/user/register` and `/user/login` (not `/api/user/...`).
The Vite proxy only covers `/api`. User endpoints are proxied via the same proxy since backend serves both.

### `src/api/sports.ts` — `sportsApi`

```typescript
sportsApi.getSports()       // GET /api/sports → Sport[] (unwraps { data: [] } envelope)
sportsApi.getTournaments()  // GET /api/tournaments → Tournament[] (unwraps { data: [] } envelope)
```

Returns unwrapped arrays directly (`.then(r => r.data)`). `Sport: { name, id }`, `Tournament: { name, id, level }`.

### `src/api/connections.ts` — `connectionsApi`

```typescript
type ConnectionStatus = 'none' | 'pending_outgoing' | 'pending_incoming' | 'connected'

connectionsApi.getStatus(targetUserId)      // GET /api/connections/status?user_id=...
connectionsApi.sendRequest(targetUserId)    // POST /api/connections/request { target_user_id }
connectionsApi.acceptRequest(requestId)     // POST /api/connections/accept  { request_id }
connectionsApi.rejectRequest(requestId)     // POST /api/connections/reject  { request_id }
connectionsApi.cancelRequest(requestId)     // POST /api/connections/cancel  { request_id }
```

### Response envelope

```typescript
// Success
{ data: T }

// Error
{ error: string, message: string }
```

---

## Auth + Onboarding Flow

### Registration wizard (`/register`)

`RegisterPage` orchestrates 3 steps + a success screen. Navigation between steps uses local state.
Steps can be resumed: `useLocation().state.step` carries target step from SignIn redirects,
and `sessionStorage` persists IDs across page navigations.

```
sessionStorage keys:
  sl_user_id    — set by Step1 after POST /user/register
  sl_athlete_id — set by Step2 after POST /api/athletes
  sl_sport_id   — set by Step2 after POST /api/athletes
```

Step3 calls `POST /api/athletes/:id/passport` then navigates to `/profile/:athleteId`.

**Onboarding resume on login:**
```typescript
// SignInPage.tsx — after successful login:
if (athlete_id) navigate('/profile/' + athlete_id)
else if (onboarding_step === 0) { sessionStorage.setItem('sl_user_id', user_id); navigate('/register', { state: { step: 2 } }) }
else navigate('/register', { state: { step: 3 } })
```

### Auth state (`src/stores/authStore.ts`)

```typescript
interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null
  userId: string | null        // ← user_id from login response
  setAuthenticated(value: boolean): void
  setAccessToken(token: string | null): void
  setUserId(id: string | null): void
  clearAuth(): void
}
```

`SignInPage` calls `setAuthenticated(true)`, `setAccessToken(res.accessToken)`, `setUserId(user_id)` on success.
`Nav` calls `clearAuth()` on logout.

---

## Connections System

### Hooks

**`useConnectionStatus(targetUserId)`** — TanStack Query, key `['connection-status', targetUserId]`.
Returns `{ status: ConnectionStatus, requestId: number | null, isLoading, refetch }`.

**`useConnectionActions(currentStatus, refetch)`** — optimistic mutation wrapper.
Returns `{ optimisticStatus, isMutating, sendRequest, acceptRequest, rejectRequest, cancelRequest }`.
On error, rolls back to `currentStatus`. On success, calls `refetch()`.

### `ConnectionButton` component

Props: `{ targetUserId: string, currentUserId: string }`.
Returns `null` if `targetUserId === currentUserId` (own profile — no connect button).

Renders based on resolved status (`optimisticStatus ?? fetchedStatus`):
- `none` → "Connect" button (accent fill)
- `pending_outgoing` → "Pending" (click to cancel, muted style)
- `pending_incoming` → "Accept" + "Reject" buttons
- `connected` → "Connected" (disabled) + "Message" button

### `ProfileHero` integration

`ProfileHero` reads `currentUserId` from `useAuthStore(s => s.userId)` and passes it to `ConnectionButton`.
`targetUserId` is `profile.user_id`.

---

## Zustand Stores

### `src/stores/athleteStore.ts`

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

### `src/stores/authStore.ts`

```typescript
interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null
  userId: string | null
  setAuthenticated(value: boolean): void
  setAccessToken(token: string | null): void
  setUserId(id: string | null): void
  clearAuth(): void
}
```

---

## Types (`src/types/athlete.ts`)

All types mirror actual backend DB columns. Do not invent field names — check against the schema.

```typescript
type SportLevel    = 'international' | 'national' | 'state' | 'district'
type Medal         = 'gold' | 'silver' | 'bronze' | 'none'
type PbUnit        = 'seconds' | 'meters' | 'kg' | 'points' | 'other'
type SkillCategory = 'sport_specific' | 'soft_skill' | 'technical' | 'leadership'

AthleteProfile     // athlete_profiles row + full_name joined from users
PassportEntry      // sports_passport row + tournament_name + tournament_level (joined)
EducationEntry     // athlete_education row
Skill              // athlete_skills row
AthleteFullProfile // { data: AthleteProfile & { passport, education, skills } }
```

**Field naming:**
- Photo: `profile_photo_url` (not `avatar_url`)
- PK fields: `athlete_id`, `passport_id`, `education_id`, `skill_id`
- Boolean DB columns are `0 | 1`, not `boolean` — always check with `=== 1`
- Nullable columns are `T | null`, never `T | undefined`
- `languages` is a CSV string `'en,hi,kn'` — use `parseLanguages()` to split

**Helper functions:**
```typescript
parseLanguages(csv)          // 'en,hi,kn' → ['en', 'hi', 'kn']
resolveLevel(entry)          // entry.tournament_level ?? entry.level_override ?? null
resolveTournamentName(entry) // entry.tournament_name ?? entry.tournament_name_override ?? 'Tournament'
```

---

## Stats Library (`src/lib/stats.ts`)

```typescript
interface AthleteStats {
  yearsActive:    number
  goldMedals:     number
  nationalTitles: number
  secondsPB:      PassportEntry | undefined
  metersPB:       PassportEntry | undefined
}

deriveStats(passport: PassportEntry[]): AthleteStats
formatPb(value, unit): string   // → '9.98s' | '6.12m' | '80kg' | '—'
```

---

## Component Details

### `Nav`
- Sticky, 60px height, `backdrop-filter: blur(16px)`
- Logo: `SPORT` (accent) + `LINK` (text), Bebas Neue 24px, clickable → `/dashboard`
- Tabs: Dashboard, Profile, Athletes, Requests (with pending count badge)
- **Auth-conditional**: shows user dropdown (avatar + name + chevron) with "My Profile" / "Sign Out" when authenticated, "Sign In" button when not
- Sign Out calls `userApi.logout()` then `clearAuth()`
- User dropdown closes on outside click via `useRef` + `mousedown` listener
- **Responsive (≤640px):** tabs hidden; user name hidden in dropdown button

### Dashboard Components (UI-only, mock data)

All dashboard components live under `src/components/Dashboard/`. They use hardcoded mock data
and are **not wired to backend APIs yet**. Each component is in its own folder with a CSS module.

**`WelcomeBanner`** — gradient banner (dark, `#1a1a2e → #0f3460`).
Props: `name, location, sport, profileStrength, photoUrl`.
Shows greeting with first name, subtitle, and tag pills for location/sport/profile strength.

**`PerformanceSnapshot`** — stats row inside a Card.
Props: `yearsActive, activeSince, goldMedals, timePb, timePbEvent, distancePb, distancePbEvent, nationalTitles`.
5 stat items with coloured icon backgrounds. "View Full Stats" button (no-op).

**`SuggestedAthletes`** — horizontal scrollable athlete cards.
Mock data: 5 athletes with name, sport, location, level, online status.
Each card: avatar (with online dot), name, sport, location pin, LevelBadge, "Connect" button (no-op).
Scroll-right arrow button. "View All Athletes" navigates to `/athletes`.

**`RecentActivity`** — horizontal scrollable activity feed.
Mock data: 3 activity items with icon, text, time.
"View All" button (no-op).

**`PendingActions`** — sidebar card.
Props: `connectionRequestCount, profileStrength`.
3 action items: connection requests (badge), profile completion (percentage), new achievement (arrow).
"View All Actions" button (no-op).

**`ConnectionRequests`** — sidebar card.
Mock data: 2 request items with name, sport/location detail.
Accept/Ignore buttons (no-op). "View All" navigates to `/connections/requests`.

**`Opportunities`** — sidebar card.
Mock data: 2 opportunity items with title, location, date, tag.
Tag styles: `tagTrials` (cyan), `tagWorkshop` (green), `tagCamp` (gold).

### `DashboardPage`
Two-column grid layout: main (70%) + sidebar (340px).
Main column: WelcomeBanner → PerformanceSnapshot → SuggestedAthletes → RecentActivity.
Sidebar: PendingActions → ConnectionRequests → Opportunities.
All data is mock — defined as constants in `DashboardPage.tsx`.
Responsive: collapses to single column at ≤1024px.

### `AuthWizard`
Shell component for auth pages. Renders a dark left panel + white right panel side by side.
Props: `navRight` (top-right nav link), `leftPanel` (dark panel content), `children` (form content).
Scopes light theme via `.authRoot` CSS class using `--reg-*` variables.

### `WizardLeftPanel`
Step track with dots. `WizardStep = 1 | 2 | 3 | 'success'` union.
`stepStatus(step, current)` helper handles `'success'` case (all done) before numeric comparisons.

### `MobileStepBar`
Mobile progress bar. Builds node array with `forEach` (not map) to avoid React key warnings on line dividers.

### `ProfileHero`
Props: `profile: AthleteProfile`, `passport: PassportEntry[]`

Reads `currentUserId` from `useAuthStore(s => s.userId)`.
Action area renders `<ConnectionButton targetUserId={profile.user_id} currentUserId={currentUserId ?? ''} />` + "⋮" more button.
Stats computed with `deriveStats(passport)` each render.

Cover: 160px, gradient `#1a1a2e → #16213e → #0f3460`, diagonal stripe `::before`.
Avatar: 100×100px, overlaps cover `margin-top: -50px`, fallback 🏃 emoji.

### `ConnectionButton`
See Connections System section above.

### `SportsPassport`
Sorts entries by `year DESC`. Key: `passport_id`.

### `PassportEntry`
Level icon: `{ international: '🌏', national: '🏅', state: '🏃', district: '📍' }`
Medal: `{ gold: '🥇', silver: '🥈', bronze: '🥉', none: '' }`
PB annotation: ` · PB 🔥` when `is_personal_best === 1`.

### `SkillsCard` / `SkillTag`
Category emoji: `{ sport_specific: '🏃', soft_skill: '🤝', technical: '📊', leadership: '🎯' }`
Endorsement count shown as `+N` in accent colour when > 0.

### `EducationCard`
Internal `EduEntry`. Years: `start_year–end_year` (null end → "Present").
Degree line: `degree · field_of_study`, fallback "Education".

### `LoadingSpinner`
Full-page skeleton. Named `LoadingSpinner` but renders a skeleton layout, not a spinner.

### `ErrorMessage`
Props: `message: string`. "Try again" calls `window.location.reload()`.

---

## Design System

### CSS Variables (defined in `global.css`)

**Light theme (app-wide):**
```css
--bg:       #f1f5f9
--surface:  #ffffff
--surface2: #e2e8f0
--border:   rgba(0,0,0,0.1)
--accent:   #16a34a
--accent2:  #dc2626
--accent3:  #0891b2
--text:     #0f172a
--muted:    #64748b
--gold:     #d97706
```

**Light theme (auth pages, scoped via `.authRoot`):**
```css
--reg-bg:         #f4f3ee
--reg-surface:    #ffffff
--reg-ink:        #111118
--reg-muted:      #6b6b80
--reg-border:     rgba(0,0,0,0.10)
--reg-accent:     #e8ff3c
--reg-accent-dk:  #c8df00
--reg-success:    #1a9e6e
--reg-error:      #d93025
```

Never hardcode hex values. Always use `var(--xxx)` or `var(--reg-xxx)` in auth components.

### Typography Variables

```css
--font-display: 'Bebas Neue', sans-serif
--font-body:    'DM Sans', sans-serif
--font-mono:    'Space Mono', monospace
```

### Responsive Breakpoints

| Breakpoint | Scope |
|---|---|
| `≤1024px` | Dashboard grid → 1-col (sidebar stacks above main) |
| `≤768px` | Profile grid → 1-col; ProfileHero padding/font scale; dashboard stat items shrink |
| `≤640px` | Nav: tabs hidden; user name hidden in dropdown |
| `≤480px` | ProfileHero: avatar shrinks, actions wrap, stats 2-per-row; dashboard stats 2-col grid |

---

## CSS Module Conventions

- camelCase class names; no BEM; no `!important`; no global class names
- Always `var(--xxx)` for colours and fonts
- Conditional classes via template literals

---

## TypeScript Conventions

- Component props typed as inline `interface Props { ... }`
- No `any` — use `unknown` and narrow
- Boolean DB columns: `0 | 1`, check with `=== 1`
- Nullable API data: `T | null`, never `T | undefined`

---

## API Contracts

### `POST /user/register`
Body: `{ email, mobile_number, password }`
Response: `{ data: { user_id: string } }`

### `POST /user/login`
Body: `{ email, password }`
Response: `{ data: { user_id, onboarding_step, onboarding_complete, athlete_id? }, accessToken }`

### `POST /api/athletes`
Body: `{ user_id, primary_sport_id, date_of_birth, gender, city, state, country, bio, languages }`
Response: `{ data: { athlete_id: string } }`
Note: `is_still_competing` is NOT accepted by this endpoint.

### `POST /api/athletes/:id/passport`
Body: `{ tournament_id?, tournament_name_override?, level_override?, sport_id, year, result, medal, pb_value?, pb_unit?, is_personal_best, notes? }`
Custom tournaments use `tournament_name_override` + `level_override`; known tournaments use `tournament_id`.

### `GET /api/athletes/:id`
Returns everything in one call: profile fields + nested `passport[]`, `education[]`, `skills[]`.

### `GET /api/sports` → `{ data: Sport[] }` where `Sport: { id, name }`
### `GET /api/tournaments` → `{ data: Tournament[] }` where `Tournament: { id, name, level }`

### Connections API
```
GET  /api/connections/status?user_id=...
POST /api/connections/request  { target_user_id }
POST /api/connections/accept   { request_id }
POST /api/connections/reject   { request_id }
POST /api/connections/cancel   { request_id }
```

---

## Implementation Status

| Feature | Status |
|---|---|
| Project scaffold (Vite + React + TS) | ✅ Done |
| Global CSS + design tokens | ✅ Done |
| API client (`apiCall`) | ✅ Done |
| Athlete API + athlete store | ✅ Done |
| Nav (Dashboard/Profile/Athletes/Requests tabs + user dropdown) | ✅ Done |
| **Dashboard page (UI-only, mock data)** | ✅ Done |
| Dashboard — WelcomeBanner | ✅ Done |
| Dashboard — PerformanceSnapshot | ✅ Done |
| Dashboard — SuggestedAthletes | ✅ Done |
| Dashboard — RecentActivity | ✅ Done |
| Dashboard — PendingActions (sidebar) | ✅ Done |
| Dashboard — ConnectionRequests (sidebar) | ✅ Done |
| Dashboard — Opportunities (sidebar) | ✅ Done |
| ProfileHero (cover + avatar + stats + ConnectionButton) | ✅ Done |
| SportsPassport card + entries (owner-only edit) | ✅ Done |
| SkillsCard + SkillTag (owner-only edit) | ✅ Done |
| EducationCard (owner-only edit) | ✅ Done |
| LoadingSpinner (skeleton) | ✅ Done |
| ErrorMessage | ✅ Done |
| ProfilePage (TanStack Query + store) | ✅ Done |
| App shell + routing | ✅ Done |
| Responsive design (mobile/tablet) | ✅ Done |
| Auth store (Zustand) | ✅ Done |
| Sign In page + login API | ✅ Done |
| Register page — 3-step wizard | ✅ Done |
| Step 1: POST /user/register | ✅ Done |
| Step 2: POST /api/athletes | ✅ Done |
| Step 3: POST /api/athletes/:id/passport | ✅ Done |
| Onboarding resume on login | ✅ Done |
| Sports/tournaments from API (no hardcoding) | ✅ Done |
| Connection system (send/accept/reject/cancel) | ✅ Done |
| ConnectionButton with optimistic UI | ✅ Done |
| Dashboard — wire to real API | ❌ Not started |
| VerificationCard | ❌ Excluded from MVP |
| HighlightReelCard | ❌ Excluded from MVP |

---

## Planned Features (post-MVP)

- **Dashboard API integration** — wire dashboard components to real backend endpoints (replace mock data)
- **Verification card** — federation badge + ID (needs `verifications` table data)
- **Highlight reel** — video thumbnails (needs `athlete_media` table)
- **Job board page** — separate route `/jobs`
- **Edit profile** — inline editing

---

## Dev Setup

```bash
# Backend (port 3000) — run from /sportlink/backend/
~/.bun/bin/bun run src/index.ts

# Frontend (port 5173, proxies /api → :3000) — run from /sportlink/sportlink-frontend/
npm run dev
```

- Frontend: `http://localhost:5173` → redirects to `/signin`
- Profile URL pattern: `http://localhost:5173/profile/{athlete_id}`

**Vite proxy rule:** only `/api` prefix is proxied. Do not add a `rewrite`.
**`bun` not in PATH** — use `~/.bun/bin/bun` explicitly.
