import { ChartNoAxesColumnIncreasing, User } from 'lucide-react'
import { resetToIdle } from '../features/timer/timerEngine.js'
import { computeDailySummary } from '../features/reports/reportsModel.js'
import { formatStudyMinutes } from '../lib/format.js'
import { todayStr } from '../lib/dates.js'

export function SettingsPage({
  appState, patchState, currentUser, profileForm, setProfileForm, saveProfile,
  soundOn, setSoundOn, chatSoundOn, setChatSoundOn, playDing, playChatPing,
  setReport, setResetOpen,
}) {
  const accountLabel = currentUser?.email || (currentUser?.isGuest ? 'Guest mode' : 'Not signed in')
  return (
    <div className="w-full px-4 md:px-6 pt-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-light tracking-tight text-stone-800">Settings</h2>
          <p className="text-sm text-stone-500 mt-0.5">{appState.studyDuration}m focus · {appState.breakDuration}m break</p>
        </div>
        <button onClick={() => setReport(computeDailySummary(appState, todayStr()))}
          className="flex items-center gap-1.5 text-xs font-bold tracking-wide bg-stone-900 text-white px-4 py-2.5 rounded-xl shadow-sm hover:bg-stone-800 transition-colors">
          <ChartNoAxesColumnIncreasing size={14} /> Today
        </button>
      </div>

      <div className="space-y-4">
        <section>
          <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">Study Profile</p>
          <div className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-stone-50">
              <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 shrink-0"><User size={15} /></div>
              <span className="text-sm text-stone-500">{accountLabel}</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">Your Name</p>
                <input className="field-in mb-0" value={profileForm.username} onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">Partner Name</p>
                <input className="field-in mb-0" value={profileForm.partnerName} onChange={(e) => setProfileForm({ ...profileForm, partnerName: e.target.value })} />
              </div>
            </div>
            <div className="px-4 pb-4">
              <button onClick={saveProfile} className="w-full py-3 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors">
                Save Profile
              </button>
            </div>
          </div>
        </section>

        <section>
          <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">Timer Rules</p>
          <div className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-stone-50">
              <span className="text-sm font-medium text-stone-700">Focus Duration</span>
              <div className="flex items-center gap-2">
                <button onClick={() => patchState((s) => resetToIdle({ ...s, studyDuration: Math.max(1, s.studyDuration - 5) }))} className="w-7 h-7 rounded-full border border-stone-200 text-stone-600 flex items-center justify-center hover:bg-stone-50">−</button>
                <span className="text-sm font-semibold text-stone-800 w-12 text-center">{appState.studyDuration} min</span>
                <button onClick={() => patchState((s) => resetToIdle({ ...s, studyDuration: Math.min(120, s.studyDuration + 5) }))} className="w-7 h-7 rounded-full border border-stone-200 text-stone-600 flex items-center justify-center hover:bg-stone-50">+</button>
              </div>
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-sm font-medium text-stone-700">Break Duration</span>
              <div className="flex items-center gap-2">
                <button onClick={() => patchState((s) => ({ ...s, breakDuration: Math.max(1, s.breakDuration - 1) }))} className="w-7 h-7 rounded-full border border-stone-200 text-stone-600 flex items-center justify-center hover:bg-stone-50">−</button>
                <span className="text-sm font-semibold text-stone-800 w-12 text-center">{appState.breakDuration} min</span>
                <button onClick={() => patchState((s) => ({ ...s, breakDuration: Math.min(60, s.breakDuration + 1) }))} className="w-7 h-7 rounded-full border border-stone-200 text-stone-600 flex items-center justify-center hover:bg-stone-50">+</button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">Sound</p>
          <div className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-stone-50">
              <div>
                <p className="text-sm font-medium text-stone-700">Clock Tick</p>
                <p className="text-xs text-stone-400 mt-0.5">Tick sound during study session</p>
              </div>
              <button onClick={() => setSoundOn((v) => { const next = !v; localStorage.setItem('bubu_sound', next ? 'on' : 'off'); return next })}
                className={`w-12 h-6 rounded-full transition-colors relative ${soundOn ? 'bg-stone-900' : 'bg-stone-200'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${soundOn ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-stone-700">Session Alert</p>
                <p className="text-xs text-stone-400 mt-0.5">Sound when session ends</p>
              </div>
              <button onClick={() => playDing()} className="text-xs font-medium text-stone-500 bg-stone-100 px-3 py-1.5 rounded-full hover:bg-stone-200 transition-colors">
                Test
              </button>
            </div>
            <div className="flex items-center justify-between p-4 border-t border-stone-50">
              <div>
                <p className="text-sm font-medium text-stone-700">Chat Message Sound</p>
                <p className="text-xs text-stone-400 mt-0.5">Ping when partner sends a message</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => playChatPing()} className="text-xs font-medium text-stone-500 bg-stone-100 px-3 py-1.5 rounded-full hover:bg-stone-200 transition-colors">
                  Test
                </button>
                <button onClick={() => setChatSoundOn((v) => { const next = !v; localStorage.setItem('bubu_chat_sound', next ? 'on' : 'off'); return next })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${chatSoundOn ? 'bg-stone-900' : 'bg-stone-200'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${chatSoundOn ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">Stats</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Sessions', value: appState.sessions },
              { label: 'Subjects', value: appState.subjects.length },
              { label: 'Studied', value: formatStudyMinutes(appState.studyMin) },
              { label: 'Bank', value: `${appState.bankMin}m` },
            ].map(s => (
              <div key={s.label} className="bg-white border border-stone-100 rounded-2xl p-4 flex flex-col items-center shadow-sm">
                <span className="text-xl font-semibold text-stone-800">{s.value}</span>
                <span className="text-[10px] font-bold tracking-wider text-stone-400 mt-1">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">Danger Zone</p>
          <div className="bg-white border border-red-100 rounded-2xl shadow-sm p-4">
            <p className="text-sm text-stone-500 mb-3">Clears all subjects, sessions, and progress. Cannot be undone.</p>
            <button onClick={() => setResetOpen(true)}
              className="w-full py-3 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition-colors">
              Full Reset Everything
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
