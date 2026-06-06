import { describe, expect, it } from 'vitest'
import { toPlanPayload, fromPlanPayload } from './planSync.js'

const plan = {
  date: 'd', activeItemId: 'i1', endNote: null, endedAt: null,
  items: [{ id: 'i1', subjectName: 'Math', desc: 'Alg', targetSec: 600, elapsedSec: 60, runStartTs: 123, status: 'running', logs: [{ ts: 1, note: 'a' }] }],
}

describe('plan payload', () => {
  it('round-trips and strips nothing critical', () => {
    const raw = toPlanPayload(plan)
    expect(raw.activeItemId).toBe('i1')
    expect(raw.items[0].runStartTs).toBe(123)
    const back = fromPlanPayload(raw)
    expect(back.items[0].logs).toEqual([{ ts: 1, note: 'a' }])
  })
  it('null plan -> null payload, and back to null', () => {
    expect(toPlanPayload(null)).toBeNull()
    expect(fromPlanPayload(null)).toBeNull()
  })
  it('fromPlanPayload tolerates missing items/logs (RTDB drops empty arrays)', () => {
    const back = fromPlanPayload({ date: 'd', activeItemId: null })
    expect(back.items).toEqual([])
    expect(back.items.every?.((i) => Array.isArray(i.logs))).toBe(true)
  })
})
