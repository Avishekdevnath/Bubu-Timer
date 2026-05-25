import { useState } from 'react'
import { Archive, Check, CheckCircle2, ChevronLeft, ChevronRight, Circle, Edit2, Folder, ListTodo, Plus, Trash2, X } from 'lucide-react'

export function ChecklistsPage({ room, navigate }) {
  const { pair, createChecklist, deleteChecklist, addItem, updateItem, deleteItem, toggleItem, toggleArchive } = room
  const checklists = pair?.checklists || []

  const [view, setView] = useState('list')  // 'list' | 'detail' | 'create'
  const [tab, setTab] = useState('active')  // 'active' | 'archived'
  const [selectedId, setSelectedId] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const [newTopic, setNewTopic] = useState('')
  const [newItemText, setNewItemText] = useState('')
  const [editing, setEditing] = useState({ id: null, text: '' })

  const activeList = checklists.filter((c) => !c.isArchived)
  const archivedList = checklists.filter((c) => c.isArchived)
  const selected = checklists.find((c) => c.id === selectedId)

  async function handleCreate(e) {
    e.preventDefault()
    if (!newTitle.trim()) return
    await createChecklist({ title: newTitle, topic: newTopic })
    setNewTitle('')
    setNewTopic('')
    setView('list')
  }

  function handleAddItem(e) {
    e.preventDefault()
    if (!newItemText.trim()) return
    addItem(selectedId, newItemText)
    setNewItemText('')
  }

  function saveEdit(itemId) {
    if (!editing.text.trim()) return
    updateItem(selectedId, itemId, { text: editing.text.trim() })
    setEditing({ id: null, text: '' })
  }

  function back() {
    if (view !== 'list') {
      setView('list')
      setSelectedId(null)
    } else {
      navigate('/buddy')
    }
  }

  return (
    <div className="w-full px-4 md:px-6 pt-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={back} className="w-9 h-9 flex items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-light tracking-tight text-stone-800 flex items-center gap-2">
              <ListTodo size={20} className="text-stone-600" />
              {view === 'list' ? 'Checklists' : view === 'create' ? 'New Checklist' : selected?.title}
            </h2>
            {view === 'list' && <p className="text-xs text-stone-400 mt-0.5">Shared with partner</p>}
          </div>
        </div>
        {view === 'list' && (
          <button onClick={() => setView('create')} className="px-3 py-2 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-stone-800 transition-colors flex items-center gap-1.5">
            <Plus size={14} /> New
          </button>
        )}
      </div>

      {/* List view */}
      {view === 'list' && (
        <div className="max-w-2xl">
          <div className="flex bg-stone-100 p-1 rounded-xl w-full mb-4">
            <button onClick={() => setTab('active')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${tab === 'active' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
              Active ({activeList.length})
            </button>
            <button onClick={() => setTab('archived')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${tab === 'archived' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
              Archived ({archivedList.length})
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {(tab === 'active' ? activeList : archivedList).map((c) => {
              const doneCount = c.items.filter((i) => i.done).length
              const total = c.items.length
              const progress = total === 0 ? 0 : (doneCount / total) * 100
              return (
                <div key={c.id}
                  onClick={() => { setSelectedId(c.id); setView('detail') }}
                  className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm cursor-pointer hover:border-stone-300 transition-all flex flex-col gap-3 group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-stone-800">{c.title}</h3>
                      {c.topic && (
                        <span className="bg-stone-100 text-stone-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mt-1 inline-block">{c.topic}</span>
                      )}
                    </div>
                    <ChevronRight size={18} className="text-stone-300 group-hover:text-stone-600 transition-colors" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-stone-800'}`} style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs font-medium text-stone-400">{doneCount}/{total}</span>
                  </div>
                </div>
              )
            })}
            {(tab === 'active' ? activeList : archivedList).length === 0 && (
              <div className="text-center text-stone-400 mt-10 text-sm flex flex-col items-center py-10">
                <Folder size={32} className="mb-2 opacity-50" />
                No {tab} checklists
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create view */}
      {view === 'create' && (
        <form onSubmit={handleCreate} className="max-w-md flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">Title</label>
            <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., Midterm Prep"
              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-stone-400 transition-colors shadow-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">Topic (optional)</label>
            <input value={newTopic} onChange={(e) => setNewTopic(e.target.value)} placeholder="e.g., Mathematics"
              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-stone-400 transition-colors shadow-sm" />
          </div>
          <div className="flex gap-2 mt-2">
            <button type="submit" disabled={!newTitle.trim()}
              className="flex-1 py-3 bg-stone-900 text-white rounded-xl text-sm font-semibold hover:bg-stone-800 disabled:opacity-50 transition-colors shadow-md">
              Create
            </button>
            <button type="button" onClick={() => setView('list')}
              className="px-5 py-3 border border-stone-200 text-stone-600 rounded-xl text-sm font-semibold hover:bg-stone-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Detail view */}
      {view === 'detail' && selected && (
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {selected.topic && (
              <span className="bg-stone-100 text-stone-600 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">{selected.topic}</span>
            )}
            {selected.isArchived && (
              <span className="bg-yellow-50 text-yellow-700 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1">
                <Archive size={12} /> Archived
              </span>
            )}
            <button onClick={() => { if (window.confirm(`Delete checklist "${selected.title}"?`)) { deleteChecklist(selected.id); setView('list') } }}
              className="ml-auto text-[10px] font-bold text-red-400 hover:text-red-600">
              DELETE
            </button>
          </div>

          <div className="flex flex-col gap-2 mb-5">
            {selected.items.map((item) => (
              <div key={item.id}
                onClick={() => toggleItem(selected.id, item)}
                className="flex items-center gap-3 cursor-pointer group p-3 bg-white border border-stone-100 rounded-xl hover:border-stone-300 transition-colors shadow-sm min-h-[52px]">
                {item.done
                  ? <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                  : <Circle size={18} className="text-stone-300 group-hover:text-stone-400 flex-shrink-0" />}
                {editing.id === item.id ? (
                  <div className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <input autoFocus value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(item.id) }}
                      className="flex-1 bg-stone-50 border border-stone-200 rounded px-3 py-1.5 text-sm outline-none focus:border-stone-400" />
                    <button onClick={() => saveEdit(item.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md"><Check size={16} /></button>
                    <button onClick={() => setEditing({ id: null, text: '' })} className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-md"><X size={16} /></button>
                  </div>
                ) : (
                  <>
                    <span className={`text-sm flex-1 transition-colors break-words ${item.done ? 'text-stone-400 line-through' : 'text-stone-700'}`} style={{ overflowWrap: 'anywhere' }}>{item.text}</span>
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); setEditing({ id: item.id, text: item.text }) }}
                        className="p-1.5 text-stone-400 hover:text-stone-600 rounded-md hover:bg-stone-100"><Edit2 size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteItem(selected.id, item.id) }}
                        className="p-1.5 text-stone-400 hover:text-red-500 rounded-md hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {selected.items.length === 0 && (
              <div className="text-center text-stone-400 py-8 text-sm">No tasks yet</div>
            )}
          </div>

          <form onSubmit={handleAddItem} className="flex gap-2 mb-3">
            <input value={newItemText} onChange={(e) => setNewItemText(e.target.value)} placeholder="Add a new task…"
              className="flex-1 text-sm bg-white rounded-xl px-4 py-3 outline-none border border-stone-200 focus:border-stone-400 placeholder:text-stone-400 transition-colors shadow-sm" />
            <button type="submit" disabled={!newItemText.trim()}
              className="bg-stone-900 disabled:opacity-50 text-white p-3 rounded-xl transition-colors shadow-sm">
              <Plus size={18} />
            </button>
          </form>

          <button onClick={() => toggleArchive(selected)}
            className={`w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${selected.isArchived ? 'bg-stone-200 text-stone-700 hover:bg-stone-300' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
            <Archive size={16} />
            {selected.isArchived ? 'Unarchive' : 'Move to Archive'}
          </button>
        </div>
      )}
    </div>
  )
}
