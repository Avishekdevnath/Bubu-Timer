import { useState } from 'react'

const TITLES = { pause: 'Pause — log progress', done: 'Mark done — log progress', switchTo: 'Switch subject — log progress' }

export function ProgressNoteModal({ mode, onSubmit, onCancel }) {
  const [note, setNote] = useState('')
  const valid = note.trim().length > 0
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onCancel}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-stone-800 mb-3">{TITLES[mode] || TITLES.pause}</h3>
        <textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} rows={3}
          placeholder="What did you get done?"
          className="w-full border border-stone-200 rounded-xl p-3 text-sm outline-none focus:border-stone-400 resize-none" />
        <div className="flex gap-2 mt-4">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50">Cancel</button>
          <button disabled={!valid} onClick={() => valid && onSubmit(note.trim())}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold ${valid ? 'bg-stone-900 text-white hover:bg-stone-800' : 'bg-stone-200 text-stone-400'}`}>Save</button>
        </div>
      </div>
    </div>
  )
}
