# UI System Spec Patches

This document tracks accepted patches to the UI System Specification to resolve contradictions, ambiguities, and missing definitions identified during the spec review.

---

## Patch Status Summary

| Patch | Description | Status |
|-------|-------------|--------|
| 1 | Resolve Dashboard Chart Contradiction | **ACCEPTED** |
| 2 | Fix Card Radius to Match Installed shadcn | **ACCEPTED** |
| 3 | Clarify Journal Page Is Trade Entry System | **ACCEPTED** |
| 4 | Add Font-Serif for Reflective Content | **ACCEPTED** |
| 5 | Add Missing Page Specifications | **ACCEPTED** |
| 6 | Acknowledge AppShell Mobile Constraint | **ACCEPTED** |
| 7 | Add Missing Components to "Must Install" List | **ACCEPTED** |
| 8 | Define Quick Access Orphan Handling | **ACCEPTED** |

---

## Patch Details

### Patch 1: Resolve Dashboard Chart Contradiction
**Status**: ACCEPTED

**Issue**: Section 11 says "Don't add charts to Dashboard" but Dashboard has existing historical graph.

**Resolution**: Clarify that the existing Portfolio Summary historical graph is the only allowed chart on Dashboard. No new charts may be added.

---

### Patch 2: Fix Card Radius to Match Installed shadcn
**Status**: ACCEPTED

**Issue**: Spec says `rounded-lg (8px)` but installed shadcn card uses `rounded-xl (12px)`.

**Resolution**: Accept `rounded-xl` as the standard card radius. Update forbidden list to `rounded-2xl` and larger.

---

### Patch 3: Clarify Journal Page Is Trade Entry System
**Status**: ACCEPTED

**Issue**: Spec describes Journal as prose content, but actual app is a trading journal with structured trade entries.

**Resolution**: Update Journal spec to reflect trade entry system with:
- Action badges (buy=emerald, sell=red, long=blue, short=amber, deposit/withdraw=violet)
- Structured data display (ticker, quantity, price, value)
- Level 1 density (not Level 0)

---

### Patch 4: Add Font-Serif for Reflective Content
**Status**: ACCEPTED

**Issue**: Spec only defines font-sans and font-mono, but Dashboard already uses font-serif for thesis.

**Resolution**: Add font-serif as allowed for:
- North Star thesis display (read-only)
- Thought content display (optional)

---

### Patch 5: Add Missing Page Specifications
**Status**: ACCEPTED

**Issue**: Four pages exist in repo but are absent from spec:
- Onboarding
- NorthStarHistory
- NorthStarVersionDetail
- About

**Resolution**: Add specifications for all four pages to prevent drift.

---

### Patch 6: Acknowledge AppShell Mobile Constraint
**Status**: ACCEPTED

**Issue**: Spec defines responsive breakpoints (768px, 1024px, 1280px) but AppShell enforces 480px max-width globally.

**Resolution**: Document that 480px mobile-fidelity mode is intentional for MVP. Do not modify AppShell width constraints during this implementation phase.

---

### Patch 7: Add Missing Components to "Must Install" List
**Status**: ACCEPTED

**Issue**: Spec allows components that aren't installed (table, dialog, switch, select).

**Resolution**: Add explicit "must install" section with command:
```bash
npx shadcn@latest add table dialog switch select input textarea label separator
```

---

### Patch 8: Define Quick Access Orphan Handling
**Status**: ACCEPTED

**Issue**: Dashboard Quick Access has 5 items in a 2-column grid, creating an orphan. No guidance provided.

**Resolution**: Last item spans full width on mobile (`col-span-2`) when odd number of items.

---

## Implementation Notes

All patches are now considered part of the authoritative spec for implementation purposes. The original UI System Specification should be read with these patches applied.

When in doubt, refer to:
1. This patches document
2. The Execution Spec Pack (docs/UI_EXECUTION_SPEC_PACK.md)
3. Existing working code patterns (especially Dashboard.tsx)

---

**Last Updated**: Session implementing UI system refactor
