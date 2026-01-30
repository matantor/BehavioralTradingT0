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
  currentPrice?: number  // Manual current price for P&L calculations
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

// ActionType: trading action types for journal entries
export type ActionType = 'buy' | 'sell' | 'long' | 'short' | 'deposit' | 'withdraw'

// PositionMode: whether entry creates new position or affects existing
export type PositionMode = 'new' | 'existing'

// PaymentInfo: payment details for buy actions
export interface PaymentInfo {
  asset: string          // e.g., 'USD', 'BTC'
  amount: number         // how much was paid
  isNewMoney?: boolean   // if true, don't subtract from existing cash
}

// JournalEntry: executed trading action (decision only, no reflections)
// Per TASKLIST Part 1: all entries require mandatory trading fields
export interface JournalEntry {
  id: string
  createdAt: string
  updatedAt: string

  // Mandatory fields (cannot save without these)
  type: 'decision'                    // only decision type; reflections go to Thoughts
  actionType: ActionType              // buy, sell, long, short, deposit, withdraw
  ticker: string                      // instrument symbol
  quantity: number                    // transaction quantity
  price: number                       // price per unit
  entryTime: string                   // when action occurred (editable, default=now)
  positionMode: PositionMode          // 'new' or 'existing'
  positionId?: string                 // required if positionMode='existing'

  // Payment (required for buy actions)
  payment?: PaymentInfo               // what was paid; required for actionType='buy'

  // Optional fields (recordable but skippable)
  // These go in meta to keep the main interface clean
  // meta.sector, meta.assetClass, meta.rationale, meta.timeHorizon,
  // meta.priceTargets, meta.invalidation, meta.emotions, meta.confidence,
  // meta.fees, meta.venue, meta.status, meta.reminders

  archivedAt?: string
  supersededById?: string
  meta?: Record<string, unknown>
}

// Legacy PortfolioAction: kept for backwards compatibility with existing entries
// New entries use JournalEntry fields directly; this is only for migration
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
