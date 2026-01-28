# TDD — Behavioral Trading Companion (Local JSON v1)

## 1. Core Entities
(IDs = UUID, timestamps = ISO8601)

### Position
- id (UUID)
- ticker (string, required)
- name? (string, optional)
- assetType? ('equity' | 'etf' | 'crypto' | 'cash' | 'other')
- quantity (number, >= 0)
- avgCost (number, average cost basis)
- currency (string, default 'USD')
- openedAt? (ISO8601)
- closedAt? (ISO8601, indicates position is closed)
- notes? (string)
- rationale? (string)
- archivedAt? (ISO8601, soft delete)
- createdAt (ISO8601)
- updatedAt (ISO8601)

### JournalEntry
- id (UUID)
- type ('decision' | 'reflection' | 'note')
- title (string, required)
- content (string, required)
- portfolioAction? (optional, see PortfolioAction below)
- archivedAt? (ISO8601, soft delete)
- createdAt (ISO8601, canonical timestamp in v1)
- updatedAt (ISO8601)

Note: In v1, `createdAt` is the canonical timestamp. If user mentions "yesterday", capture as text in `content`. An `occurredAt` field may be added later.

### PortfolioAction (embedded in JournalEntry)
- actionType ('buy' | 'sell' | 'set_position' | 'close_position')
- positionId? (string, for buy/sell/close)
- ticker? (string, for set_position / create-if-missing)
- quantity (number)
- price (number)
- fees? (number)
- executedAt? (ISO8601)
- note? (string)

### Thought
- id (UUID)
- content (string, required)
- archivedAt? (ISO8601, soft delete)
- createdAt (ISO8601)
- updatedAt (ISO8601)
- meta? (Record<string, unknown>, extensibility slot)

**Thought/Mini-thesis distinction**: Thoughts and Mini-theses are both stored as Thought entities. The `meta.kind` field distinguishes them:
- `meta.kind === 'thought'` or missing: exploratory thought (default)
- `meta.kind === 'mini_thesis'`: promoted to mini-thesis (actionable/monitorable)

### ThesisVersion (renamed from NorthStarVersion in code)
- id (UUID)
- content (string, the thesis statement)
- changeNote? (string, optional reason for change)
- createdAt (ISO8601)
- updatedAt (ISO8601)
- archivedAt? (ISO8601, soft delete)
- meta? (Record<string, unknown>, extensibility slot)

### NorthStar (singleton state, with full envelope)
- id (UUID)
- currentVersionId (string, points to latest ThesisVersion)
- createdAt (ISO8601)
- updatedAt (ISO8601)
- archivedAt? (ISO8601, soft delete)
- meta? (Record<string, unknown>, extensibility slot)

### ThreadMessage
- id (UUID)
- entityRef { type, id } (reference to parent entity)
- content (string, required)
- createdAt (ISO8601)
- updatedAt (ISO8601)
- archivedAt? (ISO8601, soft delete)
- meta? (Record<string, unknown>, extensibility slot)

EntityRef structure:
- type (string, extensible — common values: 'position', 'journal', 'thought', 'thesis', 'event')
- id (string, UUID of referenced entity)

### ContextAnchor (stored in meta.contextAnchors[])
Per PTD.md Section 10: context anchors capture explicit user-declared relationships at entry time.
- entityType (string, type of referenced entity)
- entityId (string, UUID of referenced entity)
- role? (string, optional — e.g., "subject", "reference", "rationale", "intent")

Context anchors are stored in the `meta.contextAnchors[]` array of any entity. The system derives RelationEdges from these anchors deterministically. No inference from free text.

### RelationEdge
- id (UUID)
- fromRef { type, id } (source entity reference)
- toRef { type, id } (target entity reference)
- relationType ('related' | 'supports' | 'contradicts' | 'context')
- createdAt (ISO8601)
- updatedAt (ISO8601)
- archivedAt? (ISO8601, soft delete)
- meta? (Record<string, unknown>, extensibility slot)

### Event (append-only log)
File: `src/domain/types/entities.ts`
- id (UUID)
- type (string, event type identifier e.g. 'user.action', 'trade.executed')
- at (ISO8601, when the event occurred)
- refs (EntityRef[], entities this event relates to)
- payload? (Record<string, unknown>, event-specific data)
- createdAt (ISO8601)
- updatedAt (ISO8601)
- archivedAt? (ISO8601, soft delete)
- meta? (Record<string, unknown>, extensibility slot)

### OnboardingState (singleton)
File: `src/domain/types/entities.ts`
- completedAt? (ISO8601, when onboarding was completed)
- skippedAt? (ISO8601, when onboarding was skipped)

Note: OnboardingState is stored in StorageData.onboarding (not a collection). A user has completed onboarding if either completedAt or skippedAt is set.

## 2. Service Layer Contracts
(UI calls these)

- onboarding.get() — returns OnboardingState | null
- onboarding.isCompleted() — returns true if completedAt or skippedAt is set
- onboarding.complete() — sets completedAt timestamp, returns state
- onboarding.skip() — sets skippedAt timestamp, returns state
- northStar.getCurrent()
- northStar.createVersion(content, changeNote?, meta?)
- northStar.listVersions()
- positions.list(status?)
- positions.get(id)
- positions.create(payload)
- positions.update(id, patch)
- journal.list(filter?)
- journal.get(id)
- journal.create(payload)
- journal.update(id, patch)
- journal.archive(id)
- journal.executePortfolioAction(journalId, action) — executes portfolio action from decision entry; creates/updates Position, saves portfolioAction, creates RelationEdge, emits Event; returns { journalEntry, position, eventId }
- thoughts.list()
- thoughts.get(id)
- thoughts.create(payload)
- thoughts.update(id, patch)
- thoughts.updateKind(id, kind) — kind: 'thought' | 'mini_thesis'
- threads.getMessages(entityRef)
- threads.addMessage(entityRef, content)
- relations.listForEntity(entityRef)
- relations.findExisting(fromRef, toRef, relationType) — returns existing edge or null (idempotency check)
- relations.create(fromRef, toRef, relationType, meta?)
- relations.deriveFromAnchors(sourceRef, anchors[], relationType?) — derives RelationEdges from ContextAnchors; idempotent, emits 'relation.derived' events; returns { created: RelationEdge[], skipped: number }
- events.list()
- events.listByType(type)
- events.listForEntity(entityRef)
- events.get(id)
- events.create(type, refs, payload?, at?)
- events.archive(id)
- analytics.runBasic()
- settings.resetData()

## 3. Validation Rules
- quantity ≥ 0
- journal type must be valid enum ('decision' | 'reflection' | 'note')
- derived fields never overwrite user input
- all timestamps must be valid ISO8601 strings
- all IDs must be valid UUIDs
- archivedAt is used for soft deletion (no hard deletes)

## 4. Verification Matrix
(see VERIFYING.md for execution)
- routing
- storage
- portfolio aggregation
- journal filters
- thesis versioning
- relations integrity

## 5. Storage & Migration
File: `src/lib/storage/storage.ts`

**Schema Version**: 3 (current)

**Storage Key**: `behavioral-trading-v1` (localStorage)

**Collections** (all stored as `Record<string, Entity>`):
- positions, journalEntries, thoughts, thesisVersions, northStar, threadMessages, relationEdges, events

**Singletons**:
- onboarding (OnboardingState | null)

**Migration Behavior**:
- On load, if `schemaVersion < SCHEMA_VERSION`, `migrateData()` is called and result saved
- Future versions (`schemaVersion > SCHEMA_VERSION`) are preserved as-is (forward compatibility)

**v1 → v2 Migration** (implemented):
- Adds `events: {}` collection if missing
- Adds `updatedAt` to ThesisVersion, ThreadMessage, RelationEdge (set to createdAt)
- Adds full envelope to NorthStar (id, createdAt, updatedAt)
- Renames `RelationEdge.metadata` → `RelationEdge.meta` (value preserved, old field deleted)

**v2 → v3 Migration** (implemented):
- Adds `onboarding: null` field if missing

**Migration Rules**:
- Migrations must be idempotent (safe to run multiple times)
- Never introduce parallel extensibility fields (use `meta` only, not `metadata`/`data`/`attributes`)
