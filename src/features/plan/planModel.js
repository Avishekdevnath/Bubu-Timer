import { newId } from '../subjects/subjectsModel.js'

export function liveElapsedSec(item, now) {
  const base = item.elapsedSec || 0
  if (!item.runStartTs) return base
  return base + Math.floor((now - item.runStartTs) / 1000)
}

export function itemRemainingSec(item, now) {
  return item.targetSec - liveElapsedSec(item, now)
}

export function buildPlan(state, { date, items }) {
  return {
    ...state,
    dailyPlan: {
      date,
      items: items.map((it) => ({
        id: newId(),
        subjectId: it.subjectId,
        subjectName: it.subjectName,
        desc: it.desc || '',
        targetSec: Math.max(60, it.targetSec || 0),
        elapsedSec: 0,
        runStartTs: null,
        status: 'idle',
        logs: [],
      })),
      activeItemId: null,
      endNote: null,
      endedAt: null,
    },
  }
}

function mapItem(state, id, fn) {
  return {
    ...state,
    dailyPlan: {
      ...state.dailyPlan,
      items: state.dailyPlan.items.map((it) => (it.id === id ? fn(it) : it)),
    },
  }
}

export function startItem(state, id, now) {
  const plan = state.dailyPlan
  if (plan.activeItemId && plan.activeItemId !== id) {
    throw new Error('Another subject is already running')
  }
  const next = mapItem(state, id, (it) => ({ ...it, status: 'running', runStartTs: now }))
  return { ...next, dailyPlan: { ...next.dailyPlan, activeItemId: id } }
}

function freezeActive(state, { note, now, status }) {
  const plan = state.dailyPlan
  const id = plan.activeItemId
  if (!id) throw new Error('Nothing running')
  if (!note || !note.trim()) throw new Error('Note required')
  const next = mapItem(state, id, (it) => ({
    ...it,
    elapsedSec: liveElapsedSec(it, now),
    runStartTs: null,
    status,
    logs: [...it.logs, { ts: now, note: note.trim() }],
  }))
  return { ...next, dailyPlan: { ...next.dailyPlan, activeItemId: null } }
}

export function pauseItem(state, { note, now }) {
  return freezeActive(state, { note, now, status: 'paused' })
}

export function markItemDone(state, { note, now }) {
  return freezeActive(state, { note, now, status: 'done' })
}

function archive(state, plan, { endNote = null, now }) {
  const items = plan.items.map((it) =>
    it.runStartTs
      ? { ...it, elapsedSec: liveElapsedSec(it, now), runStartTs: null, status: it.status === 'running' ? 'paused' : it.status }
      : it,
  )
  const archived = { ...plan, items, activeItemId: null, endNote, endedAt: now }
  return {
    ...state,
    dailyPlan: null,
    planHistory: [...(state.planHistory || []), archived].slice(-60),
  }
}

export function endDay(state, { endNote, now }) {
  if (!state.dailyPlan) return state
  return archive(state, state.dailyPlan, { endNote: endNote || null, now })
}

export function autoArchiveIfPastCutoff(state, { todayDate, nowMinutes, now }) {
  const plan = state.dailyPlan
  if (!plan) return state
  const pastDay = plan.date < todayDate
  const pastCutoff = plan.date === todayDate && nowMinutes >= (state.dayCutoff ?? 0)
  if (pastDay || pastCutoff) return archive(state, plan, { endNote: null, now })
  return state
}
