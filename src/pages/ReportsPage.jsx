import { useState } from 'react'
import { ChartNoAxesColumnIncreasing } from 'lucide-react'
import { computeDayReport, computePlanStreak, computeAllTimeSubjects, computeAllTotalMin, computeBestDay, computeWeeklyAvg } from '../features/reports/reportsModel.js'
import { formatStudyMinutes } from '../lib/format.js'
import { todayStr, yesterdayStr } from '../lib/dates.js'

export function ReportsPage({ appState }) {
  const [dayQuery, setDayQuery] = useState('')
  const [dayFilter, setDayFilter] = useState('all')

  const today = todayStr()
  const yesterday = yesterdayStr()
  const reportToday = computeDayReport(appState, today)
  const reportYesterday = computeDayReport(appState, yesterday)
  const streak = computePlanStreak(appState, today)
  const subjectList = computeAllTimeSubjects(appState)
  const totalMin = computeAllTotalMin(appState)
  const bestDay = computeBestDay(appState)
  const weeklyAvg = computeWeeklyAvg(appState, today)

  function fmtHM(min) {
    if (!min) return '0m'
    const h = Math.floor(min / 60)
    const m = min % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const last7 = []
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(`${today}T00:00:00`)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const r = computeDayReport(appState, key)
    last7.push({ key, day: d.toLocaleDateString([], { weekday: 'short' }), min: r?.totalMin ?? 0 })
  }
  const max7 = Math.max(1, ...last7.map((d) => d.min))

  return (
    <div className="w-full px-4 md:px-6 pt-6">
      <div className="mb-6">
        <h2 className="text-2xl font-light tracking-tight text-stone-800">Reports</h2>
        <p className="text-xs text-stone-400 mt-1">Study trends and totals</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Today', value: fmtHM(reportToday?.totalMin ?? 0), sub: reportToday ? `/ ${fmtHM(reportToday.totalTargetMin)}` : null },
          { label: 'Yesterday', value: fmtHM(reportYesterday?.totalMin ?? 0), sub: reportYesterday ? `/ ${fmtHM(reportYesterday.totalTargetMin)}` : null },
          { label: 'Streak', value: `${streak}d`, sub: 'days in a row' },
          { label: 'Best Day', value: fmtHM(bestDay), sub: `avg ${fmtHM(weeklyAvg)}/day` },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm">
            <p className="text-[9px] font-bold tracking-widest text-stone-400 uppercase">{s.label}</p>
            <p className="text-xl font-semibold text-stone-800 mt-1">{s.value}</p>
            {s.sub && <p className="text-[10px] text-stone-400 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      <section className="mb-6">
        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">Last 7 Days</p>
        <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
          {last7.every((d) => d.min === 0) && (
            <p className="text-center text-xs text-stone-400 mb-2">No study days this week yet</p>
          )}
          <div className="flex items-end justify-between gap-2 h-40">
            {last7.map((d) => {
              const heightPct = (d.min / max7) * 100
              return (
                <div key={d.key} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className={`w-full rounded-t-lg transition-all ${d.min > 0 ? 'bg-stone-700' : 'bg-stone-100'}`}
                      style={{ height: `${heightPct}%`, minHeight: d.min > 0 ? '4px' : '4px' }}
                      title={formatStudyMinutes(d.min)}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-stone-500">{d.day}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mb-6">
        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">By Subject</p>
        <div className="bg-white border border-stone-100 rounded-2xl divide-y divide-stone-50 shadow-sm">
          {subjectList.length === 0 ? (
            <div className="p-6 text-center text-sm text-stone-400">No study data yet — complete a daily plan first</div>
          ) : subjectList.map((s) => {
            const pctOfTotal = totalMin > 0 ? (s.minutes / totalMin) * 100 : 0
            const pctOfTarget = s.targetMinutes > 0 ? Math.min(100, (s.minutes / s.targetMinutes) * 100) : null
            return (
              <div key={s.name} className="p-4">
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-sm font-medium text-stone-700 truncate flex-1">{s.name}</span>
                  <span className="text-xs text-stone-500 font-medium ml-3 shrink-0 tabular-nums">
                    {fmtHM(s.minutes)}{s.targetMinutes > 0 ? ` / ${fmtHM(s.targetMinutes)}` : ''} · {s.doneCount} done
                  </span>
                </div>
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-stone-700 rounded-full transition-all" style={{ width: `${pctOfTotal}%` }} />
                </div>
                {pctOfTarget !== null && (
                  <p className="text-[10px] text-stone-400 mt-1">{pctOfTarget}% of target · {s.sessions} session{s.sessions !== 1 ? 's' : ''}</p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <DayByDay appState={appState} dayQuery={dayQuery} setDayQuery={setDayQuery} dayFilter={dayFilter} setDayFilter={setDayFilter} today={today} yesterday={yesterday} fmtHM={fmtHM} />

      <section className="mb-6">
        <div className="bg-stone-900 text-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">All-Time Total</p>
            <p className="text-2xl font-semibold mt-1">{formatStudyMinutes(totalMin)}</p>
          </div>
          <ChartNoAxesColumnIncreasing size={32} strokeWidth={1.5} className="text-stone-500" />
        </div>
      </section>
    </div>
  )
}

function DayByDay({ appState, dayQuery, setDayQuery, dayFilter, setDayFilter, today, yesterday, fmtHM }) {
  const allDates = new Set([
    ...(appState.planHistory || []).map((p) => p.date),
    today,
  ])
  const sortedDates = [...allDates].sort((a, b) => b.localeCompare(a))

  let rows = sortedDates.map((key) => {
    const r = computeDayReport(appState, key)
    const isToday = key === today
    const isYesterday = key === yesterday
    const d = new Date(`${key}T00:00:00`)
    return {
      key,
      label: isToday ? 'Today' : isYesterday ? 'Yesterday' : d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
      report: r,
    }
  }).filter((r) => r.report)

  if (dayFilter === 'studied') rows = rows.filter((r) => r.report.totalMin > 0)
  if (dayQuery.trim()) {
    const q = dayQuery.trim().toLowerCase()
    rows = rows.filter((r) =>
      r.label.toLowerCase().includes(q) ||
      r.key.includes(q) ||
      r.report.subjects.some((s) => s.name.toLowerCase().includes(q)),
    )
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
            <option value="studied">Studied</option>
          </select>
        </div>
      </div>
      <div className="bg-white border border-stone-100 rounded-2xl divide-y divide-stone-50 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-6 text-center text-sm text-stone-400">No days match</div>
        ) : rows.map((r) => (
          <div key={r.key} className="p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-stone-800">{r.label}</span>
                {r.report.isActive && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">In progress</span>}
              </div>
              <span className="text-xs font-semibold text-stone-700 tabular-nums">
                {fmtHM(r.report.totalMin)}{r.report.totalTargetMin > 0 ? ` / ${fmtHM(r.report.totalTargetMin)}` : ''} · {r.report.doneCount}/{r.report.totalCount} done
              </span>
            </div>
            {r.report.pctAchieved !== null && (
              <div className="h-1 bg-stone-100 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full ${r.report.pctAchieved >= 100 ? 'bg-emerald-500' : 'bg-stone-400'}`}
                  style={{ width: `${r.report.pctAchieved}%` }} />
              </div>
            )}
            {r.report.subjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {r.report.subjects.map((s, i) => (
                  <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border ${s.status === 'done' ? 'bg-stone-800 text-white border-stone-800' : 'bg-stone-50 border-stone-100 text-stone-600'}`}>
                    {s.name} <span className="opacity-60 ml-1">{fmtHM(s.min)}{s.targetMin > 0 ? `/${fmtHM(s.targetMin)}` : ''}</span>
                  </span>
                ))}
              </div>
            )}
            {r.report.endNote && <p className="text-xs text-stone-400 mt-2 italic">🌙 {r.report.endNote}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}
