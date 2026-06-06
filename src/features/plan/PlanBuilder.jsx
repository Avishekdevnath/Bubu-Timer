import { useState } from 'react'
import { DurationControl } from './DurationControl.jsx'

export function PlanBuilder({ subjects, onSave, onCancel }) {
  const [rows, setRows] = useState([])
  function addRow() {
    const first = subjects[0]
    setRows((r) => [...r, { key: `${Date.now()}-${r.length}`, subjectId: first?.id || '', minutes: 30, desc: '' }])
  }
  function patch(key, p) { setRows((r) => r.map((row) => (row.key === key ? { ...row, ...p } : row))) }
  function remove(key) { setRows((r) => r.filter((row) => row.key !== key)) }
  function save() {
    const items = rows.filter((r) => r.subjectId).map((r) => {
      const subj = subjects.find((s) => s.id === r.subjectId)
      return { subjectId: r.subjectId, subjectName: subj?.name || 'Subject', desc: r.desc, targetSec: r.minutes * 60 }
    })
    if (!items.length) return
    onSave(items)
  }
  const hasRows = rows.some((r) => r.subjectId)
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.key} className="bg-white border border-stone-100 rounded-2xl p-3 shadow-sm">
          <div className="flex gap-2 mb-2">
            <select value={row.subjectId} onChange={(e) => patch(row.key, { subjectId: e.target.value })}
              className="flex-1 border border-stone-200 rounded-lg px-2 py-2 text-sm bg-white">
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={() => remove(row.key)} className="px-3 text-stone-400 hover:text-red-500">✕</button>
          </div>
          <input value={row.desc} onChange={(e) => patch(row.key, { desc: e.target.value })}
            placeholder="What to read (e.g. Ch.15 p.396-435)"
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm mb-1 outline-none focus:border-stone-400" />
          <DurationControl label="Time" value={row.minutes} min={5} max={300} step={5} chips={[15, 30, 45, 60, 90]}
            onCommit={(v) => patch(row.key, { minutes: v })} />
        </div>
      ))}
      {subjects.length === 0 && (
        <p className="text-center text-stone-400 text-sm py-4">Add subjects first from the Subjects tab.</p>
      )}
      {subjects.length > 0 && (
        <button onClick={addRow} className="w-full py-3 rounded-xl border border-dashed border-stone-300 text-stone-500 text-sm font-semibold hover:bg-stone-50">+ Add subject</button>
      )}
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold">Cancel</button>
        <button onClick={save} disabled={!hasRows}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold ${hasRows ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-400'}`}>Save Plan</button>
      </div>
    </div>
  )
}
