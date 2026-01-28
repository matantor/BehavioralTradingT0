---
name: btc-dev-workflow
description: >
  Behavioral Trading Companion (Vite + React + TS) development workflow and repo navigation.
  Use this skill when implementing features, wiring UI pages to services, changing domain types,
  editing storage/migrations, adding tests, or updating project docs/session logs.
version: 1.0.0
---

# BTC Dev Workflow (Repo Navigation + Guardrails)

## Purpose
Provide stable, repeatable guidance for implementing features in this repo without breaking:
- architecture boundaries (UI → Services → Repositories → Storage)
- entity conventions (envelope + meta)
- verification discipline (`npm run verify`)
- documentation hygiene (SESSION_LOG/TDD/DECISIONS)

This skill is about **how to work in this codebase**, not product brainstorming.

---

## When to use this skill
Use this skill whenever the request involves:
- wiring or editing UI pages (`src/ui/pages/**`)
- routing, tabs, layout (`src/App.tsx`, `src/ui/components/**`)
- creating/updating domain entities/types (`src/domain/types/**`)
- changing services/repositories (`src/domain/services/**`, `src/domain/repositories/**`)
- storage or migrations (`src/lib/storage/storage.ts`)
- tests (`tests/unit/**`)
- updating PRD/PTD/TDD/DECISIONS/SESSION_LOG

---

## Non-negotiable guardrails
### Architecture boundaries
- UI imports **services only** (`@/domain/services`). UI must not import repositories or storage.
- Services call repositories only (no direct storage access in services).
- Repositories are the only layer that reads/writes storage.

### Persistence + determinism
- Offline-only, deterministic behavior.
- No network calls, auth, or AI features unless explicitly added by PRD/DECISIONS.

### Entity envelope (persisted entities)
All persisted entities must include:
- `id: string`
- `createdAt: string` (ISO8601)
- `updatedAt: string` (ISO8601)
- `archivedAt?: string` (soft delete only)

### Extensibility slot
- Use **only** `meta?: Record<string, unknown>` for future/extra fields.
- Do not introduce parallel extensibility fields (no `metadata`, `data`, `attributes`, etc.).

### Soft delete only
- Archive via `archivedAt` timestamp.
- No hard deletes; no boolean `isDeleted` flags.

### Relations
- Cross-entity linking uses `RelationEdge` only.
- Entity references use `EntityRef` with `type: string` and `id: string`.

### Event log
- Event log is append-only for recording actions/traces/history.
- Do not mutate historical events except soft-archiving if supported.

---

## Repo navigation map (where to edit)
### UI / App shell
- Routes and route map: `src/App.tsx`
- Bottom tab navigation: `src/ui/components/BottomTabs.tsx`
- Phone-like centered layout / max width: `src/ui/components/AppShell.tsx`
- Shared UI wrappers: `src/ui/components/*`
- Pages: `src/ui/pages/*`

### Domain
- Entity types: `src/domain/types/entities.ts`
- Services (UI calls these): `src/domain/services/*`
- Service exports: `src/domain/services/index.ts`
- Repositories (services call these): `src/domain/repositories/*`

### Storage + migration
- Storage schema + load/save + migration: `src/lib/storage/storage.ts`
  - Increment `schemaVersion` only when needed
  - Ensure migration is idempotent and preserves unknown future fields

### Tests
- Unit tests: `tests/unit/**`
  - Repos: `tests/unit/repositories/*`
  - Services: `tests/unit/services/*`
  - Storage: `tests/unit/storage.test.ts`

---

## Standard implementation workflow (use every time)
1) **Read first**
   - Identify the exact pages/services/repos involved.
   - Confirm existing patterns in adjacent files (don’t invent new style).

2) **Implement smallest vertical slice**
   - UI uses service methods
   - Service uses repo methods
   - Repo persists via storage

3) **Update/add tests**
   - Add tests for new service/repo behavior.
   - If a change affects storage shape or migration, update storage tests.

4) **Run verification**
   - Always run: `npm run verify`
   - Do not claim completion without a passing verify.

5) **Update docs**
   - `SESSION_LOG.md`: append a new session/task entry describing:
     - goal, work completed, files changed, verification results
   - `TDD.md`: update only if schemas/service contracts/storage/migration behavior changed.
   - `DECISIONS.md`: update only for stable architecture/tooling/scope-boundary decisions.

---

## UI wiring patterns (preferred)
- Load data on mount using `useEffect`.
- Keep state local to the page unless it becomes shared across pages.
- Provide clear empty states (“No items yet…”).
- Respect mobile-first layout (AppShell container + BottomTabs fixed).

---

## Testing patterns (preferred)
- Repository tests cover:
  - CRUD + archive behavior
  - sorting/filters if implemented there
  - persistence round-trip
- Service tests cover:
  - validation
  - contract behavior (calls repo correctly, returns expected shapes)
- Storage tests cover:
  - schemaVersion behavior
  - migration behavior (including legacy field normalization)
  - forward compatibility (unknown fields preserved where appropriate)

---

## “Done” checklist (must satisfy)
- [ ] All relevant files were read before modifying
- [ ] Architecture boundaries preserved (no UI→repo imports)
- [ ] Entity envelope/meta conventions preserved
- [ ] Tests added/updated as needed
- [ ] `npm run verify` passes
- [ ] `SESSION_LOG.md` updated
- [ ] `TDD.md` updated only if contracts/schemas changed
- [ ] `DECISIONS.md` updated only if a stable decision was introduced
