// localStorage-backed JSON storage for Behavioral Trading Companion v1
// Per PTD.md: single logical store, deterministic, resettable

import type {
  Position,
  JournalEntry,
  Thought,
  ThesisVersion,
  NorthStar,
  ThreadMessage,
  RelationEdge,
  Event,
  OnboardingState,
} from '@/domain/types/entities'
import { generateUUID, generateTimestamp } from '@/domain/types/entities'

const STORAGE_KEY = 'behavioral-trading-v1'
const SCHEMA_VERSION = 3

// StorageData: complete application state
export interface StorageData {
  schemaVersion: number
  positions: Record<string, Position>
  journalEntries: Record<string, JournalEntry>
  thoughts: Record<string, Thought>
  thesisVersions: Record<string, ThesisVersion>
  northStar: NorthStar | null
  threadMessages: Record<string, ThreadMessage>
  relationEdges: Record<string, RelationEdge>
  events: Record<string, Event>
  onboarding: OnboardingState | null
}

// Default empty storage structure
function getDefaultData(): StorageData {
  return {
    schemaVersion: SCHEMA_VERSION,
    positions: {},
    journalEntries: {},
    thoughts: {},
    thesisVersions: {},
    northStar: null,
    threadMessages: {},
    relationEdges: {},
    events: {},
    onboarding: null,
  }
}

// Migrate data from older schema versions to current
function migrateData(data: StorageData): StorageData {
  // Migration from v1 to v2: add updatedAt, events collection, NorthStar envelope
  if (data.schemaVersion < 2) {
    const now = generateTimestamp()

    // Ensure events collection exists
    if (!data.events) {
      data.events = {}
    }

    // Migrate ThesisVersion: add updatedAt if missing
    for (const id of Object.keys(data.thesisVersions)) {
      const tv = data.thesisVersions[id]
      if (!tv.updatedAt) {
        tv.updatedAt = tv.createdAt
      }
    }

    // Migrate ThreadMessage: add updatedAt if missing
    for (const id of Object.keys(data.threadMessages)) {
      const msg = data.threadMessages[id]
      if (!msg.updatedAt) {
        msg.updatedAt = msg.createdAt
      }
    }

    // Migrate RelationEdge: add updatedAt if missing, rename metadata->meta
    for (const id of Object.keys(data.relationEdges)) {
      const rel = data.relationEdges[id] as RelationEdge & { metadata?: Record<string, unknown> }
      if (!rel.updatedAt) {
        rel.updatedAt = rel.createdAt
      }
      // Migrate metadata -> meta (idempotent: only if metadata exists and meta doesn't)
      if (rel.metadata !== undefined && rel.meta === undefined) {
        rel.meta = rel.metadata
      }
      // Always remove metadata field if present (cleanup)
      if ('metadata' in rel) {
        delete rel.metadata
      }
    }

    // Migrate NorthStar: add envelope if present
    if (data.northStar) {
      const ns = data.northStar as NorthStar & { id?: string; createdAt?: string; updatedAt?: string }
      if (!ns.id) {
        ns.id = generateUUID()
      }
      if (!ns.createdAt) {
        ns.createdAt = now
      }
      if (!ns.updatedAt) {
        ns.updatedAt = now
      }
    }

    data.schemaVersion = 2
  }

  // Migration from v2 to v3: add onboarding state field
  if (data.schemaVersion < 3) {
    // Ensure onboarding field exists (null = not yet completed/skipped)
    if (data.onboarding === undefined) {
      data.onboarding = null
    }
    data.schemaVersion = 3
  }

  return data
}

// Load data from localStorage or return default empty structure
export function loadData(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return getDefaultData()
    }
    const parsed = JSON.parse(raw) as StorageData
    // Migrate if needed and save migrated data
    if (parsed.schemaVersion < SCHEMA_VERSION) {
      const migrated = migrateData(parsed)
      saveData(migrated)
      return migrated
    }
    return parsed
  } catch (error) {
    console.error('Failed to load data from localStorage:', error)
    return getDefaultData()
  }
}

// Save data to localStorage (atomic write)
export function saveData(data: StorageData): void {
  try {
    const serialized = JSON.stringify(data)
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch (error) {
    console.error('Failed to save data to localStorage:', error)
    throw new Error('Storage save failed')
  }
}

// Reset all app data (clear localStorage namespace)
export function resetData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to reset data in localStorage:', error)
    throw new Error('Storage reset failed')
  }
}
