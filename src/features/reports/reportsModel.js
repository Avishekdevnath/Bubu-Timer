import { dateKey, dhakaDate } from '../../lib/dates.js'

// ── Legacy (kept for reportsModel.test.js compatibility) ──────────────────
function targetForDate(state, date) {
  const active = state.activeTarget
  if (active && (active.date === date || (active.type === 'range' && date >= active.startDate && date <= active.endDate))) {
    return active
  }
  return (state.targets || []).find(
    (target) => target.date === date || (target.type === 'range' && target.startDate <= date && date <= target.endDate),
  )
}

export function computeDailySummary(state, date) {
  const events = (state.sessionEvents || []).filter((event) => event.date === date)
  const totalSessions = events.length
  const totalMin = events.reduce((sum, event) => sum + (event.durationMin || 0), 0)
  const subjectsBreakdown = {}
  events.forEach((event) => {
    const key = event.subjectId || '__none__'
    if (!subjectsBreakdown[key]) {
      subjectsBreakdown[key] = { name: event.subjectName || '(unknown)', sessions: 0, minutes: 0 }
    }
    subjectsBreakdown[key].sessions += 1
    subjectsBreakdown[key].minutes += event.durationMin || 0
  })
  const target = targetForDate(state, date)
  let achieved = false
  let goalLabel = ''
  let achievedLabel = ''
  if (target) {
    if (target.unit === 'hours') {
      achieved = totalMin / 60 >= target.goal
      goalLabel = `${target.goal}h`
      achievedLabel = `${(totalMin / 60).toFixed(1)}h`
    } else {
      achieved = totalSessions >= target.goal
      goalLabel = `${target.goal} sessions`
      achievedLabel = `${totalSessions} sessions`
    }
  }
  return { date, totalSessions, totalMin, subjectsBreakdown, target, achieved, goalLabel, achievedLabel }
}

export function computeStreak(state, now = new Date()) {
  let streak = 0
  const d = dhakaDate(now)
  d.setDate(d.getDate() - 1)
  for (let i = 0; i < 365; i += 1) {
    const key = dateKey(d)
    const summary = computeDailySummary(state, key)
    if (summary.target && summary.achieved) {
      streak += 1
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

// ── v2 plan-based reports ──────────────────────────────────────────────────

export function computeDayReport(state, date) {
  const active = state.dailyPlan?.date === date ? state.dailyPlan : null
  const archived = (state.planHistory || []).find((p) => p.date === date)
  const plan = active || archived
  if (!plan) return null
  const totalSec = plan.items.reduce((s, it) => s + (it.elapsedSec || 0), 0)
  return {
    date,
    totalMin: Math.floor(totalSec / 60),
    doneCount: plan.items.filter((i) => i.status === 'done').length,
    totalCount: plan.items.length,
    subjects: plan.items.map((i) => ({
      name: i.subjectName,
      min: Math.floor((i.elapsedSec || 0) / 60),
      status: i.status,
    })),
    endNote: plan.endNote || null,
    isActive: !!active,
  }
}

export function computePlanStreak(state, todayDate) {
  const byDate = new Set(
    (state.planHistory || [])
      .filter((p) => p.items.some((i) => (i.elapsedSec || 0) > 0))
      .map((p) => p.date),
  )
  let streak = 0
  const d = new Date(`${todayDate}T00:00:00`)
  for (let i = 0; i < 365; i += 1) {
    d.setDate(d.getDate() - 1)
    const key = d.toISOString().slice(0, 10)
    if (byDate.has(key)) streak += 1
    else break
  }
  return streak
}

export function computeAllTimeSubjects(state) {
  const totals = {}
  const allPlans = [...(state.planHistory || []), state.dailyPlan].filter(Boolean)
  allPlans.forEach((plan) => {
    plan.items.forEach((it) => {
      const key = it.subjectName || '(unknown)'
      if (!totals[key]) totals[key] = { name: key, minutes: 0, doneCount: 0 }
      totals[key].minutes += Math.floor((it.elapsedSec || 0) / 60)
      if (it.status === 'done') totals[key].doneCount += 1
    })
  })
  return Object.values(totals).sort((a, b) => b.minutes - a.minutes)
}

export function computeAllTotalMin(state) {
  const allPlans = [...(state.planHistory || []), state.dailyPlan].filter(Boolean)
  return Math.floor(allPlans.reduce((sum, p) => sum + p.items.reduce((s, it) => s + (it.elapsedSec || 0), 0), 0) / 60)
}
