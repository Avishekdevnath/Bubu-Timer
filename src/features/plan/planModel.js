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
  const logNote = note && note.trim() ? note.trim() : null
  const next = mapItem(state, id, (it) => ({
    ...it,
    elapsedSec: liveElapsedSec(it, now),
    runStartTs: null,
    status,
    logs: logNote ? [...it.logs, { ts: now, note: logNote }] : it.logs,
  }))
  return { ...next, dailyPlan: { ...next.dailyPlan, activeItemId: null } }
}

export function pauseItem(state, { note, now }) {
  return freezeActive(state, { note, now, status: 'paused' })
}

export function markItemDone(state, { note, now }) {
  return freezeActive(state, { note, now, status: 'done' })
}

export function removeItemFromPlan(state, itemId) {
  if (!state.dailyPlan) return state
  const plan = state.dailyPlan
  if (plan.activeItemId === itemId) throw new Error('Cannot remove a running item')
  return {
    ...state,
    dailyPlan: {
      ...plan,
      items: plan.items.filter((it) => it.id !== itemId),
    },
  }
}

export function addItemToPlan(state, { subjectId, subjectName, desc, targetSec }) {
  if (!state.dailyPlan) return state
  const item = {
    id: newId(),
    subjectId: subjectId || null,
    subjectName: subjectName || 'Subject',
    desc: desc || '',
    targetSec: Math.max(60, targetSec || 0),
    elapsedSec: 0,
    runStartTs: null,
    status: 'idle',
    logs: [],
  }
  return {
    ...state,
    dailyPlan: { ...state.dailyPlan, items: [...state.dailyPlan.items, item] },
  }
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

export function updateItemInPlan(state, { id, targetSec, desc }) {
  if (!state.dailyPlan) return state
  return {
    ...state,
    dailyPlan: {
      ...state.dailyPlan,
      items: state.dailyPlan.items.map((it) =>
        it.id === id
          ? { ...it, targetSec: Math.max(60, targetSec ?? it.targetSec), desc: desc ?? it.desc }
          : it
      ),
    },
  }
}

export function autoPauseForAway(state, { id, now }) {
  if (!state.dailyPlan) return state
  const plan = state.dailyPlan
  if (plan.activeItemId !== id) return state
  return {
    ...state,
    dailyPlan: {
      ...plan,
      activeItemId: null,
      items: plan.items.map((it) =>
        it.id === id
          ? { ...it, elapsedSec: liveElapsedSec(it, now), runStartTs: null, status: 'paused' }
          : it
      ),
    },
  }
}

export function resumeAfterAway(state, { id, subtractSec, now, note }) {
  if (!state.dailyPlan) return state
  const plan = state.dailyPlan
  const item = plan.items.find((it) => it.id === id)
  if (!item) return state
  const newElapsed = Math.max(0, (item.elapsedSec || 0) - (subtractSec || 0))
  const logs = note ? [...item.logs, { ts: now, note }] : item.logs
  return {
    ...state,
    dailyPlan: {
      ...plan,
      activeItemId: id,
      items: plan.items.map((it) =>
        it.id === id
          ? { ...it, elapsedSec: newElapsed, runStartTs: now, status: 'running', logs }
          : it
      ),
    },
  }
}

export function saveFuturePlan(state, { date, items }) {
  return {
    ...state,
    futurePlans: { ...(state.futurePlans || {}), [date]: { date, items } },
  }
}

export function deleteFuturePlan(state, date) {
  const futurePlans = { ...(state.futurePlans || {}) }
  delete futurePlans[date]
  return { ...state, futurePlans }
}

export function autoActivateFuturePlan(state, todayDate) {
  if (state.dailyPlan) return state
  const fp = (state.futurePlans || {})[todayDate]
  if (!fp?.items?.length) return state
  const futurePlans = { ...(state.futurePlans || {}) }
  delete futurePlans[todayDate]
  return {
    ...state,
    futurePlans,
    dailyPlan: {
      date: todayDate,
      items: fp.items.map((it) => ({
        id: newId(),
        subjectId: it.subjectId || null,
        subjectName: it.subjectName || 'Subject',
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

export function autoArchiveIfPastCutoff(state, { todayDate, nowMinutes, now }) {
  const plan = state.dailyPlan
  if (!plan) return autoActivateFuturePlan(state, todayDate)
  const pastDay = plan.date < todayDate
  const pastCutoff = plan.date === todayDate && nowMinutes >= (state.dayCutoff ?? 0)
  if (pastDay || pastCutoff) {
    const archived = archive(state, plan, { endNote: null, now })
    return autoActivateFuturePlan(archived, todayDate)
  }
  return state
}
