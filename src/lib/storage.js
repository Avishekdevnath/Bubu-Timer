import { createDefaultState, DEFAULT_CUTOFF_MIN, PAIR_KEY, STATE_VERSION, STORAGE_KEY, THEME_KEY } from '../state/defaultState.js'

export function loadStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultState()
    const saved = JSON.parse(raw)
    return {
      ...createDefaultState(),
      subjects: Array.isArray(saved.subjects)
        ? saved.subjects.map((s) => ({ ...s, chapters: Array.isArray(s.chapters) ? s.chapters : [] }))
        : [],
      subjectProgress: saved.subjectProgress && typeof saved.subjectProgress === 'object' ? saved.subjectProgress : {},
      chapterProgress: saved.chapterProgress && typeof saved.chapterProgress === 'object' ? saved.chapterProgress : {},
      dayCutoff: typeof saved.dayCutoff === 'number' ? saved.dayCutoff : DEFAULT_CUTOFF_MIN,
      dailyPlan: saved.version === STATE_VERSION && saved.dailyPlan ? saved.dailyPlan : null,
      planHistory: saved.version === STATE_VERSION && Array.isArray(saved.planHistory) ? saved.planHistory : [],
    }
  } catch {
    return createDefaultState()
  }
}

export function saveStoredState(state) {
  try {
    const persisted = { ...state }
    delete persisted.logs
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...persisted, savedAt: Date.now() }))
  } catch { /* private mode or quota */ }
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
