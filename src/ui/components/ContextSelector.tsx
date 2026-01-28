// ContextSelector: Reusable component for selecting context anchors at entry time
// Per PTD.md Section 10: context is declared at entry time, not retroactively attached

import { useState, useEffect } from 'react'
import type { ContextAnchor } from '@/domain/types/entities'
import { PortfolioService, ThoughtService, NorthStarService, getThoughtKind } from '@/domain/services'
import type { Position, Thought, ThesisVersion } from '@/domain/types/entities'

export interface ContextSelectorProps {
  // Which entity types to show selectors for
  showNorthStar?: boolean
  showPositions?: boolean
  showThoughts?: boolean
  // Whether NorthStar is required (for decision entries)
  northStarRequired?: boolean
  // Callback when anchors change
  onChange: (anchors: ContextAnchor[], noThesisExplicit: boolean) => void
  // Initial values (for editing)
  initialAnchors?: ContextAnchor[]
  initialNoThesis?: boolean
}

export default function ContextSelector({
  showNorthStar = false,
  showPositions = false,
  showThoughts = false,
  northStarRequired = false,
  onChange,
  initialAnchors = [],
  initialNoThesis = false,
}: ContextSelectorProps) {
  // Available options
  const [positions, setPositions] = useState<Position[]>([])
  const [thoughts, setThoughts] = useState<Thought[]>([])
  const [currentThesis, setCurrentThesis] = useState<ThesisVersion | null>(null)

  // Selected values
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
  const [selectedThoughts, setSelectedThoughts] = useState<string[]>([])
  const [linkToThesis, setLinkToThesis] = useState(false)
  const [noThesisExplicit, setNoThesisExplicit] = useState(initialNoThesis)

  // Load available options
  useEffect(() => {
    if (showPositions) {
      setPositions(PortfolioService.list(false))
    }
    if (showThoughts) {
      const all = ThoughtService.list()
      // Sort by createdAt desc
      setThoughts([...all].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ))
    }
    if (showNorthStar) {
      const thesis = NorthStarService.getCurrent()
      setCurrentThesis(thesis)
      // When no thesis exists and northStarRequired, auto-set noThesisExplicit
      // This removes friction: user doesn't need to check a box when there's nothing to link to
      if (!thesis && northStarRequired) {
        setNoThesisExplicit(true)
      }
    }
  }, [showPositions, showThoughts, showNorthStar, northStarRequired])

  // Initialize from initial anchors
  useEffect(() => {
    if (initialAnchors.length > 0) {
      const posIds = initialAnchors
        .filter(a => a.entityType === 'position')
        .map(a => a.entityId)
      const thoughtIds = initialAnchors
        .filter(a => a.entityType === 'thought')
        .map(a => a.entityId)
      const hasThesis = initialAnchors.some(a => a.entityType === 'thesis')

      setSelectedPositions(posIds)
      setSelectedThoughts(thoughtIds)
      setLinkToThesis(hasThesis)
    }
  }, [initialAnchors])

  // Build anchors and notify parent when selection changes
  useEffect(() => {
    const anchors: ContextAnchor[] = []

    // Add thesis anchor
    if (linkToThesis && currentThesis) {
      anchors.push({
        entityType: 'thesis',
        entityId: currentThesis.id,
        role: 'intent',
      })
    }

    // Add position anchors
    selectedPositions.forEach(id => {
      anchors.push({
        entityType: 'position',
        entityId: id,
        role: 'subject',
      })
    })

    // Add thought anchors
    selectedThoughts.forEach(id => {
      anchors.push({
        entityType: 'thought',
        entityId: id,
        role: 'reference',
      })
    })

    onChange(anchors, noThesisExplicit)
  }, [linkToThesis, selectedPositions, selectedThoughts, noThesisExplicit, currentThesis, onChange])

  const togglePosition = (id: string) => {
    setSelectedPositions(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const toggleThought = (id: string) => {
    setSelectedThoughts(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const handleThesisChange = (linked: boolean) => {
    setLinkToThesis(linked)
    if (linked) {
      setNoThesisExplicit(false)
    }
  }

  const handleNoThesisChange = (noThesis: boolean) => {
    setNoThesisExplicit(noThesis)
    if (noThesis) {
      setLinkToThesis(false)
    }
  }

  const sectionStyle = {
    marginBottom: '0.75rem',
    padding: '0.75rem',
    backgroundColor: '#f9fafb',
    borderRadius: '0.375rem',
    border: '1px solid #e5e7eb',
  }

  const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: '500' as const,
    color: '#374151',
    marginBottom: '0.5rem',
    display: 'block',
  }

  const chipStyle = (selected: boolean) => ({
    display: 'inline-block',
    padding: '0.25rem 0.625rem',
    margin: '0.125rem',
    backgroundColor: selected ? '#3b82f6' : '#e5e7eb',
    color: selected ? 'white' : '#4b5563',
    borderRadius: '1rem',
    fontSize: '0.8125rem',
    cursor: 'pointer',
    border: 'none',
  })

  const checkboxLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#374151',
    cursor: 'pointer',
  }

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
        Context (optional)
      </div>

      {/* NorthStar Section - only show if thesis exists (no friction when no thesis) */}
      {showNorthStar && currentThesis && (
        <div style={sectionStyle}>
          <span style={labelStyle}>
            Investment Thesis
            {northStarRequired && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
          </span>

          <div>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={linkToThesis}
                onChange={(e) => handleThesisChange(e.target.checked)}
              />
              Link to current thesis
            </label>
            {linkToThesis && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                backgroundColor: '#dbeafe',
                borderRadius: '0.25rem',
                fontSize: '0.8125rem',
                color: '#1e40af',
              }}>
                "{currentThesis.content.substring(0, 80)}{currentThesis.content.length > 80 ? '...' : ''}"
              </div>
            )}
            {/* Show "No related thesis" option when thesis exists but not linked */}
            {northStarRequired && !linkToThesis && (
              <label style={{ ...checkboxLabelStyle, marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={noThesisExplicit}
                  onChange={(e) => handleNoThesisChange(e.target.checked)}
                />
                <span style={{ color: '#6b7280' }}>No related thesis (explicit)</span>
              </label>
            )}
          </div>

          {northStarRequired && !linkToThesis && !noThesisExplicit && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: '#fef3c7',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              color: '#92400e',
            }}>
              Decision entries require linking to thesis or explicitly marking as unrelated.
            </div>
          )}
        </div>
      )}

      {/* Positions Section */}
      {showPositions && positions.length > 0 && (
        <div style={sectionStyle}>
          <span style={labelStyle}>Related Positions</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {positions.map(pos => (
              <button
                key={pos.id}
                type="button"
                onClick={() => togglePosition(pos.id)}
                style={chipStyle(selectedPositions.includes(pos.id))}
              >
                {pos.ticker}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Thoughts Section */}
      {showThoughts && thoughts.length > 0 && (
        <div style={sectionStyle}>
          <span style={labelStyle}>Related Thoughts</span>
          <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
            {thoughts.slice(0, 10).map(thought => {
              const kind = getThoughtKind(thought)
              const preview = thought.content.substring(0, 40) + (thought.content.length > 40 ? '...' : '')
              return (
                <button
                  key={thought.id}
                  type="button"
                  onClick={() => toggleThought(thought.id)}
                  style={{
                    ...chipStyle(selectedThoughts.includes(thought.id)),
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    marginBottom: '0.25rem',
                  }}
                >
                  {kind === 'mini_thesis' && (
                    <span style={{
                      fontSize: '0.625rem',
                      backgroundColor: '#a855f7',
                      color: 'white',
                      padding: '0.0625rem 0.25rem',
                      borderRadius: '0.125rem',
                      marginRight: '0.375rem',
                    }}>
                      THESIS
                    </span>
                  )}
                  {preview}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
