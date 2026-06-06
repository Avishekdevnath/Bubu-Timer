import { useState } from 'react'

export function EndDayModal({ onSubmit, onCancel }) {
  const [note, setNote] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onCancel}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-stone-800 mb-1">End the day</h3>
        <p className="text-xs text-stone-400 mb-3">Optional summary message for today. Archives your plan.</p>
        <textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} rows={3}
          placeholder="How did today go? (optional)"
          className="w-full border border-stone-200 rounded-xl p-3 text-sm outline-none focus:border-stone-400 resize-none" />
        <div className="flex gap-2 mt-4">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50">Cancel</button>
          <button onClick={() => onSubmit(note.trim())} className="flex-1 py-3 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800">End Day</button>
        </div>
      </div>
    </div>
  )
}
