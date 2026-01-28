// Domain Services - Composition Layer
// UI imports services only from this module
// Per CLAUDE.md: UI → Services → Repositories

export { PortfolioService } from './PortfolioService'
export { JournalService, type PortfolioActionResult } from './JournalService'
export { ThoughtService, getThoughtKind } from './ThoughtService'
export { NorthStarService } from './NorthStarService'
export { ThreadService } from './ThreadService'
export { RelationService, type DeriveResult } from './RelationService'
export { EventService } from './EventService'
export { OnboardingService } from './OnboardingService'

// Re-export ContextAnchor type for UI convenience
export type { ContextAnchor } from '@/domain/types/entities'
