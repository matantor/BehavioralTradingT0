// ThoughtService: domain service for Thought operations
// Services call repositories only, no direct storage access

import type { Thought } from '@/domain/types/entities'
import { ThoughtRepository } from '@/domain/repositories/ThoughtRepository'

// Helper: get the kind of a thought (defaults to 'thought' if not set)
export function getThoughtKind(thought: Thought): 'thought' | 'mini_thesis' {
  const kind = thought.meta?.kind
  if (kind === 'mini_thesis') return 'mini_thesis'
  return 'thought'
}

class ThoughtServiceClass {
  list(): Thought[] {
    return ThoughtRepository.list(false) // excludes archived by default
  }

  get(id: string): Thought | null {
    return ThoughtRepository.getById(id)
  }

  create(
    payload: Omit<Thought, 'id' | 'createdAt' | 'updatedAt'>
  ): Thought {
    return ThoughtRepository.create(payload)
  }

  update(id: string, patch: Partial<Omit<Thought, 'id' | 'createdAt'>>): Thought {
    return ThoughtRepository.update(id, patch)
  }

  // Update meta.kind while preserving other meta fields
  updateKind(id: string, kind: 'thought' | 'mini_thesis'): Thought {
    const existing = ThoughtRepository.getById(id)
    if (!existing) {
      throw new Error(`Thought ${id} not found`)
    }
    const newMeta = { ...existing.meta, kind }
    return ThoughtRepository.update(id, { meta: newMeta })
  }
}

export const ThoughtService = new ThoughtServiceClass()
