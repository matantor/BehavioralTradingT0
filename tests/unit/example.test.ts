import { describe, it, expect } from 'vitest'

describe('Example Test', () => {
  it('should pass a basic assertion', () => {
    expect(1 + 1).toBe(2)
  })

  it('should validate strings', () => {
    expect('Behavioral Trading Companion').toContain('Trading')
  })
})
