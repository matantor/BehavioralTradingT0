# Execution-Ready Spec Pack

---

## 1. SPEC INTEGRITY CHECK

### Contradictions

- **Dashboard Chart vs Analytics-Only Rule**: Section 9 (Dashboard) says "Historical graph (Level 3): existing implementation, keep as-is" but Section 11 states "Use charts only on Analytics page" and "Don't add charts to Dashboard (except existing historical graph)". The parenthetical exception exists but contradicts the DO/DON'T framing.

- **Card Radius Mismatch**: Section 3 specifies `rounded-lg (8px)` for Standard Card, but the existing shadcn `card.tsx` component uses `rounded-xl` (12px). Section 3 also explicitly forbids `rounded-xl`.

- **Journal Page Purpose Mismatch**: Section 9 describes Journal as prose content ("Title", "Preview", "Body: full markdown support", "Level 0 density forever") but the actual app's Journal is a **trade entry system** with structured fields (action type, ticker, quantity, price, payment info). These are fundamentally different UIs.

- **Font-Serif Usage**: Section 4 defines only `font-sans` and `font-mono` but the existing Dashboard uses `font-serif` for North Star thesis content. The spec's Typography Application Matrix has no entry for thesis/reflective text using serif.

- **AppShell Width vs Spec Width**: Section 2 specifies responsive breakpoints (768px, 1024px, 1280px) and desktop max-width of 1024px/1200px, but the existing `AppShell.tsx` enforces `max-width: 480px` globally for mobile fidelity. The spec doesn't acknowledge this mobile-first constraint.

### Ambiguities

- **"Level 0" Definition for Forms**: Level 0 is defined as "stacked text blocks inside cards" but Journal, NorthStarEdit, and other pages are form-heavy. The spec doesn't define how forms map to density levels.

- **Thoughts Container Type**: Section 9 says Thoughts list items use "Inline Surface (not full card)" but doesn't clarify whether the page itself uses Standard Cards to wrap groups of Inline Surfaces.

- **"North Star Question"**: Section 9 references "Question: What matters most in your trading?" but the actual NorthStar page has no such question—only user-entered thesis content. Unclear if this question should be added.

- **Position Detail "Linked Items"**: Spec says "List of journal entries mentioning this ticker" but actual implementation uses `RelationEdges` which links any entity type. Spec doesn't account for the existing relation system.

- **Quick Access Grid Size**: Section 9 says "2-column grid on mobile, 3-column on tablet" for Quick Access but Dashboard currently shows 5 items. 5 items in a 2-column grid creates an orphan. No guidance on orphan handling.

- **Empty State Button Type**: Section 9 variously says "Ghost button" or doesn't specify. Inconsistent pattern for empty state CTAs.

### Missing Definitions

- **No Coverage for Onboarding Page**: Exists in repo but absent from spec.

- **No Coverage for NorthStarHistory Page**: Exists in repo but absent from spec.

- **No Coverage for NorthStarVersionDetail Page**: Exists in repo but absent from spec.

- **No Coverage for About Page**: Exists in repo but absent from spec.

- **ContextSelector Component**: Used on Thoughts and NorthStarEdit pages but not mentioned in spec.

- **LinkedItems Component**: Used on 4 detail pages but not mentioned in spec.

- **Action Type Badges/Tags**: Journal entries have colored action badges (buy=green, sell=red, etc.). Spec Section 10 forbids `badge` component but doesn't provide alternative for this existing pattern.

- **Table Component Not Installed**: Spec allows `table` in Component Budget but shadcn table is not currently installed in the repo.

- **Select Component Not Installed**: Spec allows `select` but it's not installed. Journal uses native `<select>` with inline styles.

- **Dialog Component Not Installed**: Spec allows `dialog` but it's not installed. Current app uses `window.confirm()`.

- **Switch Component Not Installed**: Spec allows `switch` but it's not installed.

---

## 2. MINIMAL PATCH SET

### Patch 1: Resolve Dashboard Chart Contradiction
**Location**: Section 11, "Data Density Rules"

**Current Text**:
```
❌ **DON'T**: Add charts to Dashboard (except existing historical graph)
```

**Replacement Text**:
```
❌ **DON'T**: Add new charts to Dashboard beyond the existing Portfolio Summary historical graph
```

**Why**: Removes ambiguity; explicitly names the one allowed chart.
**Risk Reduced**: Implementer confusion about whether Dashboard chart should be removed.

---

### Patch 2: Fix Card Radius to Match Installed shadcn
**Location**: Section 3, "Type 1: Standard Card"

**Current Text**:
```
Radius:       rounded-lg (8px)
```

**Replacement Text**:
```
Radius:       rounded-xl (12px) — matches installed shadcn card
```

**Also update** Section 3, "Strict Rules":

**Current Text**:
```
- ❌ No `rounded-xl` (12px+) — too soft for data
```

**Replacement Text**:
```
- ❌ No `rounded-2xl` (16px+) or `rounded-full` — too soft for data
```

**Why**: The shadcn card component already uses `rounded-xl`. Changing it would require modifying the shadcn component itself, which violates shadcn conventions.
**Risk Reduced**: Conflict between spec and installed component; unnecessary card customization.

---

### Patch 3: Clarify Journal Page Is Trade Entry System
**Location**: Section 9, "Journal (List View)" and "Journal (Detail View)"

**Current Text (List View)**:
```
**Each Entry**:
- Standard Card (clickable)
- Date: `font-mono text-xs text-zinc-500` (top-left)
- Title (if present): `text-lg font-semibold`
- Preview: `text-sm text-zinc-600 line-clamp-2`
- **Density**: Level 0 (never structured; always prose)
```

**Replacement Text (List View)**:
```
**Each Entry** (Trade Record):
- Standard Card (clickable)
- Action badge: colored pill (buy=emerald, sell=red, long=blue, short=amber, deposit/withdraw=violet)
- Ticker: `font-mono text-sm font-medium uppercase`
- Quantity × Price: `text-sm text-zinc-600`
- Total Value: `font-mono text-base font-semibold tabular-nums`
- Timestamp: `font-mono text-xs text-zinc-500`
- **Density**: Level 1 (structured rows with aligned columns)

**Action Badge Styling** (exception to "no badge" rule for trade types):
```
bg-{color}-500 text-white text-xs font-semibold uppercase px-2 py-0.5 rounded
```
```

**Current Text (Detail View)**:
```
**Content**:
- Date: `font-mono text-xs text-zinc-500`
- Title: `text-2xl font-semibold`
- Body: `text-base leading-relaxed` (full markdown support)
- **Density**: Level 0 (never structured)
```

**Replacement Text (Detail View)**:
```
**Content**:
- Action badge + Ticker: header row
- Transaction details: Inline Surface grid (Quantity, Price, Total Value, Entry Time, Position type)
- Payment info (if buy): Inline Surface with amber background tint
- Optional metadata (if present): Standard Card with label/value pairs
- Linked items: LinkedItems component
- Timestamps: `font-mono text-xs text-zinc-500`
- **Density**: Level 1 (structured data, not prose)
```

**Why**: The actual app is a trading journal, not a prose journal. Spec must match reality.
**Risk Reduced**: Implementer rebuilding Journal as prose system; destroying existing functionality.

---

### Patch 4: Add Font-Serif for Reflective Content
**Location**: Section 4, "Font Families"

**Current Text**:
```
**Rule**:
- `font-sans`: ALL body text, labels, headings, reflective content
- `font-mono`: ONLY numbers, tickers, dates, timestamps, financial data
```

**Replacement Text**:
```
**Rule**:
- `font-sans`: Body text, labels, headings
- `font-serif`: North Star thesis display (read-only), Thought content display (optional)
- `font-mono`: ONLY numbers, tickers, dates, timestamps, financial data
```

**Also add to Typography Application Matrix**:
```
| Thesis display | serif | base-lg | normal | relaxed | Dashboard, NorthStar |
```

**Why**: Existing Dashboard uses `font-serif` for thesis. Serif provides visual distinction for reflective vs transactional content.
**Risk Reduced**: Removing intentional serif styling; inconsistent typography.

---

### Patch 5: Add Missing Page Specifications
**Location**: Section 9, after "Settings / About"

**Add New Subsection**:
```
### Onboarding
**Layout**: Centered, max-width 600px

**Content**:
- Standard Card
- Welcome text: `text-base`
- Feature list: native `<ul>` with standard styling
- CTA question: `font-medium`
- Two buttons: Primary ("Create Thesis Now"), Secondary ("Skip for Now")

**Behavior**: Redirects to Dashboard if already completed/skipped.

**What MUST NOT be added**:
- ❌ Multi-step wizard
- ❌ Account creation
- ❌ Tutorial overlay

---

### NorthStar History
**Layout**: Single column

**Content**:
- Standard Card containing list
- Each version: clickable row with version number, preview, date
- Current version: highlighted with `CURRENT` badge and blue left border
- **Density**: Level 1 (structured rows)

**What MUST NOT be added**:
- ❌ Diff view between versions
- ❌ Restore previous version

---

### NorthStar Version Detail
**Layout**: Reading-width (640px max)

**Content**:
- Current indicator (if applicable): Inline Surface with badge
- Thesis content: Standard Card, `text-base leading-relaxed`
- Change note (if present): Standard Card
- Metadata: Standard Card with label/value pairs
- LinkedItems component
- Back link: Secondary button

**What MUST NOT be added**:
- ❌ Edit capability (versions are immutable)
- ❌ Delete capability

---

### About
**Layout**: Single column

**Content**:
- App title: Standard Card
- Methodology: Standard Card with `<ul>`
- Principles: Standard Card with `<ul>`
- Version: Standard Card

**What MUST NOT be added**:
- ❌ Links to external resources
- ❌ Changelog
```

**Why**: These pages exist and need spec coverage to prevent drift.
**Risk Reduced**: Pages being modified without design guidance.

---

### Patch 6: Acknowledge AppShell Mobile Constraint
**Location**: Section 2, "Page Width Rules"

**Add after existing breakpoints**:
```
**Mobile-Fidelity Mode** (current implementation):
The app currently enforces `max-width: 480px` via AppShell to maintain mobile fidelity on desktop. This is intentional for the MVP phase. The responsive breakpoints above describe the target state when mobile-fidelity mode is removed.

For implementation: Do not modify AppShell width constraints. Apply internal padding/width rules within the 480px container.
```

**Why**: Prevents implementer from "fixing" AppShell to match spec breakpoints.
**Risk Reduced**: Breaking mobile-fidelity design intent.

---

### Patch 7: Add Missing Components to "Must Install" List
**Location**: Section 10, after "Allowed Components"

**Add New Subsection**:
```
### Components to Install (not yet in repo)
```
✅ table          — Required for Level 2 data density (Portfolio 10+ positions)
✅ dialog         — Required for delete confirmations (replace window.confirm)
✅ switch         — Required for Settings theme toggle
✅ select         — Required for form dropdowns (Journal action type, position select)
```

These must be installed via `npx shadcn@latest add [component]` before implementation.
```

**Why**: Spec allows components that aren't installed. Makes dependency explicit.
**Risk Reduced**: Implementer blocked by missing components; using native elements inconsistently.

---

### Patch 8: Define Quick Access Orphan Handling
**Location**: Section 9, "Dashboard", "Section 3: Quick Access"

**Current Text**:
```
- Inline Surfaces (2-column grid on mobile, 3-column on tablet)
- Each: icon + label, tap to navigate
```

**Replacement Text**:
```
- Grid layout: `grid-cols-2` on mobile, `grid-cols-3` on tablet+
- Each item: Inline Surface with icon above label, full tap target
- **Orphan handling**: If odd number of items, last item spans full width on mobile (`col-span-2`)
- Current items (5): Portfolio, Trading Journal, Thoughts & Theses, Analytics & Patterns, Settings
```

**Why**: 5 items creates orphan in 2-column grid. Explicit rule prevents visual awkwardness.
**Risk Reduced**: Inconsistent orphan treatment across implementations.

---

## 3. IMPLEMENTATION MAP

### Pre-Implementation Setup

| Task | Files to Modify | Action |
|------|-----------------|--------|
| Install missing shadcn components | Terminal | `npx shadcn@latest add table dialog switch select input textarea label separator` |
| Verify Tailwind config | `tailwind.config.*` or `src/index.css` | Ensure zinc color scale is available |
| Update shadcn card if needed | `src/components/ui/card.tsx` | Verify `rounded-xl` (no change needed per Patch 2) |

---

### Page-by-Page Implementation Checklist

#### Dashboard (`src/ui/pages/Dashboard.tsx`)
**Current State**: Uses Tailwind + shadcn Card + Chart. Closest to spec.

| Spec Requirement | Current State | Action |
|------------------|---------------|--------|
| Portfolio Summary in Standard Card | ✅ Using shadcn Card | Verify padding matches spec (p-5 md:p-6) |
| Portfolio value: `text-4xl font-mono tabular-nums` | ✅ Already correct | No change |
| P&L color: emerald-600/rose-600 | ⚠️ Uses text-emerald-600/text-rose-600 | Verify dark mode variants present |
| Historical chart | ✅ Exists | No change |
| North Star in Standard Card | ✅ Using shadcn Card | Keep font-serif for thesis |
| Quick Access: 2-col grid | ✅ grid-cols-2 | Add orphan handling (last item col-span-2 if odd) |
| Quick Access items: Inline Surface | ⚠️ Uses border/shadow-sm | Change to bg-zinc-50 no-border per spec |
| Lucide icons | ✅ Present | No change |

**Net Changes**: 2 styling adjustments (Quick Access surfaces, orphan span)

---

#### Journal (`src/ui/pages/Journal.tsx`)
**Current State**: 950+ lines, inline styles, custom Card, complex form.

| Spec Requirement | Current State | Action |
|------------------|---------------|--------|
| Trade list: Level 1 structured rows | ⚠️ Uses cards with left border | Convert to shadcn Card with internal structure |
| Action badges | ⚠️ Inline styled spans | Standardize to spec colors (emerald/red/blue/amber/violet) |
| Ticker: `font-mono uppercase` | ⚠️ Partial | Apply consistently |
| Values: `font-mono tabular-nums` | ⚠️ Missing tabular-nums | Add class |
| Form: labels above inputs | ⚠️ Present but inline styled | Convert to Tailwind classes |
| Form inputs: spec styling | ⚠️ Inline styles | Convert to `border-zinc-300 rounded-lg px-4 py-3` |
| Buttons: spec variants | ⚠️ Inline styled | Convert to Primary/Secondary/Ghost patterns |
| Add Entry: Primary button | ⚠️ Blue inline style | Convert to `bg-zinc-900 text-white` |

**Net Changes**: Major restyling (inline styles → Tailwind), component swap (custom Card → shadcn Card)

---

#### JournalDetail (`src/ui/pages/JournalDetail.tsx`)
**Current State**: Inline styles, custom Card, multiple sections.

| Spec Requirement | Current State | Action |
|------------------|---------------|--------|
| Standard Card containers | ⚠️ Custom Card | Swap to shadcn Card |
| Transaction details: Inline Surface | ⚠️ Uses inline styled div | Convert to `bg-zinc-50 rounded-md p-3` |
| Payment info: distinct surface | ⚠️ Amber background inline | Keep amber tint, convert to Tailwind |
| LinkedItems component | ✅ Present | No change |
| Archive button: Destructive | ⚠️ Red inline styled | Convert to spec destructive pattern |
| Back button: Secondary | ⚠️ Gray inline styled | Convert to spec secondary pattern |

**Net Changes**: Full restyling (inline → Tailwind), Card swap

---

#### Portfolio (`src/ui/pages/Portfolio.tsx`)
**Current State**: Inline styles, custom Card, position list.

| Spec Requirement | Current State | Action |
|------------------|---------------|--------|
| Header Card with totals | ⚠️ Custom Card, inline styles | Swap to shadcn Card, apply typography spec |
| Position list: Level 1 rows | ⚠️ Cards with left border | Convert to structured rows within single Card |
| If 10+ positions: Level 2 table | ❌ Not implemented | Add conditional table rendering (future) |
| P&L colors | ⚠️ Present but inline | Convert to Tailwind emerald-600/red-600 |
| Set Price input | ⚠️ Inline styled | Convert to spec input styling |
| Show closed toggle | ⚠️ Checkbox | Keep native checkbox (per spec) |

**Net Changes**: Full restyling, conditional table logic (can defer)

---

#### PositionDetail (`src/ui/pages/PositionDetail.tsx`)
**Current State**: Inline styles, custom Card, edit form.

| Spec Requirement | Current State | Action |
|------------------|---------------|--------|
| Standard Cards | ⚠️ Custom Card | Swap to shadcn Card |
| Position summary: spec typography | ⚠️ Partial compliance | Apply `font-mono tabular-nums` to numbers |
| P&L Breakdown: Inline Surface | ⚠️ Inline styled grid | Convert to Inline Surface pattern |
| Edit form: spec input styling | ⚠️ Inline styles | Convert to Tailwind |
| Archive button: Destructive | ⚠️ Red inline styled | Convert to spec pattern |
| LinkedItems | ✅ Present | No change |

**Net Changes**: Full restyling, Card swap

---

#### Thoughts (`src/ui/pages/Thoughts.tsx`)
**Current State**: Inline styles, custom Card, filter chips.

| Spec Requirement | Current State | Action |
|------------------|---------------|--------|
| Add thought form: Standard Card | ⚠️ Custom Card | Swap to shadcn Card |
| Thought list items: Inline Surface | ⚠️ Uses cards with left border | Convert to Inline Surfaces inside single Card |
| Filter chips | ⚠️ Purple inline styled | Convert to Ghost button pattern or remove (spec unclear) |
| Timestamp: `font-mono text-xs` | ⚠️ Partial | Apply consistently |
| Add button: Primary | ⚠️ Blue inline styled | Convert to spec primary |

**Net Changes**: Full restyling, layout restructure for Inline Surfaces

---

#### ThoughtDetail (`src/ui/pages/ThoughtDetail.tsx`)
**Current State**: Inline styles, custom Card, thread messages.

| Spec Requirement | Current State | Action |
|------------------|---------------|--------|
| Standard Cards | ⚠️ Custom Card | Swap to shadcn Card |
| Promote/Demote buttons | ⚠️ Inline styled | Convert to Primary/Ghost patterns |
| Thread messages | ⚠️ Inline styled list | Convert to Inline Surfaces |
| Add message form | ⚠️ Inline styled | Convert to spec input + Primary button |
| LinkedItems | ✅ Present | No change |

**Net Changes**: Full restyling, Card swap

---

#### NorthStar (`src/ui/pages/NorthStar.tsx`)
**Current State**: Inline styles, custom Card, simple display.

| Spec Requirement | Current State | Action |
|------------------|---------------|--------|
| Thesis display: font-serif | ❌ Uses default | Add font-serif class (or keep sans per corrected spec) |
| Standard Card | ⚠️ Custom Card | Swap to shadcn Card |
| Edit button: Ghost | ⚠️ Blue Link styled | Convert to Ghost button pattern |
| Actions list | ⚠️ Inline styled links | Convert to clickable Inline Surfaces |

**Net Changes**: Full restyling, Card swap

---

#### NorthStarEdit (`src/ui/pages/NorthStarEdit.tsx`)
**Current State**: Inline styles, custom Card, textarea form.

| Spec Requirement | Current State | Action |
|------------------|---------------|--------|
| Standard Cards | ⚠️ Custom Card | Swap to shadcn Card |
| Textarea: spec styling | ⚠️ Inline styled | Convert to Tailwind |
| ContextSelector | ✅ Present | Restyle internals to match spec |
| Save button: Primary | ⚠️ Blue inline styled | Convert to spec primary |
| Cancel: Secondary | ⚠️ Gray inline styled | Convert to spec secondary |

**Net Changes**: Full restyling, Card swap

---

#### NorthStarHistory (`src/ui/pages/NorthStarHistory.tsx`)
**Current State**: Inline styles, custom Card, version list.

| Spec Requirement | Current State | Action |
|------------------|---------------|--------|
| Standard Card wrapper | ⚠️ Custom Card | Swap to shadcn Card |
| Version rows: Level 1 structured | ⚠️ Clickable divs | Convert to structured clickable rows |
| CURRENT badge | ⚠️ Inline styled span | Standardize badge styling |
| Back button: Secondary | ⚠️ Gray Link styled | Convert to spec secondary |

**Net Changes**: Full restyling, Card swap

---

#### NorthStarVersionDetail (`src/ui/pages/NorthStarVersionDetail.tsx`)
**Current State**: Inline styles, custom Card, display-only.

| Spec Requirement | Current State | Action |
|------------------|---------------|--------|
| Standard Cards | ⚠️ Custom Card | Swap to shadcn Card |
| Current indicator: Inline Surface | ⚠️ Inline styled div | Convert to Inline Surface |
| Metadata grid | ⚠️ Inline styled | Convert to label/value Inline Surface |
| LinkedItems | ✅ Present | No change |
| Back link: Secondary button | ⚠️ Styled Link | Convert to spec secondary |

**Net Changes**: Full restyling, Card swap

---

#### Analytics (`src/ui/pages/Analytics.tsx`)
**Current State**: Placeholder with custom Cards.

| Spec Requirement | Current State | Action |
|------------------|---------------|--------|
| Placeholder cards | ⚠️ Custom Card | Swap to shadcn Card |
| "Coming soon" text | ✅ Present | No change |

**Net Changes**: Card swap only (minimal)

---

#### Settings (`src/ui/pages/Settings.tsx`)
**Current State**: Inline styles, custom Card, reset button.

| Spec Requirement | Current State | Action |
|------------------|---------------|--------|
| Standard Cards | ⚠️ Custom Card | Swap to shadcn Card |
| Theme toggle: Switch | ❌ Not implemented | Add shadcn Switch (future) |
| Reset button: Destructive | ⚠️ Red inline styled | Convert to spec destructive |
| Export placeholder | ✅ Present | No change |

**Net Changes**: Card swap, destructive button styling

---

#### Onboarding (`src/ui/pages/Onboarding.tsx`)
**Current State**: Inline styles, custom Card, two buttons.

| Spec Requirement | Current State | Action |
|------------------|---------------|--------|
| Standard Card | ⚠️ Custom Card | Swap to shadcn Card |
| Primary button | ⚠️ Blue inline styled | Convert to spec primary |
| Secondary button | ⚠️ Gray inline styled | Convert to spec secondary |

**Net Changes**: Card swap, button styling

---

#### About (`src/ui/pages/About.tsx`)
**Current State**: Inline styles, custom Card, static content.

| Spec Requirement | Current State | Action |
|------------------|---------------|--------|
| Standard Cards | ⚠️ Custom Card | Swap to shadcn Card |
| Lists | ⚠️ Inline styled `<ul>` | Convert to Tailwind list styling |

**Net Changes**: Card swap, minor text styling

---

#### Shared Components

| Component | Current State | Action |
|-----------|---------------|--------|
| `src/ui/components/Card.tsx` | Custom, inline styles | **Deprecate** — replace all usages with shadcn Card |
| `src/ui/components/PageHeader.tsx` | Inline styles | Convert to Tailwind classes matching spec typography |
| `src/ui/components/AppShell.tsx` | Inline styles, 480px max | Convert to Tailwind; **preserve 480px constraint** |
| `src/ui/components/BottomTabs.tsx` | Inline styles | Convert to Tailwind |
| `src/ui/components/ContextSelector.tsx` | Inline styles | Convert to Tailwind, use Inline Surface pattern |
| `src/ui/components/LinkedItems.tsx` | Inline styles, custom Card | Convert to Tailwind, swap to shadcn Card |

---

## 4. COMPONENT BUDGET CONFIRMATION

### Final Allowed List (Installed)
| Component | Status | Justification |
|-----------|--------|---------------|
| `button` | ✅ Installed | All interactive actions |
| `card` | ✅ Installed | Primary container for all content |
| `chart` | ✅ Installed | Dashboard historical graph |

### Must Install Before Implementation
| Component | Justification |
|-----------|---------------|
| `table` | Level 2 data density (Portfolio 10+ positions, Analytics transaction log) |
| `dialog` | Confirmation modals (delete, archive) — replaces `window.confirm()` |
| `switch` | Settings theme toggle |
| `select` | Form dropdowns (Journal action type, position selector) |
| `input` | Standardized text input styling |
| `textarea` | Standardized long-form input |
| `label` | Accessible form labels |
| `separator` | Section dividers within cards (rare use) |

### Installation Command
```bash
npx shadcn@latest add table dialog switch select input textarea label separator
```

### Forbidden (Confirmed)
All components listed in spec Section 10 "Forbidden Components" remain forbidden. No exceptions identified.

---

## 5. AGENT HAND-OFF PROMPT

```
You are implementing UI styling updates for the Behavioral Trading Companion app.

## CONTEXT
- The app is functional. Domain logic is DONE and must NOT change.
- Navigation is DONE and must NOT change.
- You are ONLY updating styling to match the UI System Specification.
- All pages currently use inline styles. You will convert them to Tailwind CSS.

## CONSTRAINTS (NON-NEGOTIABLE)
1. Do NOT add new features or pages
2. Do NOT change any business logic or data flow
3. Do NOT modify domain services or repositories
4. Do NOT change route structure or navigation
5. Do NOT add shadcn components beyond: button, card, chart, table, dialog, switch, select, input, textarea, label, separator
6. Preserve all existing functionality exactly

## PHASE 0: SETUP (Do First)
1. Install required shadcn components:
   ```
   npx shadcn@latest add table dialog switch select input textarea label separator
   ```
2. Verify build passes after installation
3. Do NOT proceed until build is green

## PHASE 1: SHARED COMPONENTS
Convert these files to Tailwind, one at a time:
1. `src/ui/components/PageHeader.tsx` — Apply: text-2xl font-semibold for title
2. `src/ui/components/AppShell.tsx` — Apply Tailwind classes; KEEP max-width: 480px
3. `src/ui/components/BottomTabs.tsx` — Apply Tailwind classes

After EACH file:
- Run `npm run build`
- Verify no errors
- Commit with message: "style: convert [filename] to Tailwind"

## PHASE 2: DASHBOARD (Reference Implementation)
File: `src/ui/pages/Dashboard.tsx`

This page is closest to spec. Make these adjustments:
1. Quick Access items: Change from `border shadow-sm` to `bg-zinc-50 dark:bg-zinc-800/50` (Inline Surface pattern)
2. Add orphan handling: If 5 items, last item gets `col-span-2` on mobile
3. Verify all dark mode variants are present
4. Run build, commit: "style: refine Dashboard to match spec"

## PHASE 3: CORE PAGES (One at a Time)
For each page, follow this pattern:

### Pattern for Each Page:
1. Read the current file completely
2. Replace custom `Card` import with shadcn `Card`:
   ```tsx
   import { Card } from '@/components/ui/card'
   ```
3. Convert all inline `style={{}}` to Tailwind `className=""`
4. Apply spec patterns:
   - Cards: `border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 md:p-6`
   - Inline Surfaces: `bg-zinc-50 dark:bg-zinc-800/50 rounded-md p-3 md:p-4`
   - Primary buttons: `bg-zinc-900 text-white hover:bg-zinc-800 h-11 px-6 rounded-lg font-medium`
   - Secondary buttons: `border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 h-11 px-6 rounded-lg`
   - Ghost buttons: `text-zinc-600 hover:bg-zinc-100 h-11 px-4 rounded-lg`
   - Destructive: `border border-red-600 text-red-600 hover:bg-red-50`
   - Labels: `text-sm font-medium text-zinc-700 dark:text-zinc-300`
   - Inputs: `w-full border border-zinc-300 rounded-lg px-4 py-3 focus:border-zinc-900 focus:ring-2`
   - Numbers: `font-mono tabular-nums`
   - P&L positive: `text-emerald-600 dark:text-emerald-400`
   - P&L negative: `text-red-600 dark:text-red-400`
5. Run build
6. Commit: "style: convert [PageName] to Tailwind + shadcn"

### Page Order:
1. Portfolio.tsx
2. PositionDetail.tsx
3. Journal.tsx
4. JournalDetail.tsx
5. Thoughts.tsx
6. ThoughtDetail.tsx
7. NorthStar.tsx
8. NorthStarEdit.tsx
9. NorthStarHistory.tsx
10. NorthStarVersionDetail.tsx
11. Settings.tsx
12. Analytics.tsx
13. Onboarding.tsx
14. About.tsx

## PHASE 4: SHARED UI COMPONENTS
1. `src/ui/components/ContextSelector.tsx` — Convert to Tailwind, use Inline Surface pattern
2. `src/ui/components/LinkedItems.tsx` — Convert to Tailwind, swap to shadcn Card

## PHASE 5: CLEANUP
1. Delete `src/ui/components/Card.tsx` (now unused)
2. Run full build
3. Run `npm run lint`
4. Fix any lint errors
5. Final commit: "chore: remove deprecated custom Card component"

## VERIFICATION AFTER EACH PHASE
- `npm run build` passes
- App renders without console errors
- Dark mode toggle works (if applicable)
- All pages remain functional
- No visual regressions in core flows

## IF BLOCKED
- If a conversion breaks functionality, STOP and report what broke
- If spec is unclear for a specific element, use the closest existing pattern
- If build fails, fix immediately before proceeding
- Do NOT skip verification steps

## OUTPUT FORMAT
After completing each phase, report:
1. Files modified
2. Build status (pass/fail)
3. Any deviations from spec (with justification)
4. Ready for next phase (yes/no)
```

---

**END OF EXECUTION-READY SPEC PACK**

This document is the single source of truth for UI implementation. Any changes must be reviewed and approved before implementation.
