import { useState } from 'react'
import { AppModal } from '../../components/AppModal.jsx'
import { archiveActiveTarget, createTarget } from './goalsModel.js'
import { todayStr } from '../../lib/dates.js'

export function GoalModal({ onClose, appState, patchState, addLog }) {
  const target = appState.activeTarget
  const [form, setForm] = useState({ type: target?.type || 'daily', unit: target?.unit || 'hours', goal: target?.goal || 4, endDate: target?.endDate || todayStr() })
  function save() {
    patchState((state) => createTarget(state, { ...form, today: todayStr() }))
    addLog(`Goal: ${form.goal} ${form.unit}`, 'lk')
    onClose()
  }
  return (
    <AppModal title={target ? 'Update Goal' : 'Set Goal'} onClose={onClose}>
      <select className="field-in" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
        <option value="daily">Today only</option>
        <option value="range">Date range</option>
      </select>
      {form.type === 'range' ? <input className="field-in" type="date" value={form.endDate} min={todayStr()} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /> : null}
      <select className="field-in" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
        <option value="hours">Hours studied</option>
        <option value="sessions">Sessions completed</option>
      </select>
      <input className="field-in" type="number" min="0.25" step={form.unit === 'sessions' ? 1 : 0.5} value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} />
      <div className="flex gap-3 mt-2">
        <button onClick={save} className="flex-1 py-3 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors">Set Goal</button>
        <button onClick={onClose} className="flex-1 py-3 border border-stone-200 text-stone-600 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors">Cancel</button>
      </div>
      {target ? <button onClick={() => { patchState((s) => archiveActiveTarget(s)); onClose() }} className="w-full mt-2 py-2.5 text-sm text-red-500 hover:text-red-700 transition-colors">Clear Goal</button> : null}
    </AppModal>
  )
}
