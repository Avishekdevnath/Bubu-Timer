import { useState } from 'react'
import { Calendar, ChevronDown, ChevronUp, CheckCircle2, Circle, PauseCircle, Clock } from 'lucide-react'
import { formatStudyMinutes } from '../lib/format.js'
import { todayStr, yesterdayStr } from '../lib/dates.js'

function formatDateLabel(dateStr, today, yesterday) {
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

function formatTs(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
}

const STATUS_CONFIG = {
  done:    { icon: CheckCircle2, cls: 'text-emerald-600', label: 'Done',    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  paused:  { icon: PauseCircle,  cls: 'text-amber-500',   label: 'Paused',  badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  running: { icon: Clock,        cls: 'text-blue-500',    label: 'Running', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  idle:    { icon: Circle,       cls: 'text-stone-300',   label: 'Pending', badge: 'bg-stone-50 text-stone-500 border-stone-200' },
}

function ItemRow({ item }) {
  const [open, setOpen] = useState(false)
  const min = Math.floor((item.elapsedSec || 0) / 60)
  const hasLogs = (item.logs || []).length > 0
  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.idle
  const Icon = cfg.icon

  return (
    <div className="border-b border-stone-50 last:border-0">
      <button
        type="button"
        onClick={() => hasLogs && setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${hasLogs ? 'hover:bg-stone-50 cursor-pointer' : 'cursor-default'}`}
      >
        <Icon size={15} className={`${cfg.cls} shrink-0`} />
        <span className="flex-1 text-sm text-stone-800 truncate">{item.subjectName}</span>
        {item.desc ? <span className="text-xs text-stone-400 truncate max-w-[120px] hidden sm:block">{item.desc}</span> : null}
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${cfg.badge}`}>{cfg.label}</span>
        <span className="text-xs text-stone-500 font-medium shrink-0">{formatStudyMinutes(min)}</span>
        {hasLogs && (
          open
            ? <ChevronUp size={14} className="text-stone-300 shrink-0" />
            : <ChevronDown size={14} className="text-stone-300 shrink-0" />
        )}
      </button>
      {open && hasLogs && (
        <div className="px-4 pb-3 space-y-1.5 bg-stone-50/50">
          {item.logs.map((log, i) => (
            <div key={i} className="flex gap-3 text-xs py-1 border-b border-stone-100 last:border-0">
              <span className="text-stone-400 shrink-0 w-16 text-right pt-0.5">{formatTs(log.ts)}</span>
              <span className="text-stone-600 flex-1 leading-relaxed">{log.note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DayCard({ plan, defaultOpen, today, yesterday }) {
  const [open, setOpen] = useState(defaultOpen)
  const totalSec = plan.items.reduce((s, it) => s + (it.elapsedSec || 0), 0)
  const doneCount = plan.items.filter((i) => i.status === 'done').length
  const totalMin = Math.floor(totalSec / 60)
  const isActive = !plan.endedAt
  const dateLabel = formatDateLabel(plan.date, today, yesterday)

  return (
    <div className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-stone-50 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
          <Calendar size={14} className="text-stone-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-stone-800">{dateLabel}</span>
            <span className="text-xs text-stone-400">{plan.date}</span>
            {isActive && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
            )}
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            {plan.items.length} subject{plan.items.length !== 1 ? 's' : ''} ·{' '}
            {doneCount}/{plan.items.length} done ·{' '}
            {formatStudyMinutes(totalMin)} studied
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-stone-800">{formatStudyMinutes(totalMin)}</p>
            <p className="text-[10px] text-stone-400">{doneCount}/{plan.items.length} done</p>
          </div>
          {open ? <ChevronUp size={16} className="text-stone-300" /> : <ChevronDown size={16} className="text-stone-300" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-stone-100">
          {plan.items.length === 0 ? (
            <p className="text-xs text-stone-400 text-center py-6">No items in this plan</p>
          ) : (
            plan.items.map((item) => <ItemRow key={item.id} item={item} />)
          )}
          {plan.endNote && (
            <div className="px-4 py-3 border-t border-stone-100 bg-stone-50">
              <p className="text-xs text-stone-500 italic">🌙 End note: {plan.endNote}</p>
            </div>
          )}
          {plan.endedAt && (
            <div className="px-4 py-2 border-t border-stone-50 flex justify-end">
              <p className="text-[10px] text-stone-300">Archived {formatTs(plan.endedAt)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function PlanHistoryPage({ appState }) {
  const today = todayStr()
  const yesterday = yesterdayStr()

  const allPlans = [
    ...(appState.dailyPlan ? [appState.dailyPlan] : []),
    ...[...(appState.planHistory || [])].reverse(),
  ]

  const totalStudiedMin = allPlans.reduce((sum, p) =>
    sum + Math.floor(p.items.reduce((s, it) => s + (it.elapsedSec || 0), 0) / 60), 0)

  return (
    <div className="w-full px-4 md:px-6 pt-6 pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-light tracking-tight text-stone-800">Plan History</h2>
        <p className="text-xs text-stone-400 mt-1">
          {allPlans.length} day{allPlans.length !== 1 ? 's' : ''} recorded · {formatStudyMinutes(totalStudiedMin)} total
        </p>
      </div>

      {allPlans.length === 0 ? (
        <div className="bg-white border border-stone-100 rounded-2xl shadow-sm p-10 text-center">
          <Calendar size={32} className="text-stone-200 mx-auto mb-3" />
          <p className="text-sm text-stone-500 font-medium">No plans recorded yet</p>
          <p className="text-xs text-stone-400 mt-1">Build your first daily plan on the Plan tab.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allPlans.map((plan, i) => (
            <DayCard
              key={plan.date}
              plan={plan}
              defaultOpen={i === 0}
              today={today}
              yesterday={yesterday}
            />
          ))}
        </div>
      )}
    </div>
  )
}
