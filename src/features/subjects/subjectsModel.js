const VALID_PRIORITIES = ['must', 'high', 'medium']

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function getSubject(state, id) {
  return state.subjects.find((subject) => subject.id === id) || null
}

export function getChapter(state, chapterId) {
  for (const subject of state.subjects) {
    const chapter = (subject.chapters || []).find((item) => item.id === chapterId)
    if (chapter) return { chapter, subject }
  }
  return null
}

export function getActiveSubject(state) {
  return state.activeSubjectId ? getSubject(state, state.activeSubjectId) : null
}

export function getActiveChapter(state) {
  return state.activeChapterId ? getChapter(state, state.activeChapterId)?.chapter || null : null
}

export function addSubject(state, data) {
  const name = String(data.name || '').trim()
  if (!name) return state
  const subject = {
    id: newId(),
    name,
    sessions: 0,
    pages: String(data.pages || '').trim(),
    priority: VALID_PRIORITIES.includes(data.priority) ? data.priority : 'medium',
    chapters: [],
  }
  return {
    ...state,
    subjects: [...state.subjects, subject],
    activeSubjectId: state.activeSubjectId || subject.id,
    activeChapterId: state.activeSubjectId ? state.activeChapterId : null,
  }
}

export function updateSubject(state, id, patch) {
  return {
    ...state,
    subjects: state.subjects.map((subject) =>
      subject.id === id
        ? {
            ...subject,
            name: patch.name != null ? String(patch.name).trim() || subject.name : subject.name,
            pages: patch.pages != null ? String(patch.pages).trim() : subject.pages,
            priority: VALID_PRIORITIES.includes(patch.priority) ? patch.priority : subject.priority,
          }
        : subject,
    ),
  }
}

export function deleteSubject(state, id) {
  const removed = getSubject(state, id)
  if (!removed) return state
  const chapterIds = new Set((removed.chapters || []).map((chapter) => chapter.id))
  const subjectProgress = { ...state.subjectProgress }
  const chapterProgress = { ...state.chapterProgress }
  delete subjectProgress[id]
  chapterIds.forEach((chapterId) => delete chapterProgress[chapterId])
  const subjects = state.subjects.filter((subject) => subject.id !== id)
  const nextActive = state.activeSubjectId === id ? subjects[0]?.id || null : state.activeSubjectId
  return {
    ...state,
    subjects,
    subjectProgress,
    chapterProgress,
    activeSubjectId: nextActive,
    activeChapterId: state.activeSubjectId === id ? null : state.activeChapterId,
  }
}

export function addChapter(state, subjectId, data) {
  const name = String(data.name || '').trim()
  if (!name) return state
  const chapter = {
    id: newId(),
    name,
    sessions: 0,
    pages: String(data.pages || '').trim(),
  }
  return {
    ...state,
    subjects: state.subjects.map((subject) =>
      subject.id === subjectId
        ? { ...subject, chapters: [...(subject.chapters || []), chapter] }
        : subject,
    ),
    activeChapterId:
      state.activeSubjectId === subjectId && !state.activeChapterId ? chapter.id : state.activeChapterId,
  }
}

export function updateChapter(state, chapterId, patch) {
  return {
    ...state,
    subjects: state.subjects.map((subject) => ({
      ...subject,
      chapters: (subject.chapters || []).map((chapter) =>
        chapter.id === chapterId
          ? {
              ...chapter,
              name: patch.name != null ? String(patch.name).trim() || chapter.name : chapter.name,
              pages: patch.pages != null ? String(patch.pages).trim() : chapter.pages,
            }
          : chapter,
      ),
    })),
  }
}

export function deleteChapter(state, chapterId) {
  const chapterProgress = { ...state.chapterProgress }
  delete chapterProgress[chapterId]
  return {
    ...state,
    chapterProgress,
    subjects: state.subjects.map((subject) => ({
      ...subject,
      chapters: (subject.chapters || []).filter((chapter) => chapter.id !== chapterId),
    })),
    activeChapterId: state.activeChapterId === chapterId ? null : state.activeChapterId,
  }
}
