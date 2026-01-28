# AUTHORITY & DOCUMENT HIERARCHY (NON-NEGOTIABLE)

This file (CLAUDE.md) is the highest authority in this repository.

All actions, planning, and implementation MUST follow this hierarchy
and may not violate a higher-level document to satisfy a lower-level one.

Authoritative order:

1) CLAUDE.md — Rules of engagement and authority
2) VERIFYING.md — Verification contract (how correctness is proven)
3) PRD.md — User-facing behavior and scope
4) PTD.md — Architectural intent and evolution constraints
5) TDD.md — Schemas, service contracts, invariants
6) TASKLIST.md — Current tasks (must comply with all above)

If a conflict exists:
- Stop
- Report the conflict
- Propose a document update
- Do NOT guess

# CLAUDE.md — Behavioral Trading Companion

## Role
You are Claude Code operating on the Behavioral Trading Companion project.

Your job is to implement features deterministically, preserve architectural intent, and verify correctness before claiming completion.

## Non-Negotiable Rules
- Do not invent features outside PRD/PTD/TDD.
- Do not bypass domain services or repositories.
- Do not overwrite user-entered facts with derived computations.
- Do not mark work as done without verification (see VERIFYING.md).

## Source of Truth Order (Reference-First)
1. PRD.md — User-facing behavior and flows
2. PTD.md — Architectural intent and evolution constraints
3. TDD.md — Schemas, service contracts, invariants
4. VERIFYING.md — How correctness is proven

If a conflict appears:
→ Update documents first, then code.

## Architecture Rules
- UI components call domain services only.
- Domain services call repositories only.
- Repositories own persistence (local JSON in v1).
- Relations are modeled exclusively via RelationEdge.
- Threads exist per entity and store manual messages only in v1.
- Claude must treat all files under `/skills` as standing architectural and behavioral constraints and apply them when relevant during planning, implementation, and documentation updates.

Transitional Rule (Early Tasks):
- Until a domain service layer exists, UI components may render static placeholders
  or read route params only.
- UI must NOT access repositories directly.
- No business logic is allowed in UI.


## Determinism Rule
The app must function correctly with:
- no AI
- no network
- no external APIs
- no background jobs

## Continuity Files
- DECISIONS.md: stable decisions only (append-only)
- SESSION_LOG.md: append-only short session summaries
When a task is completed, update SESSION_LOG.md and DECISIONS.md if a new stable decision was made.

## TASKLIST Semantics (Non-Negotiable)

TASKLIST.md represents the **single active task only**.

Rules:
- TASKLIST.md must contain exactly ONE task at any time.
- Completed tasks are NEVER kept in TASKLIST.md.
- When a task is completed:
  - Results are recorded in SESSION_LOG.md
  - Any new stable decisions go to DECISIONS.md
  - TASKLIST.md is then OVERWRITTEN with the next task
- TASKLIST.md is NOT a backlog, history, or roadmap.

If TASKLIST.md contains more than one task, Claude must:
- Stop
- Overwrite TASKLIST.md to contain only the current active task
- Do not preserve previous tasks in the file

Implementation Rule:
- During task implementation, Claude must NOT modify TASKLIST.md.
- TASKLIST.md is updated ONLY by the user between tasks.
- Task completion is recorded in SESSION_LOG.md (always) and DECISIONS.md (only if needed).


## Completion Rule
You may not claim a task is complete unless:
- Verification has been run and reported (VERIFYING.md)
- All affected docs remain consistent
