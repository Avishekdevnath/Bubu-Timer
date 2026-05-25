import { BookOpen, Settings, Trash2 } from 'lucide-react'
import { deleteChapter, deleteSubject } from '../features/subjects/subjectsModel.js'

const priorityMeta = {
  must: { label: 'Must Know' },
  high: { label: 'High Priority' },
  medium: { label: 'Medium' },
}
const priorityColors = { must: 'bg-red-500', high: 'bg-amber-500', medium: 'bg-stone-400' }

export function SubjectsPage({ appState, search, setSearch, setSubjectModal, expanded, setExpanded, patchState, navigate, showToast }) {
  const groups = { must: [], high: [], medium: [] }
  appState.subjects.forEach((subject) => {
    const match = !search || subject.name.toLowerCase().includes(search.toLowerCase()) || (subject.chapters || []).some((ch) => ch.name.toLowerCase().includes(search.toLowerCase()))
    if (match) groups[subject.priority || 'medium'].push(subject)
  })

  function selectSubject(subjectId) {
    if (appState.mode !== 'idle') return showToast('Stop timer first', 'bank-t')
    patchState({ activeSubjectId: subjectId, activeChapterId: null })
    navigate('/')
  }

  function selectChapter(subjectId, chapterId) {
    if (appState.mode !== 'idle') return showToast('Stop timer first', 'bank-t')
    patchState({ activeSubjectId: subjectId, activeChapterId: chapterId })
    navigate('/')
  }

  return (
    <div className="w-full px-4 md:px-6 pt-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-light tracking-tight text-stone-800">Subjects</h2>
          <p className="text-sm text-stone-500 mt-0.5">{appState.subjects.length} subjects</p>
        </div>
        <button onClick={() => setSubjectModal({ mode: 'subject' })}
          className="flex items-center gap-1 text-sm font-medium text-stone-600 bg-white border border-stone-200 px-4 py-2 rounded-full shadow-sm hover:bg-stone-50 transition-colors">
          + New
        </button>
      </div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
        className="w-full mb-5 bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-stone-400 placeholder:text-stone-300 shadow-sm" />

      {!appState.subjects.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-stone-400">
          <BookOpen size={36} strokeWidth={1} className="mb-3" />
          <p className="text-sm">No subjects yet. Add one above.</p>
        </div>
      ) : Object.entries(groups).map(([priority, subjects]) => subjects.length ? (
        <div className="mb-6" key={priority}>
          <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">{priorityMeta[priority].label}</p>
          <div className="space-y-2">
            {subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                appState={appState}
                expanded={expanded}
                setExpanded={setExpanded}
                patchState={patchState}
                setSubjectModal={setSubjectModal}
                selectSubject={selectSubject}
                selectChapter={selectChapter}
              />
            ))}
          </div>
        </div>
      ) : null)}
    </div>
  )
}

function SubjectCard({ subject, appState, expanded, setExpanded, patchState, setSubjectModal, selectSubject, selectChapter }) {
  const isOpen = expanded.has(subject.id)
  const selected = appState.activeSubjectId === subject.id && !appState.activeChapterId
  const dotColor = priorityColors[subject.priority || 'medium']
  return (
    <div className={`rounded-2xl border overflow-hidden shadow-sm transition-colors ${selected ? 'border-stone-400 bg-stone-50' : 'border-stone-100 bg-white'}`}>
      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-stone-50 transition-colors"
        onClick={() => setExpanded((old) => old.has(subject.id) ? new Set([...old].filter(id => id !== subject.id)) : new Set(old).add(subject.id))}>
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-stone-800 text-sm truncate">
            {subject.name}
            {(subject.chapters || []).length ? <span className="ml-1.5 text-[10px] text-stone-400 font-normal">{subject.chapters.length} ch</span> : null}
          </p>
          {subject.pages ? <p className="text-xs text-stone-400 mt-0.5">Pages {subject.pages}</p> : null}
        </div>
        <span className="text-xs font-semibold text-stone-500 shrink-0">{appState.subjectProgress[subject.id] || 0} sessions</span>
        <button className="p-1 text-stone-400 hover:text-stone-700" onClick={(e) => { e.stopPropagation(); setSubjectModal({ mode: 'subject', id: subject.id }) }}>
          <Settings size={14} />
        </button>
        <button className="p-1 text-stone-300 hover:text-red-500" onClick={(e) => { e.stopPropagation(); window.confirm(`Delete "${subject.name}"?`) && patchState((s) => deleteSubject(s, subject.id)) }}>
          <Trash2 size={14} />
        </button>
      </div>

      {isOpen ? (
        <div className="border-t border-stone-100 bg-stone-50 px-4 py-3 space-y-2">
          {!(subject.chapters || []).length ? (
            <>
              <p className="text-xs text-stone-400 mb-2">No chapters yet. Use as-is or split into chapters.</p>
              <button onClick={() => selectSubject(subject.id)}
                className={`w-full py-2 rounded-xl text-sm font-medium border transition-colors ${selected ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'}`}>
                {selected ? '✓ Selected for timer' : 'Use as-is'}
              </button>
            </>
          ) : subject.chapters.map((chapter) => (
            <div key={chapter.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${appState.activeChapterId === chapter.id ? 'border-stone-400 bg-white' : 'border-stone-200 bg-white hover:bg-stone-100'}`}
              onClick={() => selectChapter(subject.id, chapter.id)}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800 truncate">{chapter.name}</p>
                {chapter.pages ? <p className="text-xs text-stone-400 mt-0.5">Pages {chapter.pages}</p> : null}
              </div>
              <span className="text-xs text-stone-400 shrink-0">{appState.chapterProgress[chapter.id] || 0} sessions</span>
              <button className="p-1 text-stone-300 hover:text-stone-600" onClick={(e) => { e.stopPropagation(); setSubjectModal({ mode: 'chapter', subjectId: subject.id, id: chapter.id }) }}>
                <Settings size={13} />
              </button>
              <button className="p-1 text-stone-300 hover:text-red-500" onClick={(e) => { e.stopPropagation(); window.confirm(`Delete "${chapter.name}"?`) && patchState((s) => deleteChapter(s, chapter.id)) }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button onClick={() => setSubjectModal({ mode: 'chapter', subjectId: subject.id })}
            className="w-full py-2 rounded-xl text-xs font-bold tracking-wide text-stone-500 border border-dashed border-stone-300 hover:border-stone-500 hover:text-stone-700 transition-colors">
            + Add Chapter
          </button>
        </div>
      ) : null}
    </div>
  )
}
