# SportLink Mobile — Knowledge Base
> Load this at the start of every mobile frontend task on this project.
> Last audited: 2026-05-11 (reflects actual built code)

---

## What is SportLink (Mobile)

React Native mobile app (iOS + Android) for athletes — like LinkedIn for sports.
Athletes create profiles with sports passports, skills, education, connect with each other,
and exchange messages in real time via WebSocket. The UI is light-themed, wired to the
SportLink backend REST API (Bun + Elysia on port 3000).

---

## Stack

| Layer | Tool | Version |
|---|---|---|
| Framework | React Native | 0.73.6 |
| UI | React | 18.2.0 |
| Language | TypeScript | 5.0.4 |
| JS Engine (Android) | Hermes | — |
| Navigation | React Navigation | 6.x (bottom tabs + native stacks) |
| Global state | Zustand | 5.x |
| Server state / caching | TanStack React Query | v5 |
| Image picker | react-native-image-picker | 8.x |
| Token persistence | @react-native-async-storage | 1.x |
| HTTP | native `fetch` | — |

**No extra utility libraries** — no `lodash`, no date library.
Do not add new deps without a clear reason.

---

## Project Structure

```
SportLinkMobile/
├── android/                # Android native project
├── ios/                    # iOS native project
├── package.json
├── tsconfig.json
├── src/
│   ├── App.tsx             ← ErrorBoundary + SafeAreaProvider + QueryClientProvider + NavigationContainer
│   ├── api/
│   │   ├── client.ts       ← apiCall<T>() generic fetch wrapper with auth headers
│   │   ├── athlete.ts      ← athleteApi: CRUD, photo upload/serve, profile status, pending actions
│   │   ├── user.ts         ← userApi: register, login, refresh, logout
│   │   ├── sports.ts       ← sportsApi: getSports, getTournaments (unwraps data envelope)
│   │   ├── connections.ts  ← connectionsApi: status, request, accept, reject, cancel, suggestions
│   │   └── messaging.ts    ← messagingApi: conversations, messages, send, edit, delete, markRead
│   ├── components/
│   │   ├── AthleteCard/
│   │   ├── AuthWizard/         ← Shared auth form shell + step components
│   │   ├── ConnectionButton/   ← Stateful connect/pending/accept/connected button
│   │   ├── Dashboard/          ← Dashboard section components (mock data)
│   │   ├── EducationCard/      ← Display + add-education modal form
│   │   ├── ProfileHero/        ← Cover, avatar, photo upload, stats, message button
│   │   ├── RequestCard/
│   │   ├── SkillsCard/         ← Display + add-skills modal form
│   │   ├── SportsPassport/     ← Display + add-passport modal form
│   │   └── ui/                 ← Card, LevelBadge, SkillTag, LoadingSpinner
│   ├── hooks/
│   │   ├── useConnectionActions.ts  ← Optimistic mutation actions for connections
│   │   ├── useConnectionStatus.ts   ← TanStack Query wrapper for connection status
│   │   ├── useIncomingRequests.ts
│   │   └── useWebSocket.ts          ← useWebSocket(handler), useWsSend()
│   ├── lib/
│   │   ├── auth.ts            ← AsyncStorage token persistence (get/set/clear)
│   │   ├── stats.ts           ← deriveStats() + formatPb()
│   │   └── websocket.ts       ← WebSocketManager singleton (wsManager)
│   ├── navigation/
│   │   ├── AuthStack.tsx      ← SignIn, Register, ForgotPassword
│   │   ├── MainTabs.tsx       ← Bottom tabs with nested stacks
│   │   ├── RootNavigator.tsx  ← Auth vs Main switch on isAuthenticated
│   │   ├── navigationRef.ts   ← Global NavigationContainerRef for programmatic navigation
│   │   └── types.ts           ← All navigator param list types
│   ├── screens/
│   │   ├── DashboardScreen.tsx
│   │   ├── AthletesScreen.tsx
│   │   ├── ConnectionsScreen.tsx
│   │   ├── RequestsScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── SignInScreen.tsx
│   │   ├── ForgotPasswordScreen.tsx
│   │   ├── RegisterScreen/         ← Multi-step registration wizard
│   │   │   ├── Step1Account.tsx    ← POST /user/register
│   │   │   ├── Step2Profile.tsx    ← POST /api/athletes
│   │   │   └── Step3Passport.tsx   ← POST /api/athletes/:id/passport
│   │   └── Messaging/
│   │       ├── InboxScreen.tsx     ← Conversation list with search, unread badges, typing
│   │       └── ChatScreen.tsx      ← Full chat: replies, edit, delete, attachments, pagination
│   ├── stores/
│   │   ├── authStore.ts       ← isAuthenticated, accessToken, userId
│   │   ├── athleteStore.ts    ← Current athlete profile, passport, education, skills
│   │   └── messagingStore.ts  ← Conversations, messages, typing, presence, unread
│   ├── theme/
│   │   ├── colors.ts          ← Color constants (app + auth palette)
│   │   ├── typography.ts      ← Font families + fontSize scale
│   │   ├── spacing.ts         ← spacing + radii constants
│   │   └── index.ts           ← Re-exports all theme tokens
│   └── types/
│       ├── athlete.ts         ← AthleteProfile, PassportEntry, Skill, EducationEntry, etc.
│       └── messaging.ts       ← Message, Conversation, WsServerEvent, WsClientEvent
```

---

## Navigation Structure

```
RootNavigator (NativeStack)
  Auth (NativeStack)
    SignIn
    Register { step? }
    ForgotPassword
  Main (BottomTabs)
    Dashboard                    🏠
    Athletes                     👥
    Connections                  🔗
    MessagesTab (NativeStack)    💬  (badge shows unread count)
      Inbox
      Chat { conversationId }
    Requests                     🤝
    ProfileTab (NativeStack)     👤
      Profile { id }
```

- Tab icons use emoji
- Messages tab shows red unread badge via `useMessagingStore(s => s.totalUnread)`
- ProfileTab uses `CommonActions.reset()` on tab press to force remount with current user's athlete ID
- Navigation types centralized in `navigation/types.ts`

---

## App Entry (`App.tsx`)

```
ErrorBoundary
  SafeAreaProvider
    QueryClientProvider (staleTime: 5min, retry: 1)
      NavigationContainer (ref: navigationRef)
        RootNavigator
```

- Auth hydration on mount: reads tokens from AsyncStorage, sets Zustand stores, connects WebSocket
- `ErrorBoundary` class component catches render crashes (critical for Android debugging)
- `LogBox.ignoreLogs([])` suppresses no warnings in dev

---

## API Layer

### `src/api/client.ts` — `apiCall<T>(path, options?)`

- Base URL: `http://localhost:3000/api` (iOS), `http://192.168.0.108:3000/api` (Android — local network IP)
- Adds `Authorization: Bearer <token>` header automatically from `useAuthStore.getState().accessToken`
- Sets `Content-Type: application/json` when body is present
- On 401 with known messages (`'Missing authorization header'`, `'Invalid or expired token'`): clears auth and resets navigation to Auth stack
- Accepts raw objects as `body` — do NOT pre-stringify with `JSON.stringify`

### `src/api/athlete.ts` — `athleteApi`

```typescript
athleteApi.getAll(filters?)                 // GET /athletes?sport=&level=&city=&search=&page=
athleteApi.getById(id)                      // GET /athletes/:id → AthleteFullProfile
athleteApi.getPassport(id)                  // GET /athletes/:id/passport
athleteApi.getSkills(id)                    // GET /athletes/:id/skills
athleteApi.create(payload)                  // POST /athletes → { data: { athlete_id } }
athleteApi.addPassportEntry(id, payload)    // POST /athletes/:id/passport
athleteApi.addSkills(id, skills)            // POST /athletes/:id/skills
athleteApi.addEducation(id, payload)        // POST /athletes/:id/education
athleteApi.updateEducation(id, eduId, payload) // PATCH /athletes/:id/education/:eduId
athleteApi.uploadPhoto(id, photo)           // POST /athletes/:id/photo (multipart FormData)
athleteApi.getPhotoUrl(id)                  // Returns raw URL string for <Image> source
athleteApi.getPendingActions(id)            // GET /athletes/:id/pending-actions
athleteApi.getProfileStatus(id)             // GET /athletes/:id/profile-status
```

**Photo upload** uses raw `fetch` with `FormData` (not `apiCall`). Uses separate `BASE_URL` constant.
**Photo display** requires auth header in `<Image source={{ uri, headers: { Authorization } }}>`.

### `src/api/user.ts` — `userApi`

```typescript
userApi.register({ email, mobile_number, password })  // POST /user/register → { data: UserResponse }
userApi.login({ email, password })                    // POST /user/login → { data: UserResponse, accessToken }
userApi.refresh()                                      // POST /user/refresh → { accessToken }
userApi.logout()                                       // POST /user/logout
```

`UserResponse` includes: `user_id`, `onboarding_step`, `onboarding_complete`, `athlete_id?`.

### `src/api/sports.ts` — `sportsApi`

```typescript
sportsApi.getSports()       // GET /sports → Sport[] (unwraps { data } envelope)
sportsApi.getTournaments()  // GET /tournaments → Tournament[] (unwraps { data } envelope)
```

### `src/api/connections.ts` — `connectionsApi`

```typescript
connectionsApi.getConnections()             // GET /connections → { data: ConnectedAthlete[] }
connectionsApi.getStatus(targetUserId)      // GET /connections/status?user_id=...
connectionsApi.listRequests()               // GET /connections/requests → { incoming, outgoing }
connectionsApi.sendRequest(receiverId)      // POST /connections/request { receiver_id }
connectionsApi.acceptRequest(requestId)     // PATCH /connections/:id/accept
connectionsApi.rejectRequest(requestId)     // PATCH /connections/:id/reject
connectionsApi.cancelRequest(requestId)     // DELETE /connections/:id
connectionsApi.getSuggestions(athleteId)     // GET /connections/:id/suggestions
```

### `src/api/messaging.ts` — `messagingApi`

```typescript
messagingApi.getConversations()                          // GET /messages/conversations
messagingApi.getConversation(id)                         // GET /messages/conversations/:id
messagingApi.createDirectConversation(participantId)     // POST /messages/conversations
messagingApi.getMessages(conversationId, cursor?, limit) // GET /messages/conversations/:id/messages
messagingApi.sendMessage(input)                          // POST /messages/send
messagingApi.editMessage(messageId, content)             // PATCH /messages/:id
messagingApi.deleteMessage(messageId)                    // DELETE /messages/:id
messagingApi.markRead(conversationId)                    // POST /messages/conversations/:id/read
messagingApi.getUnreadCount()                            // GET /messages/unread-count
```

### Response envelope

```typescript
// Success
{ data: T }

// Error
{ error: string, message: string }
```

---

## Zustand Stores

### `src/stores/authStore.ts`

```typescript
interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null
  userId: string | null
  setAuthenticated(value: boolean): void
  setAccessToken(token: string | null): void
  setUserId(id: string | null): void
  clearAuth(): void   // Clears AsyncStorage + resets state
}
```

### `src/stores/athleteStore.ts`

```typescript
interface AthleteState {
  profile: AthleteProfile | null
  passport: PassportEntry[]
  education: EducationEntry[]
  skills: Skill[]
  athlete_id?: string | null
  setAthleteData(data): void
  clearAthlete(): void
  addPassportEntry(entry): void
  addSkills(skills): void
  addEducation(edu): void
  updateEducation(edu): void
  setProfilePhoto(url): void
  setAthleteId(id): void
}
```

### `src/stores/messagingStore.ts`

```typescript
interface MessagingState {
  conversations: Conversation[]
  messages: Record<string, Message[]>  // keyed by conversation_id
  typing: { [conversationId: string]: string[] }
  presence: { [userId: string]: 'online' | 'offline' }
  totalUnread: number
  activeConversationId: string | null

  setConversations, updateConversation, moveConversationToTop
  setMessages, prependMessages, addMessage, updateMessage, deleteMessage, setMessageStatus
  setTyping, setPresence, setTotalUnread, decrementUnread, setActiveConversation
}
```

**Access outside React** via `useStore.getState()` (e.g., in `apiCall`, `wsManager`).

---

## WebSocket

`lib/websocket.ts` exports a singleton `wsManager`:
- Connects to `ws://<host>:3000/ws/messaging?token=<jwt>`
- Exponential backoff reconnection (max 10 attempts, max 30s delay)
- Ping heartbeat every 25 seconds
- Auto-reconnects on AppState `active` (app foreground)
- Connected after auth hydration in `App.tsx`

**Server event types:** `message:new`, `message:update`, `message:delete`, `presence:update`, `typing:start`, `typing:stop`, `conversation:read`, `error`

**Client event types:** `message:send`, `message:edit`, `message:delete`, `typing:start`, `typing:stop`, `conversation:read`

**Hooks:**
- `useWebSocket(handler)` — subscribes to WS events with stable ref
- `useWsSend()` — returns bound send function

---

## Messaging System

- **Optimistic UI**: messages get a `_tempId` and `_status: 'sending'`, reconciled on server ack via `setMessageStatus`
- **Cursor-based pagination** for loading older messages (`getMessages` with cursor param)
- **Reply-to**: messages can reference another message via `reply_to_id`
- **Edit / Delete**: in-place via long-press action sheet
- **Attachments**: picked from gallery with `react-native-image-picker`, encoded as base64 data URIs
- **Typing indicators**: WS events update `typing` map in store, shown in both InboxScreen and ChatScreen
- **Presence**: online/offline dots on conversation rows
- **Unread badges**: per-conversation count + global total on Messages tab icon
- **InboxScreen** uses `staleTime: 0`, `refetchOnMount: 'always'`, and `useFocusEffect` to always refetch

---

## Auth + Onboarding Flow

### Auth hydration (App.tsx)

On app launch, reads `accessToken`, `userId`, `athleteId` from AsyncStorage.
If found, sets Zustand stores and connects WebSocket. Otherwise shows Auth stack.

### Registration wizard (`RegisterScreen/`)

3-step wizard. Navigation between steps uses local state in parent screen.

- **Step1Account** — POST /user/register, stores user_id
- **Step2Profile** — POST /api/athletes, stores athlete_id + sport_id
- **Step3Passport** — POST /api/athletes/:id/passport, navigates to profile

IDs persisted to AsyncStorage across steps.

### Auth state flow

Login → `setAuthenticated(true)` + `setAccessToken(token)` + `setUserId(id)` + persist to AsyncStorage.
Logout → `clearAuth()` clears AsyncStorage + resets Zustand state, navigation resets to Auth stack.

---

## Connections System

### Hooks

**`useConnectionStatus(targetUserId)`** — TanStack Query, key `['connection-status', targetUserId]`.
Returns `{ status, requestId, isLoading, refetch }`.

**`useConnectionActions(currentStatus, refetch)`** — optimistic mutation wrapper.
Returns `{ optimisticStatus, isMutating, sendRequest, acceptRequest, rejectRequest, cancelRequest }`.

### `ConnectionButton` component

Props: `{ targetUserId, currentUserId }`. Returns `null` if viewing own profile.
Renders based on status: `none` → Connect, `pending_outgoing` → Pending, `pending_incoming` → Accept/Reject, `connected` → Connected + Message.

---

## Types (`src/types/athlete.ts`)

All types mirror actual backend DB columns. Do not invent field names.

```typescript
type SportLevel    = 'international' | 'national' | 'state' | 'district'
type Medal         = 'gold' | 'silver' | 'bronze' | 'none'
type PbUnit        = 'seconds' | 'meters' | 'kg' | 'points' | 'other'
type SkillCategory = 'sport_specific' | 'soft_skill' | 'technical' | 'leadership'

AthleteProfile     // athlete_profiles row + full_name from users
AthleteFullProfile // { data: AthleteProfile & { passport, education, skills } }
PassportEntry      // sports_passport row + tournament_name + tournament_level (joined)
EducationEntry     // athlete_education row
Skill              // athlete_skills row
AthleteListItem    // Minimal athlete for list views
ConnectionRequest  // Connection request row
```

**Field naming:**
- Photo: `profile_photo_url` (not `avatar_url`)
- PK fields: `athlete_id`, `passport_id`, `education_id`, `skill_id`
- Boolean DB columns are `0 | 1`, not `boolean` — always check with `=== 1`
- Nullable columns are `T | null`, never `T | undefined`
- `languages` is a CSV string `'en,hi,kn'`

**Helper functions:**
```typescript
parseLanguages(csv)          // 'en,hi,kn' → ['en', 'hi', 'kn']
resolveLevel(entry)          // entry.tournament_level ?? entry.level_override ?? null
resolveTournamentName(entry) // entry.tournament_name ?? entry.tournament_name_override ?? 'Tournament'
```

---

## Types (`src/types/messaging.ts`)

```typescript
Message        // Full message with content, attachments, reply_to, _status, _tempId
Conversation   // With participants, last_message, unread_count
Participant    // user_id, first_name, last_name, profile_photo_url, role
Attachment     // file_name, mime_type, data_uri
SendMessageInput
WsClientEvent  // Union of client → server WS events
WsServerEvent  // Union of server → client WS events
```

---

## Theme System (`src/theme/`)

### Colors (`colors.ts`)

```typescript
colors.bg         // '#f1f5f9'
colors.surface    // '#ffffff'
colors.surface2   // '#e2e8f0'
colors.border     // 'rgba(0,0,0,0.1)'
colors.accent     // '#16a34a'
colors.accent2    // '#dc2626'
colors.accent3    // '#0891b2'
colors.text       // '#0f172a'
colors.muted      // '#64748b'
colors.gold       // '#d97706'
colors.white, colors.black

// Auth palette (reg* prefix)
colors.regBg, colors.regSurface, colors.regInk, colors.regMuted
colors.regBorder, colors.regAccent, colors.regAccentDk, colors.regAccent2
colors.regSuccess, colors.regError, colors.regGold

// Dashboard
colors.darkBg     // '#1a1a2e'
colors.darkBg2    // '#0f3460'
```

### Typography (`typography.ts`)

```typescript
fonts.display    // 'BebasNeue-Regular'
fonts.body       // 'DMSans-Regular'
fonts.bodyMedium // 'DMSans-Medium'
fonts.bodyBold   // 'DMSans-Bold'
fonts.mono       // 'SpaceMono-Regular'

fontSize.xs=11, sm=13, md=15, lg=17, xl=20, xxl=28, display=36
```

### Spacing (`spacing.ts`)

```typescript
spacing.xs=4, sm=8, md=12, lg=16, xl=24, xxl=32, xxxl=48
radii.sm=6, md=10, lg=14, xl=20, full=9999
```

**Never hardcode style values.** Always use theme tokens: `colors.accent`, `spacing.lg`, `fontSize.md`, `radii.md`.

---

## Component Details

### `ProfileHero`
- Cover gradient with avatar (overlaps cover), photo upload badge for own profile
- Photo upload: `launchImageLibrary` → `athleteApi.uploadPhoto` → update store
- Photo display: `<Image source={{ uri: getPhotoUrl(id), headers: { Authorization } }}>`
- Stats computed with `deriveStats(passport)` each render
- Actions row: `ConnectionButton` + `MessageButton` (creates direct conversation, navigates to Chat)

### `SportsPassport`
- Sorts entries by `year DESC`
- "+ Add" button opens modal form: tournament name, year, level chips, medal chips, notes
- Calls `athleteApi.addPassportEntry`, updates store optimistically

### `SkillsCard`
- "+ Add" button opens modal form: skill name input + category chips
- Calls `athleteApi.addSkills`, updates store

### `EducationCard`
- "+ Add" button opens modal form: institution, degree, field, start/end year
- Calls `athleteApi.addEducation`, updates store

### `ConnectionButton`
See Connections System section above.

### `InboxScreen`
- Conversation list with search filter, online dots, typing previews, unread badges
- WebSocket handler for `message:new`, `presence:update`, `typing` events
- `useFocusEffect` refetches on every screen focus

### `ChatScreen`
- Inverted FlatList with message bubbles, day separators
- Long-press action sheet: Reply, Edit, Delete
- Composer: text input + attachment button + send button
- Reply preview bar above composer
- Typing indicator at bottom
- Auto mark-read on open + cursor pagination for older messages

---

## Known Hermes Engine Constraints (Android)

- **No `URLSearchParams`** — use manual query string construction: `parts.push(\`key=\${encodeURIComponent(value)}\`)`
- **Empty string colors crash Android** — always use a valid color value (e.g., `colors.regMuted`, never `''`)
- **Zustand `getSnapshot` infinite loops** — when using `?? []` fallbacks in selectors, define stable module-level constants instead of inline array literals:
  ```typescript
  // BAD: creates new array on every render → infinite loop
  const msgs = useMessagingStore(s => s.messages[id] ?? [])

  // GOOD: stable reference
  const EMPTY_MESSAGES: Message[] = []
  const msgs = useMessagingStore(s => s.messages[id] ?? EMPTY_MESSAGES)
  ```

---

## Conventions

- Theme tokens (`colors`, `spacing`, `fontSize`, `radii`) from `src/theme/` — no hardcoded values
- One API module per domain in `src/api/`
- Screen components: `export function ScreenName()`
- Component folders: `ComponentName/ComponentName.tsx`
- Navigation types centralized in `navigation/types.ts`
- Auth token attached automatically by `apiCall()` — no manual header management except for `<Image>` sources and `FormData` uploads
- `StyleSheet.create()` at module level, never inline styles
- Boolean DB columns: `0 | 1`, check with `=== 1`
- Nullable API data: `T | null`, never `T | undefined`

---

## Dev Setup

```bash
# Backend (port 3000) — from /sportlink/backend/
bun run dev

# Mobile app — from /sportlink/SportLinkMobile/
npx react-native start              # Metro bundler
npx react-native run-ios            # iOS
npx react-native run-android        # Android

# Full reset
cd backend && bun run db:reset
cd SportLinkMobile/android && ./gradlew clean
```

### Android on Physical Device
1. Connect via wireless ADB
2. Update IP in `src/api/client.ts` (`BASE_URL`) and `src/lib/websocket.ts` (`WS_BASE`)
3. `npx react-native run-android`

---

## Implementation Status

| Feature | Status |
|---|---|
| App shell + React Navigation | Done |
| Auth store + AsyncStorage persistence | Done |
| Sign In + login API | Done |
| Register — 3-step wizard | Done |
| API client (`apiCall`) with auth + 401 redirect | Done |
| Athlete API + athlete store | Done |
| Profile page (TanStack Query + store) | Done |
| ProfileHero (cover + avatar + photo upload + stats) | Done |
| SportsPassport card + add form | Done |
| SkillsCard + add form | Done |
| EducationCard + add form | Done |
| Athletes listing page | Done |
| Connections page | Done |
| Connection system (send/accept/reject/cancel) | Done |
| ConnectionButton with optimistic UI | Done |
| Requests page (incoming/outgoing) | Done |
| Dashboard page | Done |
| Messaging — InboxScreen (conversations, search, unread) | Done |
| Messaging — ChatScreen (send, reply, edit, delete, attachments) | Done |
| WebSocket realtime (messages, typing, presence) | Done |
| Messages tab unread badge | Done |
| ErrorBoundary for Android crash debugging | Done |
| Dashboard — wire to real API | Not started |
| Edit profile inline | Not started |
