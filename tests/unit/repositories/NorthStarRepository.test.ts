import { describe, it, expect, beforeEach } from 'vitest'
import { NorthStarRepository } from '@/domain/repositories/NorthStarRepository'
import { resetData } from '@/lib/storage/storage'

describe('NorthStarRepository', () => {
  beforeEach(() => {
    resetData()
  })

  describe('getCurrent', () => {
    it('should return null when no version exists', () => {
      const current = NorthStarRepository.getCurrent()
      expect(current).toBeNull()
    })

    it('should return current version after creation', () => {
      const version = NorthStarRepository.createVersion(
        'Build long-term wealth through value investing'
      )

      const current = NorthStarRepository.getCurrent()
      expect(current).toEqual(version)
    })

    it('should return latest version when multiple exist', () => {
      NorthStarRepository.createVersion('First version')
      const latest = NorthStarRepository.createVersion('Latest version')

      const current = NorthStarRepository.getCurrent()
      expect(current?.content).toBe('Latest version')
      expect(current?.id).toBe(latest.id)
    })
  })

  describe('createVersion', () => {
    it('should create a thesis version', () => {
      const version = NorthStarRepository.createVersion(
        'Build long-term wealth',
        'Initial thesis'
      )

      expect(version.id).toBeDefined()
      expect(version.content).toBe('Build long-term wealth')
      expect(version.changeNote).toBe('Initial thesis')
      expect(version.createdAt).toBeDefined()
    })

    it('should create version without changeNote', () => {
      const version = NorthStarRepository.createVersion(
        'Build long-term wealth'
      )

      expect(version.content).toBe('Build long-term wealth')
      expect(version.changeNote).toBeUndefined()
    })

    it('should throw error for empty content', () => {
      expect(() => {
        NorthStarRepository.createVersion('')
      }).toThrow('content is required')
    })

    it('should update NorthStar current pointer', () => {
      NorthStarRepository.createVersion('Version 1')
      const v2 = NorthStarRepository.createVersion('Version 2')

      const current = NorthStarRepository.getCurrent()
      expect(current?.id).toBe(v2.id)
    })
  })

  describe('listVersions', () => {
    it('should return empty array when no versions exist', () => {
      const versions = NorthStarRepository.listVersions()
      expect(versions).toEqual([])
    })

    it('should list all versions', () => {
      NorthStarRepository.createVersion('Version 1')
      NorthStarRepository.createVersion('Version 2')
      NorthStarRepository.createVersion('Version 3')

      const versions = NorthStarRepository.listVersions()
      expect(versions).toHaveLength(3)
    })

    it('should return versions sorted by createdAt descending', () => {
      NorthStarRepository.createVersion('First')
      NorthStarRepository.createVersion('Second')

      const versions = NorthStarRepository.listVersions()
      expect(versions).toHaveLength(2)
      expect(new Date(versions[0].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(versions[1].createdAt).getTime()
      )
    })
  })

  describe('getVersion', () => {
    it('should retrieve specific version by id', () => {
      const created = NorthStarRepository.createVersion(
        'Test version',
        'Test note'
      )

      const retrieved = NorthStarRepository.getVersion(created.id)
      expect(retrieved).toEqual(created)
    })

    it('should return null for non-existent version', () => {
      const result = NorthStarRepository.getVersion('non-existent')
      expect(result).toBeNull()
    })
  })

  describe('version history', () => {
    it('should maintain complete version history', () => {
      const v1 = NorthStarRepository.createVersion('V1', 'Initial')
      const v2 = NorthStarRepository.createVersion('V2', 'Updated')
      const v3 = NorthStarRepository.createVersion('V3', 'Refined')

      const versions = NorthStarRepository.listVersions()
      expect(versions).toHaveLength(3)

      // All versions should still be retrievable
      expect(NorthStarRepository.getVersion(v1.id)).toBeDefined()
      expect(NorthStarRepository.getVersion(v2.id)).toBeDefined()
      expect(NorthStarRepository.getVersion(v3.id)).toBeDefined()
    })
  })
})
