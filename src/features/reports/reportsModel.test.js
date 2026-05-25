import { describe, expect, it } from 'vitest'
import { computeDailySummary } from './reportsModel.js'

describe('reports model', () => {
  it('groups daily sessions by subject and checks goal achievement', () => {
    const state = {
      sessionEvents: [
        { date: '2026-05-24', subjectId: 'net', subjectName: 'Networking', durationMin: 20 },
        { date: '2026-05-24', subjectId: 'net', subjectName: 'Networking', durationMin: 20 },
      ],
      activeTarget: { type: 'daily', unit: 'sessions', goal: 2, date: '2026-05-24' },
      targets: [],
    }

    const summary = computeDailySummary(state, '2026-05-24')

    expect(summary.totalSessions).toBe(2)
    expect(summary.totalMin).toBe(40)
    expect(summary.subjectsBreakdown.net.sessions).toBe(2)
    expect(summary.achieved).toBe(true)
  })
})
