import { describe, expect, it, beforeEach } from 'vitest'
import { loadStoredState } from './storage.js'
import { STORAGE_KEY } from '../state/defaultState.js'

describe('loadStoredState v2 migration', () => {
  beforeEach(() => localStorage.clear())

  it('keeps subjects, drops legacy progress', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      subjects: [{ id: 's1', name: 'Math', chapters: [] }],
      subjectProgress: { s1: 3 },
      sessions: 10, bankMin: 50, studyMin: 200,
      mode: 'study', timeLeft: 99, activeTarget: { id: 't' },
      sessionEvents: [{ date: 'd' }],
    }))
    const s = loadStoredState()
    expect(s.version).toBe(2)
    expect(s.subjects).toHaveLength(1)
    expect(s.subjectProgress).toEqual({ s1: 3 })
    expect(s.dailyPlan).toBeNull()
    expect(s.planHistory).toEqual([])
    expect(s.sessions).toBeUndefined()
    expect(s.bankMin).toBeUndefined()
    expect(s.activeTarget).toBeUndefined()
  })

  it('returns default when empty', () => {
    expect(loadStoredState().version).toBe(2)
  })
})
