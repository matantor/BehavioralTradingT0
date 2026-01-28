// ThreadService: domain service for ThreadMessage operations
// Services call repositories only, no direct storage access

import type { ThreadMessage, EntityRef } from '@/domain/types/entities'
import { ThreadRepository } from '@/domain/repositories/ThreadRepository'

class ThreadServiceClass {
  getMessages(entityRef: EntityRef): ThreadMessage[] {
    return ThreadRepository.getMessages(entityRef, false) // excludes archived by default
  }

  addMessage(entityRef: EntityRef, content: string): ThreadMessage {
    return ThreadRepository.addMessage(entityRef, content)
  }
}

export const ThreadService = new ThreadServiceClass()
