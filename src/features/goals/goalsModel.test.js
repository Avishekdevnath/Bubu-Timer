import { describe, expect, it } from 'vitest'
import { createDefaultState } from '../../state/defaultState.js'
import { createTarget, getTargetProgress } from './goalsModel.js'

describe('goals model', () => {
  it('creates a target with progress snapshots', () => {
    const state = { ...createDefaultState(), sessions: 3, studyMin: 60 }
    const next = createTarget(state, { type: 'daily', unit: 'hours', goal: 2, today: '2026-05-24' })

    expect(next.activeTarget.snapshotSessions).toBe(3)
    expect(next.activeTarget.snapshotStudyMin).toBe(60)
    expect(next.activeTarget.date).toBe('2026-05-24')
  })

  it('computes hour progress from the target snapshot', () => {
    const state = {
      ...createDefaultState(),
      studyMin: 180,
      activeTarget: {
        id: 'target-1',
        type: 'daily',
        unit: 'hours',
        goal: 2,
        date: '2026-05-24',
        snapshotSessions: 0,
        snapshotStudyMin: 60,
      },
    }

    expect(getTargetProgress(state, state.activeTarget)).toMatchObject({
      value: 2,
      pct: 100,
      done: true,
      label: '2.0h',
      goalLabel: '2h',
    })
  })
})
