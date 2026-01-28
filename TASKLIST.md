# TASKLIST — Behavioral Trading Companion

# TASK: Core Usage Completion (Manual-First MVP Usability)

## Objective
Make the app fully usable day-to-day with manual entry, deterministic behavior, and no AI.
Focus: complete missing core flows, reduce friction, and ensure the user can reliably use:
NorthStar → Journal → Portfolio → Thoughts → Linked Items.

## Constraints (Must Hold)
- Offline-only (localStorage)
- No AI, no inference, no heuristics
- Explicit user-authored data only
- Deterministic behavior
- UI → Services → Repositories only
- Soft-delete only (archivedAt)
- Relations only via contextAnchors → derived RelationEdges

---

## Part A — Onboarding Flow Completion

1. Implement onboarding logic (not just UI):
   - Persist “hasCompletedOnboarding” (or equivalent) in app state/storage
   - Support: create NorthStar now OR skip
   - If skipped: dashboard still works and shows “No thesis yet” with CTA to create
   - Ensure returning users bypass onboarding

2. Add/verify navigation rules:
   - First-run route goes to onboarding
   - After completion, default route goes to dashboard
   - No broken routes / loops

---

## Part B — Journal Core Flow Completion

3. Ensure JournalDetail is complete and consistent:
   - Displays full entry fields, kind, timestamps
   - Shows captured contextAnchors and LinkedItems
   - Supports edit flow (if editing exists in app) without losing anchors
   - Supports archive (soft delete) from detail (if archiving exists elsewhere)

4. Portfolio actions embedded in journal entries (manual-first):
   - In Journal entry create/edit:
     - Optional “Portfolio Action” section for decision/action kind entries:
       - Action type: Buy / Sell / Adjust
       - Target: select existing Position OR create new Position inline
       - Quantity and price (or minimal fields consistent with Position model)
     - On save:
       - Persist journal entry
       - Apply portfolio change deterministically via service(s)
       - Emit Events for both journal + portfolio changes
       - Ensure RelationEdges still derived from anchors

5. Validation rules (must be deterministic):
   - If kind = decision/action and portfolio action is provided:
     - required fields validated
     - disallow invalid sells (e.g., sell more than holding) OR define deterministic rule (reject)
   - If kind = reflection/note:
     - portfolio action section hidden or disabled

---

## Part C — Portfolio Core Flow Completion

6. Ensure PositionDetail is complete for daily use:
   - Shows position fields clearly
   - Shows LinkedItems and supports navigating to linked journal entries/thoughts
   - Archive from detail (if not already)

7. Ensure portfolio edits do not break journal linkage:
   - If a position is edited/archived, LinkedItems still resolves gracefully
   - Derived relations remain intact (no inference)

---

## Part D — Settings Completion (Safety)

8. Implement Settings “Reset Data” wiring:
   - Clear localStorage in a deterministic way
   - Confirm step to prevent accidental wipe
   - After reset: return to onboarding (fresh start)
   - Tests for reset behavior if applicable

---

## Part E — UX Friction Pass (No New Features)

9. Consistency pass across forms:
   - Standardize labels: “Decision/Action” vs “Reflection/Note”
   - Ensure ContextSelector behavior is consistent across Journal/Thought/NorthStar
   - Ensure “No related thesis” is clearly selectable for decision/action entries

10. Smoke-test checklist (manual):
   - Fresh start → onboarding → create thesis → dashboard shows thesis
   - Create decision journal entry with required intent + context
   - Create decision journal entry with portfolio action; verify position updates
   - Open PositionDetail → see LinkedItems → open linked JournalDetail
   - Create thought + link to position → verify LinkedItems on both sides
   - Reset data → onboarding again

---

## Completion Criteria
- Onboarding logic works (create or skip) and persists
- JournalDetail supports real daily review + (if applicable) edit/archive without losing anchors
- Portfolio actions can be performed through Journal entries deterministically
- PositionDetail + LinkedItems navigation supports day-to-day review
- Settings reset works safely
- `npm run verify` passes
- SESSION_LOG.md updated
