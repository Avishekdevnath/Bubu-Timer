import { dateKey, dhakaDate } from '../../lib/dates.js'

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
