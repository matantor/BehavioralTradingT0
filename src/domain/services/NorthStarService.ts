// NorthStarService: domain service for NorthStar/ThesisVersion operations
// Services call repositories only, no direct storage access

import type { ThesisVersion } from '@/domain/types/entities'
import { NorthStarRepository } from '@/domain/repositories/NorthStarRepository'

class NorthStarServiceClass {
  getCurrent(): ThesisVersion | null {
    return NorthStarRepository.getCurrent()
  }

  createVersion(
    content: string,
    changeNote?: string,
    meta?: Record<string, unknown>
  ): ThesisVersion {
    return NorthStarRepository.createVersion(content, changeNote, meta)
  }

  listVersions(): ThesisVersion[] {
    return NorthStarRepository.listVersions()
  }
}

export const NorthStarService = new NorthStarServiceClass()
