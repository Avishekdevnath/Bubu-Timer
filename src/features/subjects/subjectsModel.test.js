import { describe, expect, it } from 'vitest'
import { addChapter, addSubject, deleteSubject, getChapter, getSubject } from './subjectsModel.js'
import { createDefaultState } from '../../state/defaultState.js'

describe('subjects model', () => {
  it('adds the first subject and selects it for the timer', () => {
    const state = createDefaultState()
    const next = addSubject(state, { name: 'Networking', pages: '396-435', priority: 'must' })

    expect(next.subjects).toHaveLength(1)
    expect(next.subjects[0].name).toBe('Networking')
    expect(next.activeSubjectId).toBe(next.subjects[0].id)
    expect(next.activeChapterId).toBeNull()
  })

  it('adds a chapter and selects it when its subject is active', () => {
    const withSubject = addSubject(createDefaultState(), { name: 'DBMS' })
    const subjectId = withSubject.subjects[0].id
    const next = addChapter(withSubject, subjectId, { name: 'Normalization', pages: 'Ch. 3' })

    expect(next.subjects[0].chapters).toHaveLength(1)
    expect(next.activeChapterId).toBe(next.subjects[0].chapters[0].id)
    expect(getChapter(next, next.activeChapterId).chapter.name).toBe('Normalization')
  })

  it('deletes a subject and clears its subject and chapter progress', () => {
    const withSubject = addSubject(createDefaultState(), { name: 'OS' })
    const subjectId = withSubject.subjects[0].id
    const withChapter = addChapter(withSubject, subjectId, { name: 'Memory' })
    const chapterId = withChapter.subjects[0].chapters[0].id
    const progressed = {
      ...withChapter,
      subjectProgress: { [subjectId]: 2 },
      chapterProgress: { [chapterId]: 1 },
    }
    const next = deleteSubject(progressed, subjectId)

    expect(getSubject(next, subjectId)).toBeNull()
    expect(next.subjectProgress[subjectId]).toBeUndefined()
    expect(next.chapterProgress[chapterId]).toBeUndefined()
    expect(next.activeSubjectId).toBeNull()
  })
})
