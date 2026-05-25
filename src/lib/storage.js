import { createDefaultState, PAIR_KEY, STORAGE_KEY, THEME_KEY } from '../state/defaultState.js'

export function loadStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultState()
    const saved = JSON.parse(raw)
    return {
      ...createDefaultState(),
      subjects: Array.isArray(saved.subjects) ? saved.subjects.map((s) => ({ ...s, chapters: Array.isArray(s.chapters) ? s.chapters : [] })) : [],
      subjectProgress: saved.subjectProgress && typeof saved.subjectProgress === 'object' ? saved.subjectProgress : {},
      chapterProgress: saved.chapterProgress && typeof saved.chapterProgress === 'object' ? saved.chapterProgress : {},
      targets: Array.isArray(saved.targets) ? saved.targets : [],
      activeTarget: saved.activeTarget && typeof saved.activeTarget === 'object' ? saved.activeTarget : null,
      sessionEvents: Array.isArray(saved.sessionEvents) ? saved.sessionEvents : [],
      lastReportShownDate: saved.lastReportShownDate || null,
      sessions: saved.sessions || 0,
      bankMin: saved.bankMin || 0,
      studyMin: saved.studyMin || 0,
      activeSubjectId: saved.activeSubjectId || null,
      activeChapterId: saved.activeChapterId || null,
      subjectsCompleted: saved.subjectsCompleted || 0,
      studyDuration: saved.studyDuration || 20,
      breakDuration: saved.breakDuration || 5,
      mode: saved.mode || 'idle',
      timeLeft: saved.timeLeft != null ? saved.timeLeft : (saved.studyDuration || 20) * 60,
      totalTime: saved.totalTime || (saved.studyDuration || 20) * 60,
      endTs: saved.endTs || null,
      pausedRemaining: saved.pausedRemaining != null ? saved.pausedRemaining : null,
      pendingBreakSec: saved.pendingBreakSec != null ? saved.pendingBreakSec : null,
    }
  } catch {
    return createDefaultState()
  }
}

export function saveStoredState(state) {
  try {
    const persisted = { ...state }
    delete persisted.logs
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...persisted,
        isRunning: state.mode !== 'idle' && !!state.endTs,
        savedAt: Date.now(),
      }),
    )
  } catch {
    // private mode or quota
  }
}

export function loadThemeValue() {
  try {
    return localStorage.getItem(THEME_KEY) || 'light'
  } catch {
    return 'light'
  }
}

export function saveThemeValue(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // ignore
  }
}

export function loadStoredPairing() {
  try {
    const raw = localStorage.getItem(PAIR_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveStoredPairing(pairing) {
  try {
    localStorage.setItem(PAIR_KEY, JSON.stringify(pairing))
  } catch {
    // ignore
  }
}

export function clearStoredPairing() {
  try {
    localStorage.removeItem(PAIR_KEY)
  } catch {
    // ignore
  }
}
