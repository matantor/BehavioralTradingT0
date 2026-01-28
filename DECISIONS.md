# DECISIONS — Behavioral Trading Companion

Rules:
- Only record stable decisions that affect architecture, scope boundaries, or tooling.
- No task details. No summaries. No brainstorming.
- One decision = one bullet with date.

## Decisions

- 2026-01-05: Repo authority hierarchy is enforced by CLAUDE.md at top (CLAUDE.md > VERIFYING.md > PRD.md > PTD.md > TDD.md > TASKLIST.md).
- 2026-01-05: V1 stack: Node.js + Vite + React + TypeScript.
- 2026-01-05: Routing: React Router.
- 2026-01-05: Storage v1: localStorage-backed local JSON owned by repositories (UI → Services → Repos).
- 2026-01-05: Lint/tests: ESLint + Vitest.
- 2026-01-05: Canonical verification command: `npm run verify` runs lint → typecheck → test → build; smoke remains manual via `npm run dev`.
- 2026-01-05: Product constraints: deterministic offline app, no auth, no external APIs, no AI in v1.
- 2026-01-05: Cross-entity links must use RelationEdge only; threads exist per entity and are manual in v1.
- 2026-01-05: Soft delete strategy: all entities use `archivedAt?: string` (ISO8601 timestamp); no hard deletes, no boolean flags, repositories filter by default.
- 2026-01-08: Entity Envelope: all persisted entities must include id, createdAt, updatedAt, archivedAt? (full envelope).
- 2026-01-08: Extensibility Slot: all persisted entities use `meta?: Record<string, unknown>` for future fields; do not create parallel fields (no "metadata", "data", "attributes" etc.).
- 2026-01-08: Event Log: append-only Event entity + EventRepository/EventService exists for recording actions/intents/traces; stored under StorageData.events.
- 2026-01-08: Linking Convention: cross-entity links use RelationEdge; EntityRef.type is string (not closed union) for extensibility.
- 2026-01-08: Navigation: 4 bottom tabs (Dashboard, Thesis, Portfolio, Journal); Settings/About/Analytics/Thoughts are secondary pages accessible via links.
- 2026-01-08: Mobile-first layout: AppShell enforces max-width 480px phone container centered on desktop; BottomTabs fixed at bottom with same constraint.
- 2026-01-08: System Philosophy: The Behavioral Trading Companion is a meaning-preserving interpretation system, not a coach, advisor, or recommendation engine. It exists to preserve and connect user intent, actions, and reflections over time. Deterministic, manual-first behavior is foundational—not a temporary limitation—so that future interpretation (including AI-assisted reflection) operates only on explicit, user-authored data.
- 2026-01-12: In v1, journal entries explicitly distinguish action/decision entries from non-action reflections. This classification enables future action–intent gap analysis.
- 2026-01-12: In v1, every action/decision journal entry must explicitly capture intent context (NorthStar or explicit none) at entry time. No inference or retroactive linking is allowed.
