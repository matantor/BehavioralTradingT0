import { describe, it, expect, beforeEach } from 'vitest'
import { loadData, saveData, resetData } from '@/lib/storage/storage'
import type { Position } from '@/domain/types/entities'

describe('Storage', () => {
  beforeEach(() => {
    resetData()
  })

  it('should load default empty data when storage is empty', () => {
    const data = loadData()
    expect(data.schemaVersion).toBe(3)
    expect(data.positions).toEqual({})
    expect(data.journalEntries).toEqual({})
    expect(data.thoughts).toEqual({})
    expect(data.thesisVersions).toEqual({})
    expect(data.northStar).toBeNull()
    expect(data.threadMessages).toEqual({})
    expect(data.relationEdges).toEqual({})
    expect(data.events).toEqual({})
    expect(data.onboarding).toBeNull()
  })

  it('should save and load data correctly', () => {
    const data = loadData()
    const position: Position = {
      id: 'test-id',
      ticker: 'AAPL',
      quantity: 10,
      avgCost: 150,
      currency: 'USD',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    }
    data.positions[position.id] = position
    saveData(data)

    const loaded = loadData()
    expect(loaded.positions['test-id']).toEqual(position)
  })

  it('should reset data correctly', () => {
    const data = loadData()
    data.positions['test'] = {
      id: 'test',
      ticker: 'AAPL',
      quantity: 10,
      avgCost: 150,
      currency: 'USD',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    }
    saveData(data)

    resetData()
    const loaded = loadData()
    expect(loaded.positions).toEqual({})
  })

  it('should migrate v1 to v3 (through v2)', () => {
    // Simulate v1 data (before migration)
    const data = loadData()
    data.schemaVersion = 1
    // Remove events to simulate v1 (before events existed)
    delete (data as Record<string, unknown>).events
    // Remove onboarding to simulate v1
    delete (data as Record<string, unknown>).onboarding
    saveData(data)

    const loaded = loadData()
    // Should be migrated to v3
    expect(loaded.schemaVersion).toBe(3)
    // events collection should be added by migration
    expect(loaded.events).toEqual({})
    // onboarding should be added by migration
    expect(loaded.onboarding).toBeNull()
  })

  it('should migrate v2 to v3 (add onboarding field)', () => {
    // Simulate v2 data (before onboarding)
    const data = loadData()
    data.schemaVersion = 2
    // Remove onboarding to simulate v2
    delete (data as Record<string, unknown>).onboarding
    saveData(data)

    const loaded = loadData()
    // Should be migrated to v3
    expect(loaded.schemaVersion).toBe(3)
    // onboarding should be added by migration
    expect(loaded.onboarding).toBeNull()
  })

  it('should migrate RelationEdge.metadata to RelationEdge.meta', () => {
    // Simulate v1 data with legacy metadata field
    const data = loadData()
    data.schemaVersion = 1
    delete (data as Record<string, unknown>).events
    delete (data as Record<string, unknown>).onboarding

    // Create a legacy relationEdge with metadata (old field name)
    const legacyEdge = {
      id: 'edge-1',
      fromRef: { type: 'position', id: 'pos-1' },
      toRef: { type: 'thought', id: 'thought-1' },
      relationType: 'supports' as const,
      createdAt: '2024-01-01T00:00:00.000Z',
      metadata: { score: 0.95, source: 'user' }, // Legacy field
    }
    // Cast to bypass type checking for legacy data
    ;(data.relationEdges as Record<string, unknown>)['edge-1'] = legacyEdge
    saveData(data)

    const loaded = loadData()
    expect(loaded.schemaVersion).toBe(3)
    const migratedEdge = loaded.relationEdges['edge-1']

    // metadata should be migrated to meta
    expect(migratedEdge.meta).toEqual({ score: 0.95, source: 'user' })
    // metadata field should be removed
    expect('metadata' in migratedEdge).toBe(false)
  })

  it('should preserve data from future schema versions', () => {
    const data = loadData()
    data.schemaVersion = 999
    data.positions['test'] = {
      id: 'test',
      ticker: 'AAPL',
      quantity: 10,
      avgCost: 150,
      currency: 'USD',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    }
    saveData(data)

    const loaded = loadData()
    // Future versions are preserved as-is (forward compatibility)
    expect(loaded.schemaVersion).toBe(999)
    expect(loaded.positions['test']).toBeDefined()
  })
})
