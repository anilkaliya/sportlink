# Task: Add Entry Buttons to Profile Sections
> Surgical change — do not touch any other components, routes, or files not listed here.
> Read `CLAUDE.md` before starting.

---

## Context

The athlete profile page (`/profile/:id`) is live and rendering real API data.
Three sections currently show empty states with no way to add data:
- **Sports Passport** — shows "No passport entries" when empty
- **Skills** — shows "No skills listed yet"
- **Education** — shows "No education entries yet"

Each section needs an **Add button** that opens an **inline form** (not a new page,
not a modal) directly inside the card. On submit, it calls the existing backend API,
updates the Zustand store, and re-renders the section — no page reload.

---

## Backend APIs already available (do not create new endpoints)

```
POST /athletes/:id/passport   body: PassportEntryInput
POST /athletes/:id/skills     body: { skill_name, category }
POST /athletes/:id/education  body: EducationInput        ← check if this exists, create if missing
```

Verify all three endpoints exist and return `{ data: <created row> }` before
writing any frontend code. If `POST /athletes/:id/education` is missing, create it
following the exact same pattern as the skills endpoint in
`src/modules/athlete/athlete.routes.ts` and `athlete.service.ts`.

---

## Visual Behaviour — same pattern for all three sections

```
BEFORE (current state):
┌─────────────────────────────────────┐
│ 🛂 SPORTS PASSPORT          [+ Add] │  ← Add button sits in card header, right side
│                                     │
│  No passport entries yet.           │
└─────────────────────────────────────┘

AFTER clicking [+ Add]:
┌─────────────────────────────────────┐
│ 🛂 SPORTS PASSPORT          [+ Add] │
│─────────────────────────────────────│
│ ┌───────────────────────────────┐   │
│ │  [inline form fields here]    │   │  ← form slides in below header
│ │  [Save]  [Cancel]             │   │
│ └───────────────────────────────┘   │
│                                     │
│  No passport entries yet.           │
└─────────────────────────────────────┘

AFTER saving:
┌─────────────────────────────────────┐
│ 🛂 SPORTS PASSPORT          [+ Add] │
│─────────────────────────────────────│
│  ● Asian Games · 100m · 2023        │  ← new entry appears, form closes
│    🌏 International  🥇             │
└─────────────────────────────────────┘
```

The form animates in/out with a smooth slide — use CSS transition on `max-height`
and `opacity`. Do not use a modal or a drawer. Inline only.

---

## Change 1 — Sports Passport: Add Entry Form

**File:** `src/components/SportsPassport/SportsPassport.tsx`
**File:** `src/components/SportsPassport/SportsPassport.module.css`

### Add button
Place an `[+ Add Entry]` button in the card title row, right-aligned.
Style: small, outlined, `border: 1.5px solid var(--border)`, `border-radius: 6px`,
`font-size: 12px`, `padding: 5px 12px`. On hover: `border-color: var(--accent)`,
`color: var(--accent)`.

### Inline form fields (in order)
```
Tournament (select — populated from GET /sports/tournaments or hardcoded list)
  └─ If "Other" selected → show free-text "Tournament name" input

Event / Discipline  (text input)  placeholder: "e.g. 100m Sprint"
Year                (number input) min=1970 max=currentYear
Venue               (text input)  placeholder: "e.g. Guwahati, Assam"  optional

Level (required) — 4 clickable option cards:
  🌍 International   🏅 National   🏃 State   📍 District

Medal — 4 clickable option cards:
  🥇 Gold   🥈 Silver   🥉 Bronze   🏅 Participated

Result / Performance  (text input)  placeholder: "e.g. 11.34s or 6.12m"  optional
```

### On Save
1. Call `POST /athletes/:id/passport` with form values
2. On success: push new entry into `athleteStore.passport` array via
   `useAthleteStore.getState().setPassportEntry(newEntry)` — add this setter to the store
3. Close the form (reset `isFormOpen` to false)
4. Clear form fields

### On Cancel
Close form, clear fields, no API call.

### Validation (client-side, before API call)
- Tournament (or override name) — required
- Event name — required
- Year — required, must be a valid 4-digit year
- Level — required (one must be selected)
- Medal — required (one must be selected)

Show inline validation error text below each invalid field. Do not use `alert()`.

---

## Change 2 — Skills: Add Skill Form

**File:** `src/components/SkillsCard/SkillsCard.tsx`
**File:** `src/components/SkillsCard/SkillsCard.module.css`

### Add button
Same style as passport add button. Place in card title row, right side.

### Inline form fields
```
Skill name  (text input with autocomplete suggestions)
  Suggestions list (shown as dropdown while typing):
    Sprint Training, Strength & Conditioning, Sports Psychology,
    Team Leadership, Public Speaking, Goal Setting,
    Performance Analysis, Injury Rehabilitation, Sports Nutrition,
    Coaching, Commentary, Video Analysis, Tactical Planning,
    Discipline, Time Management

Category (required) — 4 clickable pill options:
  🏃 Sport Specific   🤝 Soft Skill   📊 Technical   🎯 Leadership
```

The autocomplete is frontend-only — filter the suggestions list as the user types.
No API call for suggestions. On selecting a suggestion, auto-fill the skill name.

### On Save
1. Call `POST /athletes/:id/skills` with `{ skill_name, category }`
2. On success: push new skill into `athleteStore.skills` via new store setter
3. Close form, clear fields

### Validation
- Skill name — required, min 2 chars
- Category — required

---

## Change 3 — Education: Add Education Form

**File:** `src/components/EducationCard/EducationCard.tsx`
**File:** `src/components/EducationCard/EducationCard.module.css`

### Add button
Same style. Place in card title row, right side.

### Inline form fields
```
Institution name  (text input, required)  placeholder: "e.g. JSS College, Mysuru"
Degree            (text input, optional)  placeholder: "e.g. B.Sc, M.P.Ed"
Field of study    (text input, optional)  placeholder: "e.g. Sports Science"
Start year        (number input, required) min=1970 max=currentYear
End year          (number input, optional) placeholder: "Leave blank if ongoing"
Sports college?   (toggle)  default: off
```

### On Save
1. Call `POST /athletes/:id/education` with form values
2. `end_year`: if blank, send `null`
3. On success: push new entry into `athleteStore.education` via store setter
4. Close form, clear fields

### Validation
- Institution name — required
- Start year — required

---

## Zustand Store Changes

**File:** `src/stores/athleteStore.ts`

Add three new setters — one per section:

```typescript
addPassportEntry: (entry: PassportEntry) => void
addSkill:         (skill: Skill) => void
addEducation:     (edu: EducationEntry) => void
```

Implementation:
```typescript
addPassportEntry: (entry) =>
  set(s => ({ passport: [entry, ...s.passport] })),  // prepend — newest first

addSkill: (skill) =>
  set(s => ({ skills: [...s.skills, skill] })),

addEducation: (edu) =>
  set(s => ({ education: [...s.education, edu] })),
```

Do not replace the full `setAthleteData` — these are additive setters only.

---

## API Layer Changes

**File:** `src/api/athlete.ts`

Add three new functions:

```typescript
addPassportEntry: (athleteId: string, data: CreatePassportEntryInput) =>
  apiFetch<{ data: PassportEntry }>(`/athletes/${athleteId}/passport`, {
    method: 'POST', body: JSON.stringify(data)
  }),

addSkill: (athleteId: string, data: { skill_name: string; category: SkillCategory }) =>
  apiFetch<{ data: Skill }>(`/athletes/${athleteId}/skills`, {
    method: 'POST', body: JSON.stringify(data)
  }),

addEducation: (athleteId: string, data: CreateEducationInput) =>
  apiFetch<{ data: EducationEntry }>(`/athletes/${athleteId}/education`, {
    method: 'POST', body: JSON.stringify(data)
  }),
```

---

## Types to Add

**File:** `src/types/athlete.ts`

```typescript
export interface CreatePassportEntryInput {
  sport_id: string
  tournament_id?: string
  tournament_name_override?: string
  level_override?: SportLevel
  event_name: string
  year: number
  venue?: string
  medal: Medal
  result_value?: string
  is_personal_best?: 0 | 1
  pb_value?: number
  pb_unit?: PbUnit
}

export interface CreateEducationInput {
  institution_name: string
  degree?: string
  field_of_study?: string
  start_year?: number
  end_year?: number | null
  is_sports_college?: 0 | 1
}
```

---

## CSS Animation for Form Slide-in

Add to each component's `.module.css`:

```css
.inlineForm {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: max-height 0.3s ease, opacity 0.25s ease;
  border-top: 1px solid var(--border);
  margin-top: 0;
}
.inlineForm.open {
  max-height: 800px;
  opacity: 1;
  margin-top: 0;
}
.formInner {
  padding: 20px 0 4px;
}
```

---

## Constraints

- Do not touch `ProfilePage.tsx`, `ProfileHero.tsx`, `Nav.tsx`, or any routing files
- Do not create new pages or modals
- Do not add any new npm packages
- Form state is local `useState` inside each component — do not put form state in Zustand
- Loading state on Save button: disable button + show "Saving…" text while API call is in flight
- Error state: if API call fails, show error message inside the form, keep form open
- Each component file must stay under 120 lines — split into a separate `AddEntryForm.tsx`
  sub-component if the file exceeds this

---

## Verification Checklist

- [ ] `[+ Add Entry]` button visible in Sports Passport card header
- [ ] `[+ Add]` button visible in Skills card header
- [ ] `[+ Add]` button visible in Education card header
- [ ] Clicking add opens inline form with slide animation
- [ ] Clicking cancel closes form without API call
- [ ] Validation errors show inline before API call
- [ ] Save button shows "Saving…" while request is in flight
- [ ] On success: new entry appears in the list immediately without page reload
- [ ] On API error: error message shown inside form, form stays open
- [ ] `bun run dev` (backend) + `npm run dev` (frontend) both run without errors
- [ ] No TypeScript errors (`npm run build` passes)
