import { todayStr } from '../../lib/dates.js'
import { newId } from '../subjects/subjectsModel.js'

export function getTargetProgress(state, target) {
  if (!target) return { value: 0, pct: 0, done: false, label: '', goalLabel: '' }
  const sessionsDone = Math.max(0, state.sessions - (target.snapshotSessions || 0))
  const minutesDone = Math.max(0, state.studyMin - (target.snapshotStudyMin || 0))
  if (target.unit === 'hours') {
    const value = minutesDone / 60
    const pct = target.goal > 0 ? Math.min(100, Math.round((value / target.goal) * 100)) : 0
    return {
      value,
      goal: target.goal,
      pct,
      done: value >= target.goal,
      label: `${value.toFixed(1)}h`,
      goalLabel: `${target.goal}h`,
      sessionsDone,
      minutesDone,
    }
  }
  const pct = target.goal > 0 ? Math.min(100, Math.round((sessionsDone / target.goal) * 100)) : 0
  return {
    value: sessionsDone,
    goal: target.goal,
    pct,
    done: sessionsDone >= target.goal,
    label: `${sessionsDone}`,
    goalLabel: `${target.goal} sessions`,
    sessionsDone,
    minutesDone,
  }
}

export function archiveActiveTarget(state) {
  if (!state.activeTarget) return state
  const progress = getTargetProgress(state, state.activeTarget)
  const archived = {
    ...state.activeTarget,
    completedAt: Date.now(),
    finalValue: progress.value,
    finalPct: progress.pct,
    achieved: progress.done,
  }
  return {
    ...state,
    activeTarget: null,
    targets: [...state.targets, archived].slice(-30),
  }
}

export function createTarget(state, { type = 'daily', unit = 'hours', goal = 1, endDate, today = todayStr() }) {
  const base = state.activeTarget ? archiveActiveTarget(state) : state
  const isRange = type === 'range'
  return {
    ...base,
    activeTarget: {
      id: newId(),
      type: isRange ? 'range' : 'daily',
      unit: unit === 'sessions' ? 'sessions' : 'hours',
      goal: Math.max(0.25, Number(goal) || 1),
      date: today,
      startDate: today,
      endDate: isRange ? endDate || today : today,
      snapshotSessions: base.sessions,
      snapshotStudyMin: base.studyMin,
      createdAt: Date.now(),
    },
  }
}

export function checkRolloverActiveTarget(state, today = todayStr()) {
  if (!state.activeTarget) return state
  if (state.activeTarget.type === 'range') {
    return state.activeTarget.endDate && today > state.activeTarget.endDate ? archiveActiveTarget(state) : state
  }
  return state.activeTarget.date !== today ? archiveActiveTarget(state) : state
}
