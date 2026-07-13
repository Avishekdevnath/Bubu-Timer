export const STORAGE_KEY = 'bubu_state'
export const THEME_KEY = 'sonali_theme'
export const PAIR_KEY = 'bubu_pair'

export const STATE_VERSION = 2
export const DEFAULT_CUTOFF_MIN = 23 * 60 + 59 // 11:59 PM

export function createDefaultState() {
  return {
    version: STATE_VERSION,
    subjects: [],
    subjectProgress: {},
    chapterProgress: {},
    logs: [],
    dayCutoff: DEFAULT_CUTOFF_MIN,
    dailyPlan: null,
    planHistory: [],
    futurePlans: {},
    vocabFavorites: [],
  }
}
