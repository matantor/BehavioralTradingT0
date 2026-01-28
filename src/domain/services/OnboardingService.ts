// OnboardingService: manages onboarding state persistence
// Per TASKLIST.md Part A: persist hasCompletedOnboarding or equivalent
// Per CLAUDE.md: UI -> Services -> Repositories (direct storage access here is acceptable
// as onboarding is a simple singleton state, not an entity collection)

import { loadData, saveData } from '@/lib/storage/storage'
import { generateTimestamp, type OnboardingState } from '@/domain/types/entities'

class OnboardingServiceImpl {
  /**
   * Get current onboarding state
   * Returns null if onboarding has not been completed or skipped
   */
  get(): OnboardingState | null {
    const data = loadData()
    return data.onboarding
  }

  /**
   * Check if onboarding has been completed (either finished or skipped)
   */
  isCompleted(): boolean {
    const state = this.get()
    if (!state) return false
    return Boolean(state.completedAt || state.skippedAt)
  }

  /**
   * Mark onboarding as completed (user went through full flow)
   */
  complete(): OnboardingState {
    const data = loadData()
    const now = generateTimestamp()
    const state: OnboardingState = {
      completedAt: now,
    }
    data.onboarding = state
    saveData(data)
    return state
  }

  /**
   * Mark onboarding as skipped (user chose to skip)
   */
  skip(): OnboardingState {
    const data = loadData()
    const now = generateTimestamp()
    const state: OnboardingState = {
      skippedAt: now,
    }
    data.onboarding = state
    saveData(data)
    return state
  }
}

export const OnboardingService = new OnboardingServiceImpl()
