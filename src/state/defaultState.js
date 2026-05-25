export const STORAGE_KEY = 'bubu_state'
export const THEME_KEY = 'sonali_theme'
export const PAIR_KEY = 'bubu_pair'

export function createDefaultState() {
  return {
    subjects: [],
    subjectProgress: {},
    chapterProgress: {},
    targets: [],
    activeTarget: null,
    sessionEvents: [],
    lastReportShownDate: null,
    logs: [],
    mode: 'idle',
    timeLeft: 20 * 60,
    totalTime: 20 * 60,
    endTs: null,
    pausedRemaining: null,
    pendingBreakSec: null,
    sessions: 0,
    bankMin: 0,
    studyMin: 0,
    activeSubjectId: null,
    activeChapterId: null,
    subjectsCompleted: 0,
    studyDuration: 20,
    breakDuration: 5,
  }
}
