import { useState } from 'react'
import { AppModal } from '../../components/AppModal.jsx'
import { addChapter, addSubject, getChapter, getSubject, updateChapter, updateSubject } from './subjectsModel.js'

export function SubjectModal({ modal, onClose, appState, patchState, setExpanded, showToast }) {
  const found = modal.mode === 'chapter' && modal.id ? getChapter(appState, modal.id)?.chapter : modal.id ? getSubject(appState, modal.id) : null
  const [form, setForm] = useState({ name: found?.name || '', pages: found?.pages || '', priority: found?.priority || 'medium' })
  function save() {
    if (!form.name.trim()) return showToast('Name required', 'bank-t')
    patchState((state) => {
      if (modal.mode === 'chapter') return modal.id ? updateChapter(state, modal.id, form) : addChapter(state, modal.subjectId, form)
      return modal.id ? updateSubject(state, modal.id, form) : addSubject(state, form)
    })
    if (modal.subjectId) setExpanded((old) => new Set(old).add(modal.subjectId))
    onClose()
  }
  return (
    <AppModal title={found ? `Edit ${modal.mode}` : `Add ${modal.mode}`} onClose={onClose}>
      <input className="field-in" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className="field-in" placeholder="Pages / Topic" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} />
      {modal.mode === 'subject' ? (
        <select className="field-in" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
          <option value="must">Must Know</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium</option>
        </select>
      ) : null}
      <div className="flex gap-3 mt-2">
        <button onClick={save} className="flex-1 py-3 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors">Save</button>
        <button onClick={onClose} className="flex-1 py-3 border border-stone-200 text-stone-600 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors">Cancel</button>
      </div>
    </AppModal>
  )
}
