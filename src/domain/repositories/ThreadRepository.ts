// ThreadRepository: message thread management for entities
// Per PTD.md: threads store chronological messages per entity

import type { ThreadMessage, EntityRef } from '@/domain/types/entities'
import { generateUUID, generateTimestamp } from '@/domain/types/entities'
import { loadData, saveData } from '@/lib/storage/storage'

class ThreadRepositoryClass {
  getMessages(
    entityRef: EntityRef,
    includeArchived = false
  ): ThreadMessage[] {
    const data = loadData()
    let messages = Object.values(data.threadMessages).filter(
      (msg) =>
        msg.entityRef.type === entityRef.type && msg.entityRef.id === entityRef.id
    )

    if (!includeArchived) {
      messages = messages.filter((msg) => !msg.archivedAt)
    }

    // Sort by createdAt ascending (chronological order)
    return messages.sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }

  addMessage(entityRef: EntityRef, content: string): ThreadMessage {
    // Validate required fields
    if (!content) {
      throw new Error('ThreadMessage content is required')
    }
    if (!entityRef.type || !entityRef.id) {
      throw new Error('ThreadMessage entityRef must have type and id')
    }

    const now = generateTimestamp()
    const message: ThreadMessage = {
      id: generateUUID(),
      entityRef,
      createdAt: now,
      updatedAt: now,
      content,
    }

    const data = loadData()
    data.threadMessages[message.id] = message
    saveData(data)

    return message
  }

  archiveMessage(id: string): void {
    const data = loadData()
    const existing = data.threadMessages[id]
    if (!existing) {
      throw new Error(`ThreadMessage ${id} not found`)
    }

    const now = generateTimestamp()
    existing.archivedAt = now
    existing.updatedAt = now
    data.threadMessages[id] = existing
    saveData(data)
  }
}

// Export singleton instance
export const ThreadRepository = new ThreadRepositoryClass()
