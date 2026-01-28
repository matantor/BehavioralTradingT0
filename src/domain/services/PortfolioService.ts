// PortfolioService: domain service for Position operations
// Services call repositories only, no direct storage access

import type { Position } from '@/domain/types/entities'
import { PositionRepository } from '@/domain/repositories/PositionRepository'

class PortfolioServiceClass {
  list(includeArchived = false): Position[] {
    return PositionRepository.list(includeArchived)
  }

  get(id: string): Position | null {
    return PositionRepository.getById(id)
  }

  create(
    payload: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>
  ): Position {
    return PositionRepository.create(payload)
  }

  update(id: string, patch: Partial<Position>): Position {
    return PositionRepository.update(id, patch)
  }

  archive(id: string): void {
    PositionRepository.archive(id)
  }
}

export const PortfolioService = new PortfolioServiceClass()
