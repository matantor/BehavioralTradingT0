import { describe, it, expect, beforeEach } from 'vitest'
import { ThoughtService, getThoughtKind } from '@/domain/services/ThoughtService'
import { resetData } from '@/lib/storage/storage'

describe('ThoughtService', () => {
  beforeEach(() => {
    resetData()
  })

  describe('create', () => {
    it('creates a thought with content', () => {
      const thought = ThoughtService.create({ content: 'Test thought' })
      expect(thought.content).toBe('Test thought')
      expect(thought.id).toBeDefined()
      expect(thought.createdAt).toBeDefined()
      expect(thought.updatedAt).toBeDefined()
    })

    it('creates a thought without meta.kind set', () => {
      const thought = ThoughtService.create({ content: 'Test' })
      expect(thought.meta).toBeUndefined()
    })
  })

  describe('update', () => {
    it('updates thought content', () => {
      const thought = ThoughtService.create({ content: 'Original' })
      const updated = ThoughtService.update(thought.id, { content: 'Updated' })
      expect(updated.content).toBe('Updated')
    })

    it('sets updatedAt on update', () => {
      const thought = ThoughtService.create({ content: 'Test' })
      const updated = ThoughtService.update(thought.id, { content: 'Changed' })
      // updatedAt should be a valid ISO timestamp
      expect(updated.updatedAt).toBeDefined()
      expect(new Date(updated.updatedAt).toISOString()).toBe(updated.updatedAt)
    })

    it('preserves createdAt on update', () => {
      const thought = ThoughtService.create({ content: 'Test' })
      const updated = ThoughtService.update(thought.id, { content: 'Changed' })
      expect(updated.createdAt).toBe(thought.createdAt)
    })

    it('preserves id on update', () => {
      const thought = ThoughtService.create({ content: 'Test' })
      const updated = ThoughtService.update(thought.id, { content: 'Changed' })
      expect(updated.id).toBe(thought.id)
    })
  })

  describe('updateKind', () => {
    it('sets meta.kind to mini_thesis', () => {
      const thought = ThoughtService.create({ content: 'Test' })
      const updated = ThoughtService.updateKind(thought.id, 'mini_thesis')
      expect(updated.meta?.kind).toBe('mini_thesis')
    })

    it('sets meta.kind back to thought', () => {
      const thought = ThoughtService.create({ content: 'Test' })
      ThoughtService.updateKind(thought.id, 'mini_thesis')
      const demoted = ThoughtService.updateKind(thought.id, 'thought')
      expect(demoted.meta?.kind).toBe('thought')
    })

    it('preserves other meta fields when updating kind', () => {
      const thought = ThoughtService.create({
        content: 'Test',
        meta: { customField: 'value', anotherField: 123 },
      })
      const updated = ThoughtService.updateKind(thought.id, 'mini_thesis')
      expect(updated.meta?.kind).toBe('mini_thesis')
      expect(updated.meta?.customField).toBe('value')
      expect(updated.meta?.anotherField).toBe(123)
    })

    it('throws error for non-existent thought', () => {
      expect(() => ThoughtService.updateKind('non-existent-id', 'mini_thesis')).toThrow()
    })
  })

  describe('getThoughtKind helper', () => {
    it('returns "thought" for thought without meta', () => {
      const thought = ThoughtService.create({ content: 'Test' })
      expect(getThoughtKind(thought)).toBe('thought')
    })

    it('returns "thought" for thought with meta but no kind', () => {
      const thought = ThoughtService.create({
        content: 'Test',
        meta: { otherField: 'value' },
      })
      expect(getThoughtKind(thought)).toBe('thought')
    })

    it('returns "thought" for thought with meta.kind = "thought"', () => {
      const thought = ThoughtService.create({ content: 'Test' })
      const updated = ThoughtService.updateKind(thought.id, 'thought')
      expect(getThoughtKind(updated)).toBe('thought')
    })

    it('returns "mini_thesis" for thought with meta.kind = "mini_thesis"', () => {
      const thought = ThoughtService.create({ content: 'Test' })
      const updated = ThoughtService.updateKind(thought.id, 'mini_thesis')
      expect(getThoughtKind(updated)).toBe('mini_thesis')
    })
  })

  describe('list', () => {
    it('returns all active thoughts', () => {
      ThoughtService.create({ content: 'Thought 1' })
      ThoughtService.create({ content: 'Thought 2' })
      const list = ThoughtService.list()
      expect(list.length).toBe(2)
    })
  })

  describe('get', () => {
    it('returns thought by id', () => {
      const thought = ThoughtService.create({ content: 'Test' })
      const retrieved = ThoughtService.get(thought.id)
      expect(retrieved?.id).toBe(thought.id)
      expect(retrieved?.content).toBe('Test')
    })

    it('returns null for non-existent id', () => {
      const retrieved = ThoughtService.get('non-existent')
      expect(retrieved).toBeNull()
    })
  })
})
