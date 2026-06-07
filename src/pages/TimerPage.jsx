import { useState, useRef } from 'react'
import { CalendarDays } from 'lucide-react'
import { PlanItemCard } from '../features/plan/PlanItemCard.jsx'
import { PlanBuilder } from '../features/plan/PlanBuilder.jsx'
import { DurationControl } from '../features/plan/DurationControl.jsx'
import { formatStudyMinutes } from '../lib/format.js'
import { liveElapsedSec } from '../features/plan/planModel.js'
import { fromPlanPayload } from '../features/plan/planSync.js'
import { DescEditor } from '../features/plan/DescEditor.jsx'
import { todayStr } from '../lib/dates.js'

function offsetDate(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function DateBadge({ selected, today, onChange }) {
  const inputRef = useRef(null)
  const d = new Date(`${selected}T00:00:00`)
  const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' })

  function open() {
    if (inputRef.current?.showPicker) inputRef.current.showPicker()
    else inputRef.current?.click()
  }

  return (
    <div className="flex justify-end mb-3">
      <button
        onClick={open}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-full shadow-sm text-xs font-semibold text-stone-600 active:bg-stone-50"
      >
        <CalendarDays size={12} className="text-stone-400" />
        {label}
      </button>
      <input
        ref={inputRef}
        type="date"
        value={selected}
        min={offsetDate(today, -60)}
        max={offsetDate(today, 14)}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="sr-only"
      />
    </div>
  )
}

export function TimerPage({
  appState, room,
  onStartItem, onPause, onDone, onEndDay, onCreatePlan, onAddSubject, onRemoveItem, onEditItem,
  onSaveFuturePlan, onDeleteFuturePlan,
  navigate,
}) {
  const today = todayStr()
  const [selectedDate, setSelectedDate] = useState(today)
  const [view, setView] = useState('mine')
  const [building, setBuilding] = useState(false)
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()

  const plan = appState.dailyPlan
  const partnerPlan = fromPlanPayload(room?.pair?.data?.plan)

  const isToday = selectedDate === today
  const isFuture = selectedDate > today
  const isPast = selectedDate < today

  const historicPlan = isPast
    ? (appState.planHistory || []).find((p) => p.date === selectedDate)
    : null
  const futurePlan = isFuture
    ? (appState.futurePlans || {})[selectedDate]
    : null

  return (
    <div className="w-full px-4 md:px-6 pt-4 pb-4">
      <DateBadge selected={selectedDate} today={today} onChange={(d) => { setSelectedDate(d); setBuilding(false) }} />

      {isToday ? (
        <>
          <div className="flex bg-stone-100 rounded-full p-1 mb-5 max-w-xs mx-auto">
            {[['mine', 'My Plan'], ['partner', 'Partner Plan']].map(([k, label]) => (
              <button key={k} onClick={() => setView(k)}
                className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${view === k ? 'bg-white shadow text-stone-800' : 'text-stone-400'}`}>
                {label}
              </button>
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
                onAddSubject={onAddSubject} onRemoveItem={onRemoveItem} onEditItem={onEditItem} />
            )
          ) : (
            <PartnerPlan plan={partnerPlan} now={now} connected={!!room?.pair?.connected}
              partnerName={room?.pair?.partnerNick || room?.pair?.data?.name} />
          )}
        </>
      ) : isPast ? (
        <PastDayView plan={historicPlan} date={selectedDate} now={now} />
      ) : (
        <FutureDayView
          date={selectedDate}
          futurePlan={futurePlan}
          subjects={appState.subjects}
          onSave={(items) => onSaveFuturePlan(selectedDate, items)}
          onDelete={() => onDeleteFuturePlan(selectedDate)}
        />
      )}
    </div>
  )
}

/* ── Today: active plan ─────────────────────────────────────────────────── */

function MyPlan({ plan, now, subjects, onStartItem, onPause, onDone, onEndDay, onAddSubject, onRemoveItem, onEditItem }) {
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

  const totalElapsedSec = plan.items.reduce((s, it) => s + liveElapsedSec(it, now), 0)
  const totalTargetSec  = plan.items.reduce((s, it) => s + (it.targetSec || 0), 0)

  function fmtHM(sec) {
    const m = Math.floor(sec / 60)
    const h = Math.floor(m / 60)
    const mm = m % 60
    return h > 0 ? `${h}h ${mm}m` : `${mm}m`
  }

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-center gap-1 bg-white border border-stone-100 rounded-2xl px-4 py-2.5 shadow-sm">
        <span className="text-base font-bold tabular-nums text-stone-800">{fmtHM(totalElapsedSec)}</span>
        <span className="text-stone-300 font-light text-sm mx-1">/</span>
        <span className="text-base font-bold tabular-nums text-stone-400">{fmtHM(totalTargetSec)}</span>
      </div>

      {plan.items.map((it) => (
        <PlanItemCard
          key={it.id} item={it} now={now}
          onStart={() => onStartItem(it.id)}
          onPause={onPause}
          onDone={onDone}
          onRemove={onRemoveItem}
          onEdit={onEditItem}
          activeItemId={plan.activeItemId}
        />
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

/* ── Past day: read-only ────────────────────────────────────────────────── */

function PastDayView({ plan, date, now }) {
  if (!plan) {
    return (
      <div className="text-center py-16">
        <CalendarDays size={32} className="text-stone-200 mx-auto mb-3" />
        <p className="text-sm text-stone-400">No plan recorded for this day.</p>
      </div>
    )
  }

  const totalSec = plan.items.reduce((s, it) => s + (it.elapsedSec || 0), 0)
  const doneCount = plan.items.filter((i) => i.status === 'done').length

  return (
    <div className="space-y-3">
      <div className="bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-stone-500 font-medium">{doneCount}/{plan.items.length} done</span>
        <span className="text-xs font-semibold text-stone-700">{formatStudyMinutes(Math.floor(totalSec / 60))} studied</span>
      </div>

      {plan.items.map((it) => (
        <PlanItemCard key={it.id} item={it} now={now} readOnly />
      ))}

      {plan.endNote && (
        <div className="bg-white border border-stone-100 rounded-2xl px-4 py-3 shadow-sm">
          <p className="text-xs text-stone-500 italic">🌙 {plan.endNote}</p>
        </div>
      )}
    </div>
  )
}

/* ── Future day: plan ahead ─────────────────────────────────────────────── */

function FutureDayView({ date, futurePlan, subjects, onSave, onDelete }) {
  const [editing, setEditing] = useState(!futurePlan)

  if (editing || !futurePlan) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-bold tracking-widest text-stone-400 uppercase px-1">Plan Ahead</p>
        <PlanBuilder
          subjects={subjects}
          initialRows={futurePlan?.items?.map((it, i) => ({
            key: `existing-${i}`,
            subjectId: it.subjectId || '',
            minutes: Math.round((it.targetSec || 1800) / 60),
            desc: it.desc || '',
          })) || []}
          onCancel={() => {
            if (futurePlan) setEditing(false)
          }}
          onSave={(items) => { onSave(items); setEditing(false) }}
        />
      </div>
    )
  }

  const totalMin = futurePlan.items.reduce((s, it) => s + Math.round((it.targetSec || 0) / 60), 0)

  return (
    <div className="space-y-3">
      <div className="bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-stone-500 font-medium">{futurePlan.items.length} subject{futurePlan.items.length !== 1 ? 's' : ''} planned</span>
        <span className="text-xs font-semibold text-stone-700">{formatStudyMinutes(totalMin)} target</span>
      </div>

      {futurePlan.items.map((it, i) => (
        <div key={i} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-stone-800">{it.subjectName}</span>
            <span className="text-xs font-semibold text-stone-500">{formatStudyMinutes(Math.round((it.targetSec || 0) / 60))}</span>
          </div>
          {it.desc ? <p className="text-xs text-stone-400 leading-snug">{it.desc}</p> : null}
        </div>
      ))}

      <div className="flex gap-2 pt-1">
        <button onClick={() => setEditing(true)}
          className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-sm font-semibold hover:bg-stone-50">
          Edit Plan
        </button>
        <button onClick={onDelete}
          className="px-4 py-2.5 rounded-xl border border-red-100 text-red-500 text-sm font-semibold hover:bg-red-50">
          Delete
        </button>
      </div>
    </div>
  )
}

/* ── Partner plan view ──────────────────────────────────────────────────── */

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
