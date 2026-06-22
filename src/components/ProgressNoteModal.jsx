import { useState } from 'react'

const TITLES = { pause: 'Pause — Quick Log', done: 'Mark done — log progress', switchTo: 'Switch subject — log progress' }
const PAUSE_PRESETS = ['Break', 'Interrupted', 'Distraction']

export function ProgressNoteModal({ mode, onSubmit, onCancel }) {
  const [note, setNote] = useState('')
  const isPause = mode === 'pause' || mode === 'switchTo'
  const canSubmit = isPause || note.trim().length > 0
  const effectiveNote = note.trim() || (isPause ? 'Break' : '')

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onCancel}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-stone-800 mb-3">{TITLES[mode] || TITLES.pause}</h3>
        {isPause ? (
          <>
            <div className="flex flex-wrap gap-2 mb-2">
              {PAUSE_PRESETS.map((preset) => (
                <button key={preset} onClick={() => setNote(preset)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${note === preset ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                  {preset}
                </button>
              ))}
            </div>
            <input value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Custom reason (optional)" autoFocus
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-stone-400"
            />
          </>
        ) : (
          <textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} rows={3}
            placeholder="What did you get done?"
            className="w-full border border-stone-200 rounded-xl p-3 text-sm outline-none focus:border-stone-400 resize-none" />
        )}
        <div className="flex gap-2 mt-4">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50">Cancel</button>
          <button disabled={!canSubmit} onClick={() => canSubmit && onSubmit(effectiveNote)}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold ${canSubmit ? 'bg-stone-900 text-white hover:bg-stone-800' : 'bg-stone-200 text-stone-400'}`}>Save</button>
        </div>
      </div>
    </div>
  )
}
