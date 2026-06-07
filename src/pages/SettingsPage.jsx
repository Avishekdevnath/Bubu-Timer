import { CalendarDays, ChartNoAxesColumnIncreasing, ChevronRight, FileText, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase.js'
import { liveElapsedSec } from '../features/plan/planModel.js'
import { minutesToClock12h } from '../lib/dates.js'

export function SettingsPage({
  appState, patchState, currentUser, room, profileForm, setProfileForm, saveProfile,
  soundOn, setSoundOn, chatSoundOn, setChatSoundOn, playDing, playChatPing,
  setResetOpen,
  authTab, setAuthTab, authForms, setAuthForms, login, signup, loginWithGoogle, setCurrentUser,
}) {
  const navigate = useNavigate()
  const accountLabel = currentUser?.email || (currentUser?.isGuest ? 'Guest mode' : 'Not signed in')
  const pair = room?.pair
  const partnerConnected = !!pair?.connected
  const partnerLiveName = pair?.partnerNick || pair?.data?.name || ''

  const items = appState.dailyPlan?.items || []
  // eslint-disable-next-line react-hooks/purity
  const studiedMin = Math.floor(items.reduce((sum, it) => sum + liveElapsedSec(it, Date.now()), 0) / 60)
  const doneCount = items.filter((i) => i.status === 'done').length

  const cutoffH = String(Math.floor(appState.dayCutoff / 60)).padStart(2, '0')
  const cutoffM = String(appState.dayCutoff % 60).padStart(2, '0')

  return (
    <div className="w-full px-4 md:px-6 pt-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-light tracking-tight text-stone-800">Settings</h2>
          <p className="text-sm text-stone-500 mt-0.5">{items.length} subjects · {studiedMin}m studied</p>
        </div>
      </div>

      <div className="space-y-4">
        <section>
          <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">Insights</p>
          <div className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden">
            <button onClick={() => navigate('/reports')}
              className="w-full flex items-center gap-3 p-4 hover:bg-stone-50 transition-colors text-left border-b border-stone-50">
              <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-600"><ChartNoAxesColumnIncreasing size={16} /></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-stone-800">Reports</p>
                <p className="text-xs text-stone-400">Trends, streak, day-by-day</p>
              </div>
              <ChevronRight size={16} className="text-stone-300" />
            </button>
            <button onClick={() => navigate('/log')}
              className="w-full flex items-center gap-3 p-4 hover:bg-stone-50 transition-colors text-left border-b border-stone-50">
              <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-600"><FileText size={16} /></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-stone-800">Activity Log</p>
                <p className="text-xs text-stone-400">Recent sessions & events</p>
              </div>
              <ChevronRight size={16} className="text-stone-300" />
            </button>
            <button onClick={() => navigate('/plan-log')}
              className="w-full flex items-center gap-3 p-4 hover:bg-stone-50 transition-colors text-left">
              <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-600"><CalendarDays size={16} /></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-stone-800">Plan History</p>
                <p className="text-xs text-stone-400">Daily plans, progress & results</p>
              </div>
              <div className="flex items-center gap-2">
                {(appState.planHistory || []).length > 0 && (
                  <span className="text-xs font-semibold text-stone-400">{(appState.planHistory || []).length}d</span>
                )}
                <ChevronRight size={16} className="text-stone-300" />
              </div>
            </button>
          </div>
        </section>

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
                <div className="field-in mb-0 flex items-center justify-between bg-stone-50 text-stone-700 cursor-default">
                  <span className={partnerConnected ? '' : 'text-stone-400'}>
                    {partnerConnected ? (partnerLiveName || 'Partner') : 'Not connected'}
                  </span>
                  {partnerConnected && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  Auto-synced from your buddy room.{' '}
                  <button type="button" onClick={() => navigate('/buddy')} className="font-semibold text-stone-600 underline">Set nickname</button>
                </p>
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
          <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">Day Schedule</p>
          <div className="bg-white border border-stone-100 rounded-2xl shadow-sm p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-700">Day ends at</p>
              <p className="text-xs text-stone-400 mt-0.5">Auto-archives your plan · {minutesToClock12h(appState.dayCutoff)}</p>
            </div>
            <input type="time" value={`${cutoffH}:${cutoffM}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number)
                patchState((s) => ({ ...s, dayCutoff: h * 60 + m }))
              }}
              className="border border-stone-200 rounded-lg px-2 py-1.5 text-sm" />
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
              { label: 'Subjects today', value: items.length },
              { label: 'Done', value: doneCount },
              { label: 'Studied', value: `${studiedMin}m` },
              { label: 'Past days', value: (appState.planHistory || []).length, link: '/plan-log' },
            ].map((s) => (
              s.link ? (
                <button key={s.label} onClick={() => navigate(s.link)} className="bg-white border border-stone-100 rounded-2xl p-4 flex flex-col items-center shadow-sm hover:bg-stone-50 transition-colors">
                  <span className="text-xl font-semibold text-stone-800">{s.value}</span>
                  <span className="text-[10px] font-bold tracking-wider text-stone-400 mt-1">{s.label}</span>
                </button>
              ) : (
                <div key={s.label} className="bg-white border border-stone-100 rounded-2xl p-4 flex flex-col items-center shadow-sm">
                  <span className="text-xl font-semibold text-stone-800">{s.value}</span>
                  <span className="text-[10px] font-bold tracking-wider text-stone-400 mt-1">{s.label}</span>
                </div>
              )
            ))}
          </div>
        </section>

        <section>
          <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">Account</p>
          {currentUser && !currentUser.isGuest ? (
            <div className="bg-white border border-stone-100 rounded-2xl shadow-sm p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 shrink-0">
                {currentUser.photoURL
                  ? <img src={currentUser.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
                  : <User size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-800 truncate">{currentUser.username || 'No name'}</p>
                <p className="text-xs text-stone-400 truncate">{currentUser.email}</p>
              </div>
              <button onClick={() => signOut(auth)}
                className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors shrink-0">
                Sign out
              </button>
            </div>
          ) : (
            <div className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex border-b border-stone-100">
                <button onClick={() => setAuthTab('login')}
                  className={`flex-1 py-3 text-sm font-semibold transition-colors ${authTab === 'login' ? 'text-stone-900 border-b-2 border-stone-900 -mb-px' : 'text-stone-400'}`}>
                  Sign In
                </button>
                <button onClick={() => setAuthTab('signup')}
                  className={`flex-1 py-3 text-sm font-semibold transition-colors ${authTab === 'signup' ? 'text-stone-900 border-b-2 border-stone-900 -mb-px' : 'text-stone-400'}`}>
                  Create Account
                </button>
              </div>
              <div className="p-4">
                {authTab === 'login' ? (
                  <form onSubmit={login} className="space-y-2">
                    <input className="field-in" type="email" placeholder="your@email.com" value={authForms.loginEmail} onChange={(e) => setAuthForms({ ...authForms, loginEmail: e.target.value })} />
                    <input className="field-in" type="password" placeholder="Password" value={authForms.loginPassword} onChange={(e) => setAuthForms({ ...authForms, loginPassword: e.target.value })} />
                    <button className="w-full py-3 bg-stone-900 text-white text-sm font-semibold rounded-xl">Sign In</button>
                  </form>
                ) : (
                  <form onSubmit={signup} className="space-y-2">
                    <input className="field-in" type="email" placeholder="your@email.com" value={authForms.signupEmail} onChange={(e) => setAuthForms({ ...authForms, signupEmail: e.target.value })} />
                    <input className="field-in" type="password" placeholder="At least 6 characters" value={authForms.signupPassword} onChange={(e) => setAuthForms({ ...authForms, signupPassword: e.target.value })} />
                    <input className="field-in" placeholder="Your name" value={authForms.signupUsername} onChange={(e) => setAuthForms({ ...authForms, signupUsername: e.target.value })} />
                    <button className="w-full py-3 bg-stone-900 text-white text-sm font-semibold rounded-xl">Create Account</button>
                  </form>
                )}
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-stone-100" /><span className="text-xs text-stone-400">OR</span><div className="flex-1 h-px bg-stone-100" />
                </div>
                <button type="button" onClick={loginWithGoogle}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors mb-2">
                  <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.4C29.6 34.7 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8L6 33.1C9.2 39.5 16 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.5 5.4C40.9 36 44 30.5 44 24c0-1.2-.1-2.3-.4-3.5z"/></svg>
                  Continue with Google
                </button>
                <button onClick={() => setCurrentUser({ uid: `guest-${Date.now()}`, isGuest: true, username: 'Guest', partnerName: '' })}
                  className="w-full py-2.5 border border-stone-200 rounded-xl text-sm text-stone-500 hover:bg-stone-50 transition-colors">
                  Continue as Guest
                </button>
              </div>
            </div>
          )}
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
