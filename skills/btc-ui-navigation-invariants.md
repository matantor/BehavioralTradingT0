---
name: btc-ui-navigation-invariants
description: >
  Behavioral Trading Companion UI navigation guardrails for mobile-first UX.
  Use this skill when changing routes, tabs, dashboard navigation, or adding new pages.
version: 1.0.0
---

# BTC UI Navigation Invariants

## Purpose
Prevent navigation drift and keep the app usable on mobile while new pages/features are added.

This skill defines **invariants**, not a full sitemap.

---

## When to use this skill
Use when modifying:
- `src/App.tsx` routing
- `src/ui/components/BottomTabs.tsx`
- `src/ui/components/AppShell.tsx` layout shell
- any page that introduces new navigation entry points (Dashboard, Thesis, Portfolio, Journal)

---

## Invariants (must hold unless DECISIONS.md changes)
### Bottom tabs
- Bottom tabs are limited to **4** due to phone width constraints:
  1) Dashboard
  2) Thesis (North Star)
  3) Portfolio
  4) Journal
- Do not add additional tabs (e.g., Settings/Thoughts/Analytics) unless a new Decision is recorded.

### Non-tab pages
- Non-tab pages are allowed (Thoughts, Analytics, Link Items, About, Settings, detail pages).
- Non-tab pages should be reachable via:
  - Dashboard “Quick Access” links and/or
  - in-page links from relevant pillar pages
- Avoid burying essential flows behind multiple hops.

### Dashboard role
- Dashboard is a **hub**: it surfaces summaries and provides navigation.
- Dashboard should not become the primary place for editing everything.

### Mobile layout
- UI is mobile-first.
- Desktop must remain a centered phone-like container (max-width constraint) with bottom tabs aligned.

---

## Change protocol
If you need to break an invariant:
1) Update `DECISIONS.md` first (new dated bullet).
2) Then update this Skill to match the Decision.
3) Record the change in `SESSION_LOG.md` for the task that implemented it.
