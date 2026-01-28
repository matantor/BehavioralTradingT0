// Domain Entity Types for Behavioral Trading Companion v1
// Per TDD.md: UUIDs for IDs, ISO8601 for timestamps, archivedAt for soft deletes

// Helper: UUID generation
export function generateUUID(): string {
  return crypto.randomUUID()
}

// Helper: ISO8601 timestamp generation
export function generateTimestamp(): string {
  return new Date().toISOString()
}

// EntityRef: structured reference to entities (used by ThreadMessage, RelationEdge, Event)
// type is a string to allow future entity types without schema changes
export interface EntityRef {
  type: string
  id: string
}

// ContextAnchor: declared context reference stored in meta.contextAnchors[]
// Used to capture explicit user-declared relationships at entry time
// Per PTD.md Section 10: relations are derived from these, not manually constructed
export interface ContextAnchor {
  entityType: string
  entityId: string
  role?: string // e.g., "subject", "reference", "rationale", "intent"
}

// Position: represents a portfolio position
export interface Position {
  id: string
  ticker: string
  name?: string
  assetType?: 'equity' | 'etf' | 'crypto' | 'cash' | 'other'
  quantity: number
  avgCost: number
  currency: string
  openedAt?: string
  closedAt?: string
  notes?: string
  rationale?: string
  archivedAt?: string
  createdAt: string
  updatedAt: string
  meta?: Record<string, unknown>
}

// PortfolioAction: embedded in JournalEntry
export interface PortfolioAction {
  actionType: 'buy' | 'sell' | 'set_position' | 'close_position'
  positionId?: string
  ticker?: string
  quantity: number
  price: number
  fees?: number
  executedAt?: string
  note?: string
}

// JournalEntry: decision, reflection, or note
export interface JournalEntry {
  id: string
  createdAt: string
  updatedAt: string
  type: 'decision' | 'reflection' | 'note'
  title: string
  content: string
  portfolioAction?: PortfolioAction
  archivedAt?: string
  meta?: Record<string, unknown>
}

// Thought: standalone thought or idea
export interface Thought {
  id: string
  createdAt: string
  updatedAt: string
  content: string
  archivedAt?: string
  meta?: Record<string, unknown>
}

// ThesisVersion: a version of the NorthStar thesis
export interface ThesisVersion {
  id: string
  createdAt: string
  updatedAt: string
  content: string
  changeNote?: string
  archivedAt?: string
  meta?: Record<string, unknown>
}

// NorthStar: singleton state tracking current thesis (with full envelope for future-proofing)
export interface NorthStar {
  id: string
  currentVersionId: string
  createdAt: string
  updatedAt: string
  archivedAt?: string
  meta?: Record<string, unknown>
}

// ThreadMessage: message in an entity's thread
export interface ThreadMessage {
  id: string
  entityRef: EntityRef
  createdAt: string
  updatedAt: string
  content: string
  archivedAt?: string
  meta?: Record<string, unknown>
}

// RelationEdge: relationship between two entities
// relationType kept as union for common cases; meta allows arbitrary link payloads
export interface RelationEdge {
  id: string
  fromRef: EntityRef
  toRef: EntityRef
  relationType: 'related' | 'supports' | 'contradicts' | 'context'
  createdAt: string
  updatedAt: string
  archivedAt?: string
  meta?: Record<string, unknown>
}

// Event: append-only log entry for actions, intents, and traces
export interface Event {
  id: string
  type: string
  at: string
  refs: EntityRef[]
  payload?: Record<string, unknown>
  createdAt: string
  updatedAt: string
  archivedAt?: string
  meta?: Record<string, unknown>
}

// OnboardingState: tracks whether user has completed or skipped onboarding
// Per TASKLIST.md Part A: persist onboarding completion to avoid re-showing
export interface OnboardingState {
  completedAt?: string // ISO8601 timestamp when onboarding was completed
  skippedAt?: string   // ISO8601 timestamp when onboarding was skipped
}
