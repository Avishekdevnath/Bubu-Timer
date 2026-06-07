import { useState } from 'react'
import { PlanItemCard } from '../features/plan/PlanItemCard.jsx'
import { PlanBuilder } from '../features/plan/PlanBuilder.jsx'
import { DurationControl } from '../features/plan/DurationControl.jsx'
import { liveElapsedSec, itemRemainingSec } from '../features/plan/planModel.js'
import { formatRemaining, formatStudyMinutes } from '../lib/format.js'
import { fromPlanPayload } from '../features/plan/planSync.js'
import { DescEditor } from '../features/plan/DescEditor.jsx'

export function TimerPage({ appState, room, onStartItem, onPause, onDone, onEndDay, onCreatePlan, onAddSubject, onRemoveItem }) {
  const [view, setView] = useState('mine')
  const [building, setBuilding] = useState(false)
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const plan = appState.dailyPlan
  const partnerPlan = fromPlanPayload(room?.pair?.data?.plan)

  return (
    <div className="w-full px-4 md:px-6 pt-4 pb-4">
      <div className="flex bg-stone-100 rounded-full p-1 mb-5 max-w-xs mx-auto">
        {[['mine', 'My Plan'], ['partner', 'Partner Plan']].map(([k, label]) => (
          <button key={k} onClick={() => setView(k)}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${view === k ? 'bg-white shadow text-stone-800' : 'text-stone-400'}`}>{label}</button>
        ))}
      </div>

      {view === 'mine' ? (
        building ? (
          <PlanBuilder subjects={appState.subjects} onCancel={() => setBuilding(false)}
            onSave={(items) => { onCreatePlan(items); setBuilding(false) }} />
        ) : !plan ? (
          <div className="text-center py-16">
            <p className="text-stone-400 mb-4">No plan for today.</p>
            <button onClick={() => setBuilding(true)} className="px-6 py-3 bg-stone-900 text-white rounded-2xl text-sm font-semibold">Build Today&apos;s Plan</button>
          </div>
        ) : (
          <MyPlan plan={plan} now={now} subjects={appState.subjects}
            onStartItem={onStartItem} onPause={onPause} onDone={onDone} onEndDay={onEndDay}
            onAddSubject={onAddSubject} onRemoveItem={onRemoveItem} />
        )
      ) : (
        <PartnerPlan plan={partnerPlan} now={now} connected={!!room?.pair?.connected} partnerName={room?.pair?.partnerNick || room?.pair?.data?.name} />
      )}
    </div>
  )
}

function MyPlan({ plan, now, subjects, onStartItem, onPause, onDone, onEndDay, onAddSubject, onRemoveItem }) {
  const active = plan.items.find((i) => i.id === plan.activeItemId)
  const [addOpen, setAddOpen] = useState(false)

  function firstAvailableId() {
    return subjects.find((s) => !plan.items.some((i) => i.subjectId === s.id))?.id || ''
  }

  const [addForm, setAddForm] = useState({ subjectId: firstAvailableId(), minutes: 30, desc: '' })

  function openAdd() {
    setAddForm({ subjectId: firstAvailableId(), minutes: 30, desc: '' })
    setAddOpen(true)
  }

  function submitAdd() {
    const subj = subjects.find((s) => s.id === addForm.subjectId)
    if (!subj) { setAddOpen(false); return }
    onAddSubject({ subjectId: addForm.subjectId, subjectName: subj.name, desc: addForm.desc, targetSec: addForm.minutes * 60 })
    setAddOpen(false)
  }

  return (
    <div className="space-y-3">
      {active ? (
        <div className="bg-white border border-emerald-200 rounded-3xl p-6 shadow-sm flex flex-col items-center">
          <span className="text-xs font-bold tracking-widest text-stone-400 uppercase mb-1">{active.subjectName}</span>
          <span className={`text-5xl font-light tabular-nums ${itemRemainingSec(active, now) < 0 ? 'text-amber-600' : 'text-stone-800'}`}>
            {formatRemaining(itemRemainingSec(active, now))}
          </span>
          <span className="text-[10px] text-stone-400 mt-1">
            {formatStudyMinutes(Math.floor(liveElapsedSec(active, now) / 60))} / {formatStudyMinutes(Math.floor(active.targetSec / 60))}
          </span>
          <div className="flex gap-2 mt-4 w-full max-w-xs">
            <button onClick={onPause} className="flex-1 py-3 rounded-xl bg-stone-900 text-white text-sm font-semibold">Pause &amp; log</button>
            <button onClick={onDone} className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold">Mark done</button>
          </div>
        </div>
      ) : null}

      {plan.items.map((it) => (
        <PlanItemCard key={it.id} item={it} now={now} onClick={() => onStartItem(it.id)} onRemove={onRemoveItem} />
      ))}

      {addOpen ? (
        <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm space-y-2">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Add Subject</p>
          <select value={addForm.subjectId} onChange={(e) => setAddForm({ ...addForm, subjectId: e.target.value })}
            className="w-full border border-stone-200 rounded-lg px-2 py-2 text-sm bg-white">
            {subjects.filter((s) => !plan.items.some((i) => i.subjectId === s.id)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <DescEditor value={addForm.desc} onChange={(v) => setAddForm({ ...addForm, desc: v })}
            placeholder="What to read (optional)" />
          <DurationControl label="Time" value={addForm.minutes} min={5} max={720} step={5} chips={[15, 30, 45, 60, 90, 120, 180]}
            onCommit={(v) => setAddForm({ ...addForm, minutes: v })} />
          <div className="flex gap-2 pt-1">
            <button onClick={() => setAddOpen(false)} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-500 text-sm font-semibold">Cancel</button>
            <button onClick={submitAdd} disabled={!addForm.subjectId}
              className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold">Add</button>
          </div>
        </div>
      ) : (
        subjects.length > 0 && subjects.some((s) => !plan.items.some((i) => i.subjectId === s.id)) && (
          <button onClick={openAdd}
            className="w-full py-2.5 rounded-xl border border-dashed border-stone-300 text-stone-400 text-sm font-semibold hover:bg-stone-50">
            + Add subject
          </button>
        )
      )}

      <button onClick={onEndDay} className="w-full py-3 rounded-xl border border-stone-200 text-stone-500 text-sm font-semibold hover:bg-stone-50">End Day</button>
    </div>
  )
}

function PartnerPlan({ plan, now, connected, partnerName }) {
  if (!connected) return <p className="text-center text-stone-400 py-16">Not connected to a partner.</p>
  if (!plan) return <p className="text-center text-stone-400 py-16">{partnerName || 'Partner'} hasn&apos;t built a plan today.</p>
  return (
    <div className="space-y-3">
      <p className="text-xs text-stone-400 text-center mb-1">{partnerName || 'Partner'} · monitoring</p>
      {plan.items.map((it) => <PlanItemCard key={it.id} item={it} now={now} readOnly />)}
      {plan.endNote ? <p className="text-sm text-stone-500 bg-stone-50 rounded-xl p-3">🌙 {plan.endNote}</p> : null}
    </div>
  )
}
