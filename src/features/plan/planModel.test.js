import { describe, expect, it } from 'vitest'
import { createDefaultState } from '../../state/defaultState.js'
import { buildPlan, liveElapsedSec, itemRemainingSec, startItem, pauseItem, markItemDone, endDay, autoArchiveIfPastCutoff } from './planModel.js'

const SUBJ = { subjectId: 's1', subjectName: 'Math', desc: 'Algebra', targetSec: 3600 }

describe('liveElapsedSec', () => {
  it('returns frozen elapsed when not running', () => {
    expect(liveElapsedSec({ elapsedSec: 120, runStartTs: null }, 999)).toBe(120)
  })
  it('adds wall-clock delta when running', () => {
    expect(liveElapsedSec({ elapsedSec: 100, runStartTs: 10_000 }, 70_000)).toBe(160)
  })
})

describe('itemRemainingSec', () => {
  it('is positive before target', () => {
    expect(itemRemainingSec({ targetSec: 600, elapsedSec: 100, runStartTs: null }, 0)).toBe(500)
  })
  it('goes negative in overtime', () => {
    expect(itemRemainingSec({ targetSec: 600, elapsedSec: 700, runStartTs: null }, 0)).toBe(-100)
  })
})

describe('buildPlan', () => {
  it('creates a plan with idle items', () => {
    const s = buildPlan(createDefaultState(), { date: '2026-06-07', items: [SUBJ] })
    expect(s.dailyPlan.date).toBe('2026-06-07')
    expect(s.dailyPlan.items).toHaveLength(1)
    expect(s.dailyPlan.items[0]).toMatchObject({ subjectId: 's1', targetSec: 3600, elapsedSec: 0, status: 'idle', runStartTs: null })
    expect(s.dailyPlan.items[0].id).toBeTruthy()
    expect(s.dailyPlan.activeItemId).toBeNull()
  })
})

function planWithOne() {
  const s = buildPlan(createDefaultState(), { date: 'd', items: [SUBJ] })
  const id = s.dailyPlan.items[0].id
  return { s, id }
}

describe('startItem', () => {
  it('sets running + runStartTs + active', () => {
    const { s, id } = planWithOne()
    const next = startItem(s, id, 5000)
    const it = next.dailyPlan.items[0]
    expect(it.status).toBe('running')
    expect(it.runStartTs).toBe(5000)
    expect(next.dailyPlan.activeItemId).toBe(id)
  })
  it('throws if another item already running', () => {
    const s = buildPlan(createDefaultState(), { date: 'd', items: [SUBJ, { ...SUBJ, subjectId: 's2' }] })
    const a = s.dailyPlan.items[0].id
    const b = s.dailyPlan.items[1].id
    const running = startItem(s, a, 1000)
    expect(() => startItem(running, b, 2000)).toThrow(/already running/i)
  })
})

describe('pauseItem', () => {
  it('freezes elapsed, appends log, clears active', () => {
    const { s, id } = planWithOne()
    const running = startItem(s, id, 10_000)
    const paused = pauseItem(running, { note: 'did VLAN', now: 70_000 })
    const it = paused.dailyPlan.items[0]
    expect(it.status).toBe('paused')
    expect(it.runStartTs).toBeNull()
    expect(it.elapsedSec).toBe(60)
    expect(it.logs).toHaveLength(1)
    expect(it.logs[0].note).toBe('did VLAN')
    expect(it.logs[0].ts).toBe(70_000)
    expect(paused.dailyPlan.activeItemId).toBeNull()
  })
  it('accepts empty note and logs without note entry', () => {
    const { s, id } = planWithOne()
    const running = startItem(s, id, 1000)
    const paused = pauseItem(running, { note: '', now: 2000 })
    expect(paused.dailyPlan.items[0].status).toBe('paused')
    expect(paused.dailyPlan.items[0].logs).toHaveLength(0)
  })
  it('throws when nothing running', () => {
    const { s } = planWithOne()
    expect(() => pauseItem(s, { note: 'x', now: 1 })).toThrow(/nothing running/i)
  })
})

describe('markItemDone', () => {
  it('pauses and sets done', () => {
    const { s, id } = planWithOne()
    const running = startItem(s, id, 1000)
    const done = markItemDone(running, { note: 'finished', now: 4000 })
    expect(done.dailyPlan.items[0].status).toBe('done')
    expect(done.dailyPlan.activeItemId).toBeNull()
  })
})

describe('endDay', () => {
  it('archives plan, freezes active, records endNote', () => {
    const { s, id } = planWithOne()
    const running = startItem(s, id, 1000)
    const ended = endDay(running, { endNote: 'good day', now: 4000 })
    expect(ended.dailyPlan).toBeNull()
    expect(ended.planHistory).toHaveLength(1)
    expect(ended.planHistory[0].endNote).toBe('good day')
    expect(ended.planHistory[0].endedAt).toBe(4000)
    expect(ended.planHistory[0].items[0].runStartTs).toBeNull()
    expect(ended.planHistory[0].items[0].elapsedSec).toBe(3)
  })
})

describe('autoArchiveIfPastCutoff', () => {
  it('archives a past-day plan', () => {
    const s = buildPlan(createDefaultState(), { date: '2026-06-06', items: [SUBJ] })
    const out = autoArchiveIfPastCutoff(s, { todayDate: '2026-06-07', nowMinutes: 60, now: 9 })
    expect(out.dailyPlan).toBeNull()
    expect(out.planHistory).toHaveLength(1)
  })
  it('archives today plan past cutoff', () => {
    const s = { ...buildPlan(createDefaultState(), { date: '2026-06-07', items: [SUBJ] }), dayCutoff: 1380 }
    const out = autoArchiveIfPastCutoff(s, { todayDate: '2026-06-07', nowMinutes: 1400, now: 9 })
    expect(out.dailyPlan).toBeNull()
  })
  it('leaves today plan before cutoff untouched', () => {
    const s = { ...buildPlan(createDefaultState(), { date: '2026-06-07', items: [SUBJ] }), dayCutoff: 1380 }
    const out = autoArchiveIfPastCutoff(s, { todayDate: '2026-06-07', nowMinutes: 600, now: 9 })
    expect(out.dailyPlan).not.toBeNull()
  })
  it('no-op when no plan', () => {
    const s = createDefaultState()
    expect(autoArchiveIfPastCutoff(s, { todayDate: 'd', nowMinutes: 0, now: 0 })).toBe(s)
  })
})
