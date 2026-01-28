import { describe, it, expect, beforeEach } from 'vitest'
import { NorthStarService } from '@/domain/services'
import { resetData } from '@/lib/storage/storage'

describe('NorthStarService', () => {
  beforeEach(() => {
    resetData()
  })

  describe('getCurrent', () => {
    it('returns null if no thesis exists', () => {
      const current = NorthStarService.getCurrent()
      expect(current).toBeNull()
    })

    it('returns current thesis after creation', () => {
      NorthStarService.createVersion('My investment thesis')

      const current = NorthStarService.getCurrent()
      expect(current).not.toBeNull()
      expect(current?.content).toBe('My investment thesis')
    })

    it('returns most recent thesis after multiple versions', () => {
      NorthStarService.createVersion('First thesis')
      NorthStarService.createVersion('Second thesis')
      const latest = NorthStarService.createVersion('Third thesis')

      const current = NorthStarService.getCurrent()
      expect(current?.id).toBe(latest.id)
      expect(current?.content).toBe('Third thesis')
    })
  })

  describe('createVersion', () => {
    it('creates version with content and timestamps', () => {
      const version = NorthStarService.createVersion('New thesis')

      expect(version.id).toBeDefined()
      expect(version.createdAt).toBeDefined()
      expect(version.content).toBe('New thesis')
    })

    it('creates version with optional change note', () => {
      const version = NorthStarService.createVersion(
        'Updated thesis',
        'Revised after market analysis'
      )

      expect(version.content).toBe('Updated thesis')
      expect(version.changeNote).toBe('Revised after market analysis')
    })

    it('validates required content', () => {
      expect(() => {
        NorthStarService.createVersion('')
      }).toThrow('ThesisVersion content is required')
    })

    it('persists version to storage', () => {
      const created = NorthStarService.createVersion('Persisted thesis')

      const current = NorthStarService.getCurrent()
      expect(current?.id).toBe(created.id)
      expect(current?.content).toBe('Persisted thesis')
    })
  })

  describe('listVersions', () => {
    it('returns empty array when no versions exist', () => {
      const versions = NorthStarService.listVersions()
      expect(versions).toEqual([])
    })

    it('returns all created versions', () => {
      NorthStarService.createVersion('First')
      NorthStarService.createVersion('Second')
      NorthStarService.createVersion('Third')

      const versions = NorthStarService.listVersions()
      expect(versions).toHaveLength(3)

      const contents = versions.map(v => v.content)
      expect(contents).toContain('First')
      expect(contents).toContain('Second')
      expect(contents).toContain('Third')
    })

    it('includes change notes in results', () => {
      NorthStarService.createVersion('Thesis 1', 'Initial creation')
      NorthStarService.createVersion('Thesis 2', 'Updated strategy')

      const versions = NorthStarService.listVersions()
      const notes = versions.map(v => v.changeNote)
      expect(notes).toContain('Initial creation')
      expect(notes).toContain('Updated strategy')
    })
  })
})
