import { describe, it, expect, beforeEach } from 'vitest'
import { OnboardingService } from '@/domain/services'
import { resetData } from '@/lib/storage/storage'

describe('OnboardingService', () => {
  beforeEach(() => {
    resetData()
  })

  describe('get', () => {
    it('returns null when onboarding state does not exist', () => {
      const state = OnboardingService.get()
      expect(state).toBeNull()
    })

    it('returns state after completion', () => {
      OnboardingService.complete()
      const state = OnboardingService.get()
      expect(state).not.toBeNull()
      expect(state?.completedAt).toBeDefined()
    })

    it('returns state after skip', () => {
      OnboardingService.skip()
      const state = OnboardingService.get()
      expect(state).not.toBeNull()
      expect(state?.skippedAt).toBeDefined()
    })
  })

  describe('isCompleted', () => {
    it('returns false when no state exists', () => {
      expect(OnboardingService.isCompleted()).toBe(false)
    })

    it('returns true after completion', () => {
      OnboardingService.complete()
      expect(OnboardingService.isCompleted()).toBe(true)
    })

    it('returns true after skip', () => {
      OnboardingService.skip()
      expect(OnboardingService.isCompleted()).toBe(true)
    })
  })

  describe('complete', () => {
    it('sets completedAt timestamp', () => {
      const before = new Date().toISOString()
      const state = OnboardingService.complete()
      const after = new Date().toISOString()

      expect(state.completedAt).toBeDefined()
      expect(state.completedAt! >= before).toBe(true)
      expect(state.completedAt! <= after).toBe(true)
    })

    it('does not set skippedAt', () => {
      const state = OnboardingService.complete()
      expect(state.skippedAt).toBeUndefined()
    })

    it('persists to storage', () => {
      OnboardingService.complete()
      const retrieved = OnboardingService.get()
      expect(retrieved?.completedAt).toBeDefined()
    })
  })

  describe('skip', () => {
    it('sets skippedAt timestamp', () => {
      const before = new Date().toISOString()
      const state = OnboardingService.skip()
      const after = new Date().toISOString()

      expect(state.skippedAt).toBeDefined()
      expect(state.skippedAt! >= before).toBe(true)
      expect(state.skippedAt! <= after).toBe(true)
    })

    it('does not set completedAt', () => {
      const state = OnboardingService.skip()
      expect(state.completedAt).toBeUndefined()
    })

    it('persists to storage', () => {
      OnboardingService.skip()
      const retrieved = OnboardingService.get()
      expect(retrieved?.skippedAt).toBeDefined()
    })
  })

  describe('persistence across resets', () => {
    it('completed state survives service re-access', () => {
      OnboardingService.complete()
      // Simulate app reload by checking isCompleted again
      expect(OnboardingService.isCompleted()).toBe(true)
      expect(OnboardingService.get()?.completedAt).toBeDefined()
    })

    it('skipped state survives service re-access', () => {
      OnboardingService.skip()
      // Simulate app reload by checking isCompleted again
      expect(OnboardingService.isCompleted()).toBe(true)
      expect(OnboardingService.get()?.skippedAt).toBeDefined()
    })

    it('reset clears onboarding state', () => {
      OnboardingService.complete()
      expect(OnboardingService.isCompleted()).toBe(true)

      resetData()
      expect(OnboardingService.isCompleted()).toBe(false)
      expect(OnboardingService.get()).toBeNull()
    })
  })
})
