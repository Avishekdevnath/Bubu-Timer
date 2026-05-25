import { useState } from 'react'
import { ChartNoAxesColumnIncreasing } from 'lucide-react'
import { computeDailySummary, computeStreak } from '../features/reports/reportsModel.js'
import { formatStudyMinutes } from '../lib/format.js'
import { todayStr, yesterdayStr } from '../lib/dates.js'

export function ReportsPage({ appState }) {
  const [dayQuery, setDayQuery] = useState('')
  const [dayFilter, setDayFilter] = useState('all')

  const today = todayStr()
  const summaryToday = computeDailySummary(appState, today)
  const summaryYesterday = computeDailySummary(appState, yesterdayStr())
  const streak = computeStreak(appState)
  const eventTotalMin = (appState.sessionEvents || []).reduce((sum, e) => sum + (e.durationMin || 0), 0)
  const totalStudyMin = Math.max(eventTotalMin, appState.studyMin || 0)
  const totalSessions = Math.max((appState.sessionEvents || []).length, appState.sessions || 0)

  const last7 = []
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const s = computeDailySummary(appState, key)
    last7.push({ key, day: d.toLocaleDateString([], { weekday: 'short' }), min: s.totalMin, sessions: s.totalSessions, achieved: s.achieved })
  }
  const max7 = Math.max(1, ...last7.map((d) => d.min))

  const subjectTotals = {}
  ;(appState.sessionEvents || []).forEach((e) => {
    const key = e.subjectId || '__none__'
    if (!subjectTotals[key]) subjectTotals[key] = { name: e.subjectName || '(no subject)', minutes: 0, sessions: 0 }
    subjectTotals[key].minutes += e.durationMin || 0
    subjectTotals[key].sessions += 1
  })
  const subjectList = Object.values(subjectTotals).sort((a, b) => b.minutes - a.minutes)

  return (
    <div className="w-full px-4 md:px-6 pt-6">
      <div className="mb-6">
        <h2 className="text-2xl font-light tracking-tight text-stone-800">Reports</h2>
        <p className="text-xs text-stone-400 mt-1">Study trends and totals</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Today', value: formatStudyMinutes(summaryToday.totalMin) },
          { label: 'Yesterday', value: formatStudyMinutes(summaryYesterday.totalMin) },
          { label: 'Streak', value: `${streak}d` },
          { label: 'Total Sessions', value: totalSessions },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm">
            <p className="text-[9px] font-bold tracking-widest text-stone-400 uppercase">{s.label}</p>
            <p className="text-xl font-semibold text-stone-800 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="mb-6">
        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">Last 7 Days</p>
        <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
          {last7.every((d) => d.min === 0) && (
            <p className="text-center text-xs text-stone-400 mb-2">No sessions this week yet</p>
          )}
          <div className="flex items-end justify-between gap-2 h-40">
            {last7.map((d) => {
              const heightPct = (d.min / max7) * 100
              return (
                <div key={d.key} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className={`w-full rounded-t-lg transition-all ${d.achieved ? 'bg-emerald-400' : d.min > 0 ? 'bg-stone-700' : 'bg-stone-100'}`}
                      style={{ height: `${heightPct}%`, minHeight: d.min > 0 ? '4px' : '4px' }}
                      title={`${formatStudyMinutes(d.min)} · ${d.sessions} sessions`}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-stone-500">{d.day}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-3 mt-3 text-[10px] text-stone-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-sm" /> Goal hit</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-stone-700 rounded-sm" /> Studied</span>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">By Subject</p>
        <div className="bg-white border border-stone-100 rounded-2xl divide-y divide-stone-50 shadow-sm">
          {subjectList.length === 0 ? (
            <div className="p-6 text-center text-sm text-stone-400">No sessions logged yet</div>
          ) : subjectList.map((s, i) => {
            const pct = totalStudyMin > 0 ? (s.minutes / totalStudyMin) * 100 : 0
            return (
              <div key={i} className="p-4">
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-sm font-medium text-stone-700 truncate flex-1">{s.name}</span>
                  <span className="text-xs text-stone-500 font-medium ml-3 shrink-0">{formatStudyMinutes(s.minutes)} · {s.sessions}</span>
                </div>
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-stone-700 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <DayByDay appState={appState} dayQuery={dayQuery} setDayQuery={setDayQuery} dayFilter={dayFilter} setDayFilter={setDayFilter} />

      <section className="mb-6">
        <div className="bg-stone-900 text-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">All-Time Total</p>
            <p className="text-2xl font-semibold mt-1">{formatStudyMinutes(totalStudyMin)}</p>
          </div>
          <ChartNoAxesColumnIncreasing size={32} strokeWidth={1.5} className="text-stone-500" />
        </div>
      </section>
    </div>
  )
}

function DayByDay({ appState, dayQuery, setDayQuery, dayFilter, setDayFilter }) {
  const today = todayStr()
  const eventDates = new Set((appState.sessionEvents || []).map((e) => e.date))
  ;(appState.targets || []).forEach((t) => { if (t.date) eventDates.add(t.date) })
  if (appState.activeTarget?.date) eventDates.add(appState.activeTarget.date)
  eventDates.add(today)
  const sortedDates = [...eventDates].sort((a, b) => b.localeCompare(a))
  let rows = sortedDates.map((key) => {
    const s = computeDailySummary(appState, key)
    const d = new Date(key + 'T00:00:00')
    const isToday = key === today
    const isYesterday = key === yesterdayStr()
    return {
      key,
      label: isToday ? 'Today' : isYesterday ? 'Yesterday' : d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
      summary: s,
    }
  })
  if (dayFilter === 'goal') rows = rows.filter((r) => r.summary.target && r.summary.achieved)
  else if (dayFilter === 'missed') rows = rows.filter((r) => r.summary.target && !r.summary.achieved)
  else if (dayFilter === 'studied') rows = rows.filter((r) => r.summary.totalMin > 0)
  if (dayQuery.trim()) {
    const q = dayQuery.trim().toLowerCase()
    rows = rows.filter((r) => {
      if (r.label.toLowerCase().includes(q)) return true
      if (r.key.includes(q)) return true
      return Object.values(r.summary.subjectsBreakdown).some((s) => s.name.toLowerCase().includes(q))
    })
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2 px-1 gap-2 flex-wrap">
        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">Day-by-Day</p>
        <div className="flex items-center gap-2 flex-1 max-w-md ml-auto">
          <input
            type="text"
            value={dayQuery}
            onChange={(e) => setDayQuery(e.target.value)}
            placeholder="Search date or subject…"
            className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-stone-400"
          />
          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            className="bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-stone-400"
          >
            <option value="all">All days</option>
            <option value="goal">Goal hit ✓</option>
            <option value="missed">Goal missed</option>
            <option value="studied">Studied</option>
          </select>
        </div>
      </div>
      <div className="bg-white border border-stone-100 rounded-2xl divide-y divide-stone-50 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-6 text-center text-sm text-stone-400">No days match your filter</div>
        ) : rows.map((r) => {
          const subjectsList = Object.values(r.summary.subjectsBreakdown)
          return (
            <div key={r.key} className="p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-stone-800">{r.label}</span>
                  {r.summary.target && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.summary.achieved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                      {r.summary.achieved ? '✓ Goal hit' : `${r.summary.achievedLabel} / ${r.summary.goalLabel}`}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-stone-700">
                  {formatStudyMinutes(r.summary.totalMin)} · {r.summary.totalSessions} sess
                </span>
              </div>
              {subjectsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {subjectsList.map((s, i) => (
                    <span key={i} className="text-[10px] bg-stone-50 border border-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                      {s.name} <span className="text-stone-400 ml-1">{formatStudyMinutes(s.minutes)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
