import { getChapter, getSubject } from '../subjects/subjectsModel.js'

export function completeStudySession(state, durationMin = state.studyDuration, date) {
  const subjectId = state.activeSubjectId
  const chapterId = state.activeChapterId
  const subject = subjectId ? getSubject(state, subjectId) : null
  const chapter = chapterId ? getChapter(state, chapterId)?.chapter : null
  return {
    ...state,
    mode: 'idle',
    sessions: state.sessions + 1,
    studyMin: (state.sessions + 1) * durationMin,
    subjectProgress: subjectId
      ? { ...state.subjectProgress, [subjectId]: (state.subjectProgress[subjectId] || 0) + 1 }
      : state.subjectProgress,
    chapterProgress: chapterId
      ? { ...state.chapterProgress, [chapterId]: (state.chapterProgress[chapterId] || 0) + 1 }
      : state.chapterProgress,
    sessionEvents: [
      ...state.sessionEvents,
      {
        date,
        subjectId: subjectId || null,
        subjectName: subject?.name || '(unknown)',
        chapterId: chapterId || null,
        chapterName: chapter?.name || null,
        durationMin,
        ts: Date.now(),
      },
    ].slice(-300),
    endTs: null,
    pausedRemaining: null,
    pendingBreakSec: state.breakDuration * 60,
  }
}

export function startStudy(state, now = Date.now()) {
  const total = state.studyDuration * 60
  return {
    ...state,
    mode: 'study',
    timeLeft: total,
    totalTime: total,
    endTs: now + total * 1000,
    pausedRemaining: null,
  }
}

export function startBreak(state, seconds, now = Date.now()) {
  return {
    ...state,
    mode: 'break',
    timeLeft: seconds,
    totalTime: seconds,
    endTs: now + seconds * 1000,
    pausedRemaining: null,
    pendingBreakSec: null,
  }
}

export function resetToIdle(state) {
  const total = state.studyDuration * 60
  return {
    ...state,
    mode: 'idle',
    timeLeft: total,
    totalTime: total,
    endTs: null,
    pausedRemaining: null,
  }
}
