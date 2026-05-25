import { useEffect, useRef, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  ChartNoAxesColumnIncreasing,
  ClipboardList,
  FileText,
  Settings,
  Timer,
  User,
  Users,
} from 'lucide-react'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { auth, firestore } from './lib/firebase.js'
import { pad } from './lib/format.js'
import { todayStr } from './lib/dates.js'
import { loadStoredState, loadThemeValue, saveStoredState, saveThemeValue } from './lib/storage.js'
import { flushCloudPushNow, mergeCloudIntoLocal, pullCloudState, queueCloudPush } from './lib/cloudSync.js'
import { getActiveChapter, getActiveSubject } from './features/subjects/subjectsModel.js'
import { checkRolloverActiveTarget, getTargetProgress } from './features/goals/goalsModel.js'
import { completeStudySession, resetToIdle, startBreak, startStudy } from './features/timer/timerEngine.js'
import { BreakPrompt } from './components/Modal.jsx'
import { usePartnerRoom } from './features/partner/usePartnerRoom.js'
import { PartnerPage } from './pages/PartnerPage.jsx'
import { ReportsPage } from './pages/ReportsPage.jsx'
import { LogPage } from './pages/LogPage.jsx'
import { SettingsPage } from './pages/SettingsPage.jsx'
import { AccountPage } from './pages/AccountPage.jsx'
import { TimerPage } from './pages/TimerPage.jsx'
import { SubjectsPage } from './pages/SubjectsPage.jsx'
import { PinnedPage } from './pages/PinnedPage.jsx'
import { StarredPage } from './pages/StarredPage.jsx'
import { SubjectModal } from './features/subjects/SubjectModal.jsx'
import { GoalModal } from './features/goals/GoalModal.jsx'
import { ReportModal } from './features/reports/ReportModal.jsx'
import { ConfirmReset } from './components/ConfirmReset.jsx'

const tabs = [
  { label: 'Timer', path: '/', icon: Timer },
  { label: 'Subjects', path: '/subjects', icon: ClipboardList },
  { label: 'Reports', path: '/reports', icon: ChartNoAxesColumnIncreasing },
  { label: 'Partner', path: '/buddy', icon: Users },
  { label: 'Log', path: '/log', icon: FileText },
  { label: 'Settings', path: '/settings', icon: Settings },
  { label: 'Account', path: '/account', icon: User },
]

function App() {
  const navigate = useNavigate()
  const [appState, setAppState] = useState(() => checkRolloverActiveTarget(loadStoredState()))
  const [toast, setToast] = useState(null)
  const [theme, setTheme] = useState(() => loadThemeValue())
  const [resetOpen, setResetOpen] = useState(false)
  const [subjectModal, setSubjectModal] = useState(null)
  const [goalOpen, setGoalOpen] = useState(false)
  const [report, setReport] = useState(null)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(() => new Set())
  const [bankUse, setBankUse] = useState('')
  const [authTab, setAuthTab] = useState('login')
  const [currentUser, setCurrentUser] = useState(null)
  const [authForms, setAuthForms] = useState({
    loginEmail: '',
    loginPassword: '',
    signupEmail: '',
    signupPassword: '',
    signupUsername: '',
    signupPartnerName: '',
  })
  const [profileForm, setProfileForm] = useState({ username: '', partnerName: '' })
  const toastTimer = useRef(null)
  const cloudUidRef = useRef(null)
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem('bubu_sound') !== 'off')
  const soundOnRef = useRef(soundOn)
  const [chatSoundOn, setChatSoundOn] = useState(() => localStorage.getItem('bubu_chat_sound') !== 'off')
  const chatSoundOnRef = useRef(chatSoundOn)
  const tickAudioCtx = useRef(null)
  const alertAudioRef = useRef(null)

  // Persist locally + (when signed in to a real account) queue a debounced Firestore mirror.
  function persistState(next) {
    saveStoredState(next)
    if (cloudUidRef.current) queueCloudPush(cloudUidRef.current, next)
  }

  const activeSubject = getActiveSubject(appState)
  const activeChapter = getActiveChapter(appState)
  const targetProgress = getTargetProgress(appState, appState.activeTarget)

  function getAudioCtx() {
    if (!tickAudioCtx.current) {
      tickAudioCtx.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (tickAudioCtx.current.state === 'suspended') {
      tickAudioCtx.current.resume()
    }
    return tickAudioCtx.current
  }

  function playDing() {
    stopDing()
    const audio = new Audio('/sounds/alert.mp3')
    audio.volume = 0.8
    audio.loop = true
    alertAudioRef.current = audio
    audio.play().catch(() => {})
    setTimeout(() => { if (alertAudioRef.current === audio) stopDing() }, 15000)
  }

  function stopDing() {
    const audio = alertAudioRef.current
    if (!audio) return
    alertAudioRef.current = null
    audio.onended = null
    try { audio.pause() } catch { /* ignore */ }
    try { audio.currentTime = 0 } catch { /* ignore */ }
    try { audio.src = '' } catch { /* ignore */ } // force browser to release/stop
  }

  async function playChatPing() {
    if (!chatSoundOnRef.current) return
    try {
      const ctx = getAudioCtx()
      if (ctx.state !== 'running') await ctx.resume()
      const tones = [1200, 900]
      tones.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = freq
        const start = ctx.currentTime + i * 0.12
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(0.9, start + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35)
        osc.start(start)
        osc.stop(start + 0.36)
      })
    } catch { /* ignore */ }
  }

  function showToast(message, type = '') {
    clearTimeout(toastTimer.current)
    setToast({ message, type })
    toastTimer.current = setTimeout(() => setToast(null), 2800)
  }

  function patchState(updater) {
    setAppState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      persistState(next)
      return next
    })
  }

  const room = usePartnerRoom({ currentUser, appState, showToast, playChatPing })

  function addLog(message, type = '') {
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }))
    patchState((state) => ({
      ...state,
      logs: [{ msg: message, type, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` }, ...state.logs].slice(0, 60),
    }))
  }

  // Unlock AudioContext on first user interaction anywhere in the app
  useEffect(() => {
    function unlock() {
      if (tickAudioCtx.current && tickAudioCtx.current.state === 'suspended') {
        tickAudioCtx.current.resume()
      }
    }
    document.addEventListener('click', unlock, { once: false, passive: true })
    document.addEventListener('touchstart', unlock, { once: false, passive: true })
    return () => {
      document.removeEventListener('click', unlock)
      document.removeEventListener('touchstart', unlock)
    }
  }, [])

  useEffect(() => {
    document.documentElement.toggleAttribute('data-theme', theme === 'dark')
    const themeColor = document.getElementById('themeColor')
    if (themeColor) themeColor.content = theme === 'dark' ? '#1b150e' : '#ece1c4'
    saveThemeValue(theme)
  }, [theme])

  useEffect(() => {
    // Complete Google redirect sign-in if returning from redirect

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[Auth] onAuthStateChanged fired', user ? { uid: user.uid, email: user.email, provider: user.providerData?.[0]?.providerId } : 'null')
      if (!user) {
        cloudUidRef.current = null
        setCurrentUser((prev) => (prev?.isGuest ? prev : null))
        return
      }
      // Set user immediately so UI updates even if Firestore is slow/fails
      const baseProfile = { uid: user.uid, email: user.email, username: user.displayName || '', partnerName: '', photoURL: user.photoURL || '' }
      cloudUidRef.current = user.uid
      setCurrentUser(baseProfile)
      console.log('[Auth] Setting currentUser (base)', baseProfile)
      try {
        const userRef = doc(firestore, 'users', user.uid)
        const snap = await getDoc(userRef)
        if (!snap.exists()) {
          await setDoc(userRef, { email: user.email, username: user.displayName || '', partnerName: '', photoURL: user.photoURL || '', createdAt: new Date() })
        }
        const data = snap.exists() ? snap.data() : {}
        const profile = { uid: user.uid, email: user.email, username: data.username || user.displayName || '', partnerName: data.partnerName || '', photoURL: data.photoURL || user.photoURL || '' }
        console.log('[Auth] Setting currentUser (full)', profile)
        setCurrentUser(profile)

        // Pull cloud state. Compare to local savedAt; newer wins (LWW).
        const cloud = await pullCloudState(user.uid)
        if (cloud?.state) {
          let localSavedAt = 0
          try {
            const raw = localStorage.getItem('bubu_state')
            if (raw) localSavedAt = JSON.parse(raw).savedAt || 0
          } catch { /* ignore */ }
          if ((cloud.updatedAtMs || 0) > localSavedAt) {
            setAppState((prev) => {
              const merged = mergeCloudIntoLocal(prev, cloud)
              saveStoredState(merged)
              return merged
            })
            showToast('Synced from cloud', 'study-t')
          } else if (localSavedAt > (cloud.updatedAtMs || 0)) {
            // Local is newer — push it up so other devices catch up.
            queueCloudPush(user.uid, appState)
          }
        } else {
          // First sync — push current local state to seed the cloud doc.
          queueCloudPush(user.uid, appState)
        }
      } catch (error) {
        console.error('[Auth] Firestore error', error.code, error.message)
      }
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { soundOnRef.current = soundOn }, [soundOn])
  useEffect(() => { chatSoundOnRef.current = chatSoundOn }, [chatSoundOn])

  // Clock tick sound while studying
  useEffect(() => {
    if (appState.mode !== 'study' || !appState.endTs) return
    const tick = () => {
      if (!soundOnRef.current) return
      try {
        const ctx = getAudioCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'square'
        osc.frequency.setValueAtTime(900, ctx.currentTime)
        gain.gain.setValueAtTime(0.4, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.08)
      } catch { /* ignore */ }
    }
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [appState.mode, appState.endTs])

  // Flush any pending cloud push when tab leaves so we never drop the latest state.
  useEffect(() => {
    const flush = () => { flushCloudPushNow() }
    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush() })
    return () => {
      window.removeEventListener('beforeunload', flush)
      document.removeEventListener('visibilitychange', flush)
    }
  }, [])

  // Prefill profile form when currentUser is loaded/changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (currentUser) setProfileForm({ username: currentUser.username || '', partnerName: currentUser.partnerName || '' })
  }, [currentUser])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js').catch(() => {}), { once: true })
  }, [])

  // Partner room boot restore + auto-push moved into usePartnerRoom hook

  useEffect(() => {
    if (appState.mode === 'idle' || !appState.endTs) return
    const interval = setInterval(() => {
      setAppState((prev) => {
        if (prev.mode === 'idle' || !prev.endTs) return prev
        const remaining = Math.max(0, Math.ceil((prev.endTs - Date.now()) / 1000))
        if (remaining > 0) {
          const next = {
            ...prev,
            timeLeft: remaining,
            studyMin:
              prev.mode === 'study'
                ? prev.sessions * prev.studyDuration + Math.floor((prev.studyDuration * 60 - remaining) / 60)
                : prev.studyMin,
          }
          if (remaining % 10 === 0) persistState(next)
          return next
        }
        if (prev.mode === 'study') {
          const next = completeStudySession(prev, prev.studyDuration, todayStr())
          persistState(next)
          setTimeout(() => {
            playDing()
            showToast('Session done! Take a break or bank it.', 'study-t')
          }, 0)
          return next
        }
        const next = resetToIdle(prev)
        persistState(next)
        setTimeout(() => {
          playDing()
          showToast('Break done. Start next session.', 'break-t')
        }, 0)
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
    // playDing is stable closure; including it would cause needless effect resets
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState.mode, appState.endTs])

  function handleMain() {
    getAudioCtx() // unlock AudioContext on user gesture
    if (appState.mode === 'idle') {
      patchState((state) => startStudy(state))
      addLog(`Started: ${activeChapter ? `${activeSubject?.name} -> ${activeChapter.name}` : activeSubject?.name || ''}`, 'ls')
      return
    }
    if (appState.mode === 'study') {
      if (appState.endTs) {
        patchState((state) => ({
          ...state,
          pausedRemaining: Math.max(0, Math.ceil((state.endTs - Date.now()) / 1000)),
          endTs: null,
        }))
      } else {
        patchState((state) => ({
          ...state,
          endTs: Date.now() + (state.pausedRemaining || state.timeLeft) * 1000,
          pausedRemaining: null,
        }))
      }
      return
    }
    bankCurrentBreak()
  }

  function bankCurrentBreak() {
    const minutes = Math.ceil(appState.timeLeft / 60)
    patchState((state) => resetToIdle({ ...state, bankMin: state.bankMin + minutes }))
    addLog(`Break skipped -> +${minutes} min banked`, 'lk')
    showToast(`+${minutes} min banked`, 'bank-t')
  }

  function acceptBreak() {
    stopDing()
    const seconds = appState.pendingBreakSec || appState.breakDuration * 60
    patchState((state) => startBreak(state, seconds))
    addLog(`Break started (${Math.round(seconds / 60)} min)`, 'lb')
  }

  function rejectBreak() {
    stopDing()
    const minutes = Math.ceil((appState.pendingBreakSec || appState.breakDuration * 60) / 60)
    patchState((state) => resetToIdle({ ...state, bankMin: state.bankMin + minutes, pendingBreakSec: null }))
    addLog(`Break rejected -> +${minutes} min banked`, 'lk')
    showToast(`+${minutes} min banked`, 'bank-t')
  }

  function spendBank() {
    const minutes = Number.parseInt(bankUse, 10)
    if (!minutes || minutes <= 0) return showToast('Enter minutes', 'bank-t')
    if (minutes > appState.bankMin) return showToast(`Only ${appState.bankMin} min in bank`, 'bank-t')
    patchState((state) => startBreak({ ...state, bankMin: state.bankMin - minutes }, minutes * 60))
    setBankUse('')
    addLog(`Used ${minutes} min from bank`, 'lk')
  }


  async function signup(event) {
    event.preventDefault()
    const { signupEmail, signupPassword, signupUsername, signupPartnerName } = authForms
    if (!signupEmail || !signupPassword || !signupUsername) return showToast('Email, password, and username required', 'bank-t')
    if (signupPassword.length < 6) return showToast('Password must be at least 6 characters', 'bank-t')
    try {
      console.log('[Auth] Signing up', signupEmail)
      const cred = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword)
      console.log('[Auth] Signup success', cred.user.uid)
      await setDoc(doc(firestore, 'users', cred.user.uid), {
        email: signupEmail,
        username: signupUsername,
        partnerName: signupPartnerName || '',
        createdAt: new Date(),
      })
      setAuthForms({ loginEmail: '', loginPassword: '', signupEmail: '', signupPassword: '', signupUsername: '', signupPartnerName: '' })
      showToast(`Welcome ${signupUsername}`, 'study-t')
    } catch (error) {
      showToast(error.message, 'bank-t')
    }
  }

  async function login(event) {
    event.preventDefault()
    if (!authForms.loginEmail || !authForms.loginPassword) return showToast('Email and password required', 'bank-t')
    try {
      console.log('[Auth] Logging in', authForms.loginEmail)
      const cred = await signInWithEmailAndPassword(auth, authForms.loginEmail, authForms.loginPassword)
      console.log('[Auth] Login success', cred.user.uid)
      setAuthForms((forms) => ({ ...forms, loginEmail: '', loginPassword: '' }))
      showToast('Logged in', 'study-t')
    } catch (error) {
      console.error('[Auth] Login error', error.code, error.message)
      showToast(error.message, 'bank-t')
    }
  }

  async function loginWithGoogle() {
    try {
      console.log('[Auth] starting signInWithPopup...')
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const cred = await signInWithPopup(auth, provider)
      console.log('[Auth] signInWithPopup success', cred.user.uid)
    } catch (error) {
      if (error?.code === 'auth/popup-closed-by-user') return
      if (error?.code === 'auth/cancelled-popup-request') return
      console.error('[Auth] signInWithPopup ERROR', error.code, error.message)
      showToast(error.message || 'Google sign-in failed', 'bank-t')
    }
  }

  async function saveProfile() {
    if (!profileForm.username.trim()) return showToast('Please enter your name', 'bank-t')
    if (currentUser?.isGuest) {
      setCurrentUser((user) => ({ ...user, username: profileForm.username, partnerName: profileForm.partnerName }))
      return showToast('Profile updated locally', 'study-t')
    }
    if (!currentUser) return showToast('Please log in first', 'bank-t')
    await updateDoc(doc(firestore, 'users', currentUser.uid), { ...profileForm, updatedAt: new Date() })
    setCurrentUser((user) => ({ ...user, ...profileForm }))
    showToast('Profile updated', 'study-t')
  }



  return (
    <div className="flex h-screen bg-[#FDFCF9] text-stone-900 overflow-hidden">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-60 flex-col border-r border-stone-200 bg-[#FDFCF9]/90 backdrop-blur-md shrink-0">
        <div className="px-6 py-5 border-b border-stone-100">
          <div className="flex items-center gap-2 text-lg font-semibold tracking-tight text-stone-800">
            <Timer size={20} className="text-stone-500" /> Bubu Timer
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {tabs.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full ${
                  isActive ? 'bg-stone-100 text-stone-900' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'

                }`
              }
            >
              {({ isActive }) => (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />{label}
                  </div>
                  {path === '/buddy' && room.unreadChat && !isActive && (
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-stone-100">
          <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-xl border border-stone-100 shadow-sm">
            <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 shrink-0">
              <User size={13} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-stone-800 truncate">{currentUser?.username || currentUser?.email || 'Not signed in'}</p>
              <p className="text-[10px] text-stone-400">{currentUser?.isGuest ? 'Guest' : currentUser ? 'Signed in' : 'Tap Account'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 bg-[#FDFCF9]/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div className="md:hidden text-lg font-semibold tracking-tight">Bubu Timer</div>
          <div className="flex-1 md:flex-none" />
          <div className="flex items-center gap-3">
            <div className="text-xs font-medium text-stone-500 bg-white border border-stone-200 px-3 py-1.5 rounded-full shadow-sm">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-stone-100 transition-colors text-stone-500"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        {/* Screen content */}
        <main className={`flex-1 overflow-x-hidden ${useLocation().pathname === '/buddy' ? 'overflow-hidden' : 'overflow-y-auto pb-20 md:pb-6'}`}>
          <Routes>
            <Route path="/" element={<TimerPage
              appState={appState} patchState={patchState} targetProgress={targetProgress}
              activeSubject={activeSubject} activeChapter={activeChapter}
              soundOn={soundOn} setSoundOn={setSoundOn} setGoalOpen={setGoalOpen}
              handleMain={handleMain} bankCurrentBreak={bankCurrentBreak}
              bankUse={bankUse} setBankUse={setBankUse} spendBank={spendBank}
              navigate={navigate}
            />} />
            <Route path="/subjects" element={<SubjectsPage
              appState={appState} search={search} setSearch={setSearch}
              setSubjectModal={setSubjectModal} expanded={expanded} setExpanded={setExpanded}
              patchState={patchState} navigate={navigate} showToast={showToast}
            />} />
            <Route path="/settings" element={<SettingsPage
              appState={appState} patchState={patchState} currentUser={currentUser}
              profileForm={profileForm} setProfileForm={setProfileForm} saveProfile={saveProfile}
              soundOn={soundOn} setSoundOn={setSoundOn} chatSoundOn={chatSoundOn} setChatSoundOn={setChatSoundOn}
              playDing={playDing} playChatPing={playChatPing}
              setReport={setReport} setResetOpen={setResetOpen}
            />} />
            <Route path="/account" element={<AccountPage
              currentUser={currentUser} authTab={authTab} setAuthTab={setAuthTab}
              authForms={authForms} setAuthForms={setAuthForms}
              login={login} signup={signup} loginWithGoogle={loginWithGoogle}
              setCurrentUser={setCurrentUser}
            />} />
            <Route path="/log" element={<LogPage appState={appState} patchState={patchState} />} />
            <Route path="/reports" element={<ReportsPage appState={appState} />} />
            <Route path="/buddy" element={<PartnerPage room={room} currentUser={currentUser} showToast={showToast} navigate={navigate} />} />
            <Route path="/buddy/pins" element={<PinnedPage room={room} navigate={navigate} />} />
            <Route path="/buddy/starred" element={<StarredPage room={room} navigate={navigate} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-stone-100 z-20 pb-safe">
        <div className="flex justify-around items-center px-2 py-3">
          {tabs.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-2 transition-colors ${isActive ? 'text-stone-900' : 'text-stone-400'}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon size={21} strokeWidth={isActive ? 2.5 : 1.5} />
                    {path === '/buddy' && room.unreadChat && !isActive && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{label.split(' ')[0]}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ── Overlays ── */}
      {toast ? <div className="toast show">{toast.message}</div> : null}
      {appState.pendingBreakSec ? <BreakPrompt onAccept={acceptBreak} onReject={rejectBreak} onStopSound={stopDing} minutes={Math.round(appState.pendingBreakSec / 60)} /> : null}
      {subjectModal ? <SubjectModal modal={subjectModal} onClose={() => setSubjectModal(null)} appState={appState} patchState={patchState} setExpanded={setExpanded} showToast={showToast} /> : null}
      {goalOpen ? <GoalModal onClose={() => setGoalOpen(false)} appState={appState} patchState={patchState} addLog={addLog} /> : null}
      {report ? <ReportModal summary={report} onClose={() => setReport(null)} /> : null}
      {resetOpen ? <ConfirmReset onClose={() => setResetOpen(false)} persistState={persistState} setAppState={setAppState} /> : null}
    </div>
  )






}

export default App
