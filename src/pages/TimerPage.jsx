import { useState } from 'react'
import { PlanItemCard } from '../features/plan/PlanItemCard.jsx'
import { PlanBuilder } from '../features/plan/PlanBuilder.jsx'
import { liveElapsedSec, itemRemainingSec } from '../features/plan/planModel.js'
import { formatRemaining } from '../lib/format.js'
import { fromPlanPayload } from '../features/plan/planSync.js'

export function TimerPage({ appState, room, onStartItem, onPause, onDone, onEndDay, onCreatePlan }) {
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
          <MyPlan plan={plan} now={now} onStartItem={onStartItem} onPause={onPause} onDone={onDone} onEndDay={onEndDay} />
        )
      ) : (
        <PartnerPlan plan={partnerPlan} now={now} connected={!!room?.pair?.connected} partnerName={room?.pair?.partnerNick || room?.pair?.data?.name} />
      )}
    </div>
  )
}

function MyPlan({ plan, now, onStartItem, onPause, onDone, onEndDay }) {
  const active = plan.items.find((i) => i.id === plan.activeItemId)
  return (
    <div className="space-y-3">
      {active ? (
        <div className="bg-white border border-emerald-200 rounded-3xl p-6 shadow-sm flex flex-col items-center">
          <span className="text-xs font-bold tracking-widest text-stone-400 uppercase mb-1">{active.subjectName}</span>
          <span className={`text-5xl font-light tabular-nums ${itemRemainingSec(active, now) < 0 ? 'text-amber-600' : 'text-stone-800'}`}>
            {formatRemaining(itemRemainingSec(active, now))}
          </span>
          <span className="text-[10px] text-stone-400 mt-1">
            {Math.floor(liveElapsedSec(active, now) / 60)}m / {Math.floor(active.targetSec / 60)}m
          </span>
          <div className="flex gap-2 mt-4 w-full max-w-xs">
            <button onClick={onPause} className="flex-1 py-3 rounded-xl bg-stone-900 text-white text-sm font-semibold">Pause &amp; log</button>
            <button onClick={onDone} className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold">Mark done</button>
          </div>
        </div>
      ) : null}

      {plan.items.map((it) => (
        <PlanItemCard key={it.id} item={it} now={now} onClick={() => onStartItem(it.id)} />
      ))}

      <button onClick={onEndDay} className="w-full py-3 rounded-xl border border-stone-200 text-stone-500 text-sm font-semibold hover:bg-stone-50 mt-2">End Day</button>
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
