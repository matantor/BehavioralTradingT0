// NorthStarRepository: version management for thesis statements
// Per TDD.md: NorthStar tracks currentVersionId, ThesisVersion stores versions

import type { ThesisVersion } from '@/domain/types/entities'
import { generateUUID, generateTimestamp } from '@/domain/types/entities'
import { loadData, saveData } from '@/lib/storage/storage'

class NorthStarRepositoryClass {
  getCurrent(): ThesisVersion | null {
    const data = loadData()
    if (!data.northStar || !data.northStar.currentVersionId) {
      return null
    }
    return data.thesisVersions[data.northStar.currentVersionId] || null
  }

  createVersion(
    content: string,
    changeNote?: string,
    meta?: Record<string, unknown>
  ): ThesisVersion {
    // Validate required fields
    if (!content) {
      throw new Error('ThesisVersion content is required')
    }

    const now = generateTimestamp()
    const version: ThesisVersion = {
      id: generateUUID(),
      createdAt: now,
      updatedAt: now,
      content,
      changeNote,
      meta,
    }

    const data = loadData()
    data.thesisVersions[version.id] = version

    // Create or update NorthStar with full envelope
    if (data.northStar) {
      data.northStar.currentVersionId = version.id
      data.northStar.updatedAt = now
    } else {
      data.northStar = {
        id: generateUUID(),
        currentVersionId: version.id,
        createdAt: now,
        updatedAt: now,
      }
    }
    saveData(data)

    return version
  }

  listVersions(): ThesisVersion[] {
    const data = loadData()
    const versions = Object.values(data.thesisVersions)
    // Sort by createdAt descending (newest first)
    return versions.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }

  getVersion(id: string): ThesisVersion | null {
    const data = loadData()
    return data.thesisVersions[id] || null
  }
}

// Export singleton instance
export const NorthStarRepository = new NorthStarRepositoryClass()
