# PRD — Behavioral Trading Companion

## 1. Product Vision
A mobile-first behavioral investing companion that helps users:
- define a long-term thesis (NorthStar)
- track portfolio positions
- log decisions and reflections
- connect thoughts, actions, and assets
- observe behavioral patterns over time

## 2. Scope (v1)

### Included
- Onboarding (define or skip thesis)
- Dashboard (portfolio summary, north star card, quick access list)
- Portfolio (list, add/edit, position detail)
- Journal (list, add, filters, search, detail)
- Thoughts & Theses (list, add, threaded detail)
- NorthStar (home, edit creates version, history, version detail)
- Link Items (manual relationships)
- Analytics (deterministic metrics + explainability)
- Settings (reset data, secondary navigation)
- About (methodology)

### Navigation Structure
Bottom tabs (4 pillars):
1. Dashboard → /dashboard
2. Thesis → /northstar
3. Portfolio → /portfolio
4. Journal → /journal

Secondary pages (accessible via links, not tabs):
- Settings, About, Analytics, Thoughts, Link Items, position/journal/thought details

### Excluded
- live prices
- broker sync
- alerts
- AI generation
- automated analytics or P&L
- evaluation rituals or review prompts
- retroactive linking or inference

### Journal Entry Behavior

Journal entries are classified by type:

**Action/Decision entries** (`type: 'decision'`)
- Represent an intended or executed trading action
- Require intent context at entry time:
  - Either: link to the current NorthStar thesis
  - Or: explicit "no related thesis" declaration
- This requirement ensures future action–intent gap analysis is possible

**Non-action entries** (`type: 'reflection' | 'note'`)
- Observations, reflections, or general notes
- Intent context is optional
- May link to positions, thoughts, or thesis as context

**Context capture rules:**
- Context is declared at entry time, not retroactively attached
- No inference from free text (mentioning "AAPL" does not auto-link)
- All links are explicit user selections

## 3. Authoritative Route Map
- `/` → redirect to /onboarding
- `/onboarding`
- `/dashboard`
- `/portfolio`
- `/positions/:id`
- `/journal`
- `/journal/:id`
- `/thoughts`
- `/thoughts/:id`
- `/northstar`
- `/northstar/edit`
- `/northstar/history`
- `/northstar/versions/:id`
- `/link-items`
- `/analytics`
- `/settings`
- `/about`

## 4. User Guarantees
- Everything is pressable.
- History is never silently lost.
- No action is inferred without explicit user input.
- Portfolio state is always explainable.
