import { describe, expect, it } from 'vitest'
import { createDefaultState } from '../../state/defaultState.js'
import { addChapter, addSubject } from '../subjects/subjectsModel.js'
import { completeStudySession } from './timerEngine.js'

describe('timer engine', () => {
  it('credits a completed study session to active subject and chapter', () => {
    const withSubject = addSubject(createDefaultState(), { name: 'Math' })
    const withChapter = addChapter(withSubject, withSubject.subjects[0].id, { name: 'Algebra' })
    const subjectId = withChapter.activeSubjectId
    const chapterId = withChapter.activeChapterId
    const next = completeStudySession(withChapter, 20, '2026-05-24')

    expect(next.sessions).toBe(1)
    expect(next.studyMin).toBe(20)
    expect(next.subjectProgress[subjectId]).toBe(1)
    expect(next.chapterProgress[chapterId]).toBe(1)
    expect(next.pendingBreakSec).toBe(300)
    expect(next.sessionEvents).toHaveLength(1)
  })
})
