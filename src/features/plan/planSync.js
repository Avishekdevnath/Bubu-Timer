// RTDB drops empty arrays/objects and rejects `undefined`; normalize both ways.
export function toPlanPayload(plan) {
  if (!plan) return null
  return {
    date: plan.date,
    activeItemId: plan.activeItemId ?? null,
    endNote: plan.endNote ?? null,
    endedAt: plan.endedAt ?? null,
    items: (plan.items || []).map((it) => ({
      id: it.id,
      subjectName: it.subjectName || '',
      desc: it.desc || '',
      targetSec: it.targetSec || 0,
      elapsedSec: it.elapsedSec || 0,
      runStartTs: it.runStartTs ?? null,
      status: it.status || 'idle',
      logs: (it.logs || []).map((l) => ({ ts: l.ts, note: l.note })),
    })),
  }
}

export function fromPlanPayload(raw) {
  if (!raw) return null
  return {
    date: raw.date || '',
    activeItemId: raw.activeItemId ?? null,
    endNote: raw.endNote ?? null,
    endedAt: raw.endedAt ?? null,
    items: (raw.items || []).map((it) => ({
      id: it.id,
      subjectName: it.subjectName || '',
      desc: it.desc || '',
      targetSec: it.targetSec || 0,
      elapsedSec: it.elapsedSec || 0,
      runStartTs: it.runStartTs ?? null,
      status: it.status || 'idle',
      logs: Array.isArray(it.logs) ? it.logs : [],
    })),
  }
}
