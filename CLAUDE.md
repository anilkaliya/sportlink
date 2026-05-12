# SportLink — Project Guide

SportLink is a mobile app for athletes (like LinkedIn for sports). Athletes create profiles with sports passports, skills, education, connect with each other, and exchange messages in real time.

## Repository Structure

```
sportlink/
  SportLinkMobile/    # React Native mobile app (iOS + Android)
  backend/            # Bun + Elysia REST/WebSocket API server
```

## Tech Stack

### Mobile App (`SportLinkMobile/`)

- **React Native 0.73.6** with **React 18.2.0** (Hermes JS engine on Android)
- **TypeScript 5.0.4**
- **React Navigation 6** — bottom tabs + native stacks (nested navigators)
- **Zustand 5** — client-side state management
- **TanStack React Query 5** — server state / data fetching
- **react-native-image-picker** — gallery photo uploads
- **AsyncStorage** — persisting auth tokens

### Backend (`backend/`)

- **Bun** runtime
- **Elysia** web framework on port 3000
- **SQLite** via **Kysely** ORM
- **JWT** — 15-minute access tokens, 7-day refresh tokens
- **WebSocket** endpoint at `/ws/messaging` for realtime messaging

## Mobile App Architecture

### Source Layout (`SportLinkMobile/src/`)

```
api/          # REST API call functions (one file per domain)
  client.ts   # Central apiCall() with auth headers, 401 redirect
  athlete.ts  # Athletes CRUD, photo upload, profile status
  connections.ts
  messaging.ts
  sports.ts
  user.ts

components/   # Reusable UI components
  AthleteCard/
  AuthWizard/
  ConnectionButton/
  Dashboard/
  EducationCard/     # Has add-education modal form
  ProfileHero/       # Photo upload, message button
  RequestCard/
  SkillsCard/        # Has add-skills modal form
  SportsPassport/    # Has add-passport modal form
  ui/

hooks/
  useConnectionActions.ts
  useConnectionStatus.ts
  useIncomingRequests.ts
  useWebSocket.ts    # useWebSocket(handler), useWsSend()

lib/
  auth.ts            # AsyncStorage token persistence
  stats.ts
  websocket.ts       # WebSocketManager singleton (wsManager)

navigation/
  AuthStack.tsx      # SignIn, Register, ForgotPassword
  MainTabs.tsx       # Bottom tabs with nested stacks
  RootNavigator.tsx  # Auth vs Main switch
  navigationRef.ts   # Global ref for programmatic navigation
  types.ts           # All navigator param list types

screens/
  DashboardScreen.tsx
  AthletesScreen.tsx
  ConnectionsScreen.tsx
  RequestsScreen.tsx
  ProfileScreen.tsx
  SignInScreen.tsx
  ForgotPasswordScreen.tsx
  RegisterScreen/    # Multi-step registration wizard
  Messaging/
    InboxScreen.tsx  # Conversation list with search, unread badges
    ChatScreen.tsx   # Full chat with replies, edit, delete, attachments

stores/
  authStore.ts       # isAuthenticated, accessToken, userId
  athleteStore.ts    # Current user's athlete profile data
  messagingStore.ts  # Conversations, messages, typing, presence, unread

theme/
  colors.ts, typography.ts, spacing.ts  # Exported via index.ts

types/
  athlete.ts         # AthleteFullProfile, PassportEntry, Skill, etc.
  messaging.ts       # Message, Conversation, WsServerEvent, WsClientEvent
```

### Navigation Structure

```
RootNavigator
  Auth (NativeStack)
    SignIn
    Register
    ForgotPassword
  Main (BottomTabs)
    Dashboard
    Athletes
    Connections
    MessagesTab (NativeStack)
      Inbox
      Chat { conversationId }
    Requests
    ProfileTab (NativeStack)
      Profile { id }
```

Tab icons use emoji. Messages tab badge shows unread count. ProfileTab uses `CommonActions.reset()` on tab press to force remount with current user's athlete ID.

### API Client Pattern

All API calls go through `apiCall<T>()` in `api/client.ts`:
- Adds `Authorization: Bearer <token>` header automatically
- On 401 with known messages, clears auth and resets to Auth stack
- Base URL: `http://localhost:3000/api` (iOS), `http://192.168.0.108:3000/api` (Android — local network IP)
- Photo upload (`athlete.ts > uploadPhoto`) uses raw `fetch` with `FormData` (not `apiCall`)

### State Management

**Zustand stores** for client state (auth, athlete profile, messaging). Access outside React via `useStore.getState()`.

**React Query** for server state (conversations, unread counts, athlete lists). Default config in individual queries.

### WebSocket

`lib/websocket.ts` exports a singleton `wsManager`:
- Connects to `ws://<host>:3000/ws/messaging?token=<jwt>`
- Exponential backoff reconnection (max 10 attempts, max 30s delay)
- Ping heartbeat every 25 seconds
- Auto-reconnects on AppState `active` (app foreground)
- Event types: `message:new`, `message:updated`, `message:deleted`, `presence:update`, `typing:start`, `typing:stop`

### Messaging

- Optimistic UI: messages get a `_tempId` and `_status: 'sending'`, reconciled on server ack
- Cursor-based pagination for loading older messages
- Reply-to, edit, delete support
- Attachments via base64 data URIs (picked from gallery with `react-native-image-picker`)
- `useFocusEffect` on InboxScreen to always refetch conversations

## Backend Architecture

### Source Layout (`backend/src/`)

```
db/
  migrate.ts         # Kysely migration runner
  seed.ts            # Creates 3 test users with full profiles
modules/
  athlete/           # CRUD, passport, skills, education, photo upload/serve
  connections/       # Connection requests, accept/reject, list
  lookups/           # Sports, tournaments
  messaging/         # Conversations, messages REST + WebSocket
  users/             # Register, login, refresh, logout
shared/
  auth-guard.ts      # JWT verification middleware
index.ts             # Server entry point, migration, routing, auto-seed
```

### API Routes

All routes are under `/api` prefix. Public paths (no auth required):
- `POST /api/user/register`, `/login`, `/refresh`, `/logout`
- `GET /api/health`, `/api/sports`, `/api/tournaments`

All other routes require `Authorization: Bearer <token>`.

### Database

SQLite file: `backend/sportlink.db`. Reset with `bun run db:reset` (drops, migrates, seeds).

### Seed Data

`backend/src/db/seed.ts` creates 3 test users on dev startup:
- Anil Sharma (anil.sharma@test.com, Athletics, Bengaluru)
- Anil Kaliya (anil.kaliya@test.com, Cricket, Mumbai)
- Anil Kumar (anil.kumar@test.com, Football, Delhi)
- Password for all: `Test@1234`
- Each gets passport entries, skills, education, and mutual connections

## Running the Project

### Backend
```bash
cd backend
bun install
bun run db:migrate    # Run migrations
bun run dev           # Start with hot reload on port 3000
```

### Mobile App
```bash
cd SportLinkMobile
npm install

# iOS
npx react-native run-ios

# Android (emulator or device)
npx react-native run-android

# Metro bundler (if not auto-started)
npx react-native start
```

### Android on Physical Device
Connect via wireless ADB. Update the IP address in `api/client.ts` and `lib/websocket.ts` to match your machine's local network IP.

### Full Reset
```bash
cd backend && bun run db:reset    # Wipe DB, migrate, seed
cd SportLinkMobile/android && ./gradlew clean   # Clean Android build
```

## Known Hermes Engine Constraints (Android)

- **No `URLSearchParams`** — use manual query string construction with `encodeURIComponent`
- **Empty string colors crash Android** — always use a valid color value in styles
- **Zustand `getSnapshot` infinite loops** — when using `?? []` fallbacks in selectors, define stable module-level constants (e.g., `const EMPTY: T[] = []`) instead of inline array literals

## Conventions

- Theme tokens (`colors`, `spacing`, `fontSize`, `radii`) from `src/theme/` — no hardcoded style values
- One API module per domain in `src/api/`
- Screen components are default-ish exports (`export function ScreenName`)
- Component folders: `ComponentName/ComponentName.tsx`
- Navigation types centralized in `navigation/types.ts`
- Auth token attached automatically by `apiCall()` — no manual header management except for `<Image>` sources and `FormData` uploads
