// Domain Services - Composition Layer
// UI imports services only from this module
// Per CLAUDE.md: UI → Services → Repositories

export { PortfolioService, type PnLResult, type PortfolioTotals, type HistoricalSnapshot } from './PortfolioService'
export { JournalService, type PortfolioActionResult, type JournalCreateInput, type JournalCreateResult } from './JournalService'
export { ThoughtService, getThoughtKind } from './ThoughtService'
export { NorthStarService } from './NorthStarService'
export { ThreadService } from './ThreadService'
export { RelationService, type DeriveResult } from './RelationService'
export { EventService } from './EventService'
export { OnboardingService } from './OnboardingService'

// Re-export types for UI convenience
export type { ContextAnchor, ActionType, PositionMode, PaymentInfo } from '@/domain/types/entities'
