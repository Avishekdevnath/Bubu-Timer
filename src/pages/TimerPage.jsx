import { GoalBar } from '../components/GoalBar.jsx'
import { resetToIdle } from '../features/timer/timerEngine.js'
import { formatClock, formatStudyMinutes } from '../lib/format.js'

export function TimerPage({
  appState, patchState, targetProgress, activeSubject, activeChapter,
  soundOn, setSoundOn, setGoalOpen, handleMain, bankCurrentBreak,
  bankUse, setBankUse, spendBank, navigate,
}) {
  const frac = appState.totalTime ? appState.timeLeft / appState.totalTime : 1
  const isStudy = appState.mode === 'study'
  const isBreak = appState.mode === 'break'
  return (
    <div className="flex flex-col items-center w-full px-4 md:px-6 pt-2 pb-2">
      <div className="w-full mb-3">
        <GoalBar state={appState} progress={targetProgress} onOpen={() => setGoalOpen(true)} />
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-bold tracking-[0.2em] text-stone-400 uppercase">
          {isBreak ? 'Break Time' : 'Study Session'}
        </span>
        <button
          onClick={() => setSoundOn((v) => { const next = !v; localStorage.setItem('bubu_sound', next ? 'on' : 'off'); return next })}
          className="text-stone-400 hover:text-stone-700 transition-colors"
          title={soundOn ? 'Mute clock' : 'Unmute clock'}
        >
          {soundOn ? '🔔' : '🔕'}
        </button>
      </div>

      <div className={`relative w-52 h-52 md:w-64 md:h-64 flex items-center justify-center mb-3 ${isStudy && appState.endTs ? 'ring-pulsing' : ''}`}>
        <svg viewBox="0 0 220 220" className="absolute inset-0 w-full h-full">
          <circle className="ring-bg" cx="110" cy="110" r="100" />
          <circle className={`ring-track${isBreak ? ' brk' : ''}`} cx="110" cy="110" r="100"
            style={{ strokeDashoffset: 628 * (1 - frac) }} />
        </svg>
        <div className="flex flex-col items-center z-10">
          <span className="text-5xl md:text-6xl font-light tracking-tighter tabular-nums text-stone-800">{formatClock(appState.timeLeft)}</span>
          <span className="text-[10px] text-stone-400 mt-1.5 tracking-widest uppercase font-semibold">
            {isBreak ? 'Rest Time' : 'Focus Time'}
          </span>
        </div>
      </div>

      <button
        className="flex items-center gap-2 px-5 py-1.5 rounded-full bg-white border border-stone-200 text-stone-500 text-sm hover:border-stone-400 hover:text-stone-800 transition-all shadow-sm mb-3"
        onClick={() => navigate('/subjects')}
      >
        <span>
          {activeSubject
            ? (activeChapter ? `${activeSubject.name} → ${activeChapter.name}` : activeSubject.name)
            : (<>Pick subject <span className="text-stone-400 text-xs">(optional)</span></>)}
        </span>
      </button>

      <div className="flex flex-col items-center w-full gap-2 mb-3">
        <button
          onClick={handleMain}
          className={`w-full max-w-xs py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold tracking-wide transition-all shadow-sm
            ${appState.mode !== 'idle'
              ? 'bg-white text-stone-800 border border-stone-200 hover:bg-stone-50'
              : 'bg-stone-900 text-white hover:bg-stone-800 shadow-md'}`}
        >
          {appState.mode === 'idle' ? 'START' : appState.mode === 'study' ? (appState.endTs ? 'PAUSE' : 'RESUME') : 'End Early'}
        </button>
        <div className="flex gap-2 w-full max-w-xs">
          <button onClick={() => patchState((s) => resetToIdle(s))}
            className="flex-1 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-600 text-xs font-bold tracking-wide hover:bg-stone-50 transition-colors">
            RESET
          </button>
          <button onClick={() => appState.mode === 'break' && bankCurrentBreak()}
            className="flex-1 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-600 text-xs font-bold tracking-wide hover:bg-stone-50 transition-colors">
            SKIP BREAK
          </button>
        </div>
      </div>

      <div className="w-full max-w-xs grid grid-cols-4 gap-2 mb-3">
        {[
          { label: 'SESSIONS', value: appState.sessions },
          { label: 'BANK MIN', value: appState.bankMin },
          { label: 'SUBJECTS', value: appState.subjects.length },
          { label: 'STUDIED', value: formatStudyMinutes(appState.studyMin) },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-stone-100 rounded-xl p-2 flex flex-col items-center shadow-sm">
            <span className="text-sm font-semibold text-stone-800">{s.value}</span>
            <span className="text-[8px] font-bold tracking-wider text-stone-400 mt-0.5 text-center">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="w-full max-w-xs flex gap-2">
        <input type="number" value={bankUse} onChange={(e) => setBankUse(e.target.value)} placeholder="mins to spend"
          className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-stone-400 placeholder:text-stone-300 transition-colors shadow-sm" />
        <button onClick={spendBank}
          className="px-5 py-2 bg-stone-200 text-stone-700 font-semibold text-sm rounded-xl hover:bg-stone-300 transition-colors">
          Spend
        </button>
      </div>
    </div>
  )
}
