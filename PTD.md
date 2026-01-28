# PTD — Behavioral Trading Companion (Architecture)

## 1. Purpose
This document captures architectural intent and evolution constraints.
It is not a feature list or schema reference.

## 2. What the System Models

The Behavioral Trading Companion is a meaning-preserving system. Its purpose is to maintain a coherent, traceable representation of the user's intent, beliefs, actions, and reflections over time—and how they relate to each other.

The system models four dimensions simultaneously:

**Intent**
What the user believes, plans, and intends. Captured in NorthStar versions (thesis evolution), mini-theses (promoted thoughts with actionable status), and rationale embedded in thoughts and journal entries.

**Action**
What the user actually did. Captured in journal decisions and portfolio changes. Actions are always explicit user entries, never inferred.

**Reflection**
How the user thinks about what happened. Captured in journal reflections, threads attached to entities, and follow-up entries across time.

**Contextual Continuity**
How everything connects. Captured in relations between entities, version history (no silent overwrites), and the event log (append-only record of what occurred).

### Why the Architectural Primitives Exist

Each primitive serves the goal of preserving meaning across time:

- **Entities with envelopes** (id, createdAt, updatedAt, archivedAt) ensure every piece of data is traceable and never silently mutated.
- **Versions** (NorthStar, and potentially others) preserve the evolution of intent rather than overwriting it.
- **Threads** allow chronological reflection attached to any entity without polluting the entity itself.
- **Relations** (RelationEdge) make connections explicit and queryable rather than buried in ad-hoc foreign keys.
- **Events** provide an append-only log of what happened, enabling future reconstruction of the user's journey.

### Connection Is the System's Responsibility

The system owns connection. It notices and surfaces meaning continuity automatically, using deterministic rules applied to explicit, user-authored data.

Three layers of connection exist:

1. **Structural rails** (Layer 1): Entities, stable IDs, versions, events, RelationEdge, threads. This layer answers: "Can meaning be connected at all?"

2. **System-level connection** (Layer 2): The system automatically detects temporal proximity, shared entity references, and narrative continuity. These connections are deterministic, visible, and explainable. No user action required. This layer answers: "What does the system think is connected?"

3. **User correction** (Layer 3): Only when the system missed something or misinterpreted, the user may link, override, or clarify. This is corrective, not foundational. This layer answers: "The system got this wrong — here's what I meant."

The user is not responsible for constructing the connection graph. Manual linking is a fallback, not the primary mechanism.

### The Role of Future AI

Any future AI layer operates as a **reader and interpreter** of this structure—not an author.

The AI does not:
- Decide what the user should do
- Generate recommendations
- Modify user-authored data

The AI reflects:
- Tensions between stated intent and actual behavior
- Inconsistencies across time
- Repeated patterns
- Alignment or misalignment with the user's own stated beliefs

The deterministic, manual-first MVP ensures that when AI arrives, it has clean, explicit, user-authored structures to interpret—not a mix of human and machine-generated content.

## 3. Architectural Principles
- Deterministic now, intelligent later
- Manual entry first, AI augmentation later
- Explicit relationships, no hidden inference
- Explainability preserved at every stage

## 4. Storage Strategy
v1:
- Local JSON (single logical store)
- No background sync
- Resettable seed data

Future:
- SQLite / Supabase
- Same repository interfaces

## 5. Portfolio Philosophy
- Portfolio represents current state
- State originates from:
  - optional initial snapshot
  - explicit user actions
- Journal provides narrative + optional structured actions
- No silent state mutation

## 6. Threads
- Every entity may have a thread
- Threads store chronological messages
- Messages are manual in v1
- AI may append later, never overwrite

## 7. Relations (Context Graph)
- All cross-entity connections use RelationEdge
- No ad-hoc foreign key arrays
- Graph traversal later builds on same structure

## 8. Analytics & Explainability
- Analytics results are stored objects
- Every result has:
  - inputs used
  - method identifier
  - steps list
- Later AI tools attach traces to same record

## 9. Forbidden Shortcuts
- No computing state inside UI
- No implicit linking
- No overwriting historical facts

## 10. Context Capture (v1)

In v1, the system captures meaning through **explicit user-declared context** at entry time. This is the foundation for all cross-entity connections.

### Core Rules

1. **No inference from free text**: The system NEVER parses content fields to infer links, entities, or relationships. If a user mentions "AAPL" in a journal entry, no automatic link to a position is created.

2. **Context is declared at entry time**: All cross-entity meaning originates from explicit user selections at the moment of creation or edit. The system does not retroactively attach context.

3. **Lightweight and optional**: Context capture is a small, optional step during entry—not a mandatory form. The user may skip it entirely.

4. **Relations are derived, not constructed**: RelationEdges are automatically derived from declared context anchors. The user does not manually build a graph; they simply indicate "this relates to X" and the system records the connection.

### Context Anchors

When creating or editing an entity, the user may declare **context anchors**—references to other entities that provide meaning to this entry.

- Context anchors are stored in `meta.contextAnchors[]` as `EntityRef` objects
- Each anchor may include a `role` (e.g., "subject", "reference", "rationale")
- The system derives RelationEdges from these anchors deterministically
- No duplicates: if a relation already exists, no new edge is created

### Journal Entry Classification

Journal entries are classified by intent:

- **Action/Decision entries** (`type: 'decision'`): Represent an intended or executed action. These entries require intent context.
- **Non-action entries** (`type: 'reflection' | 'note'`): Reflections, observations, or notes. Intent context is optional.

This classification preserves the data needed for future action–intent gap analysis without introducing analytics, alerts, or review rituals in v1.

### Intent Context Requirement

Every action/decision journal entry must capture intent context at entry time:

- Either: Reference to the currently active NorthStar version
- Or: Explicit declaration of "no related thesis"

This intent snapshot is stored via `meta.contextAnchors` and derived into RelationEdges. There is:
- No default assumption
- No inference from content
- No retroactive attachment

If the user does not provide intent context for an action entry, the form must prompt for it before saving.
