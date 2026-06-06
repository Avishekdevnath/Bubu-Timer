import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  MessageCircle,
  Settings,
  Timer,
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
import { registerPushToken, subscribeForegroundMessages } from './lib/messaging.js'
import { todayStr } from './lib/dates.js'
import { loadStoredState, loadThemeValue, saveStoredState, saveThemeValue } from './lib/storage.js'
import { flushCloudPushNow, mergeCloudIntoLocal, pullCloudState, queueCloudPush } from './lib/cloudSync.js'
import { buildPlan, startItem, pauseItem, markItemDone, endDay, autoArchiveIfPastCutoff, addItemToPlan, removeItemFromPlan } from './features/plan/planModel.js'
import { dhakaNowMinutes } from './lib/dates.js'
import { ProgressNoteModal } from './components/ProgressNoteModal.jsx'
import { EndDayModal } from './components/EndDayModal.jsx'
import { usePartnerRoom } from './features/partner/usePartnerRoom.js'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'

const PartnerPage        = lazy(() => import('./pages/PartnerPage.jsx').then(m => ({ default: m.PartnerPage })))
const ReportsPage        = lazy(() => import('./pages/ReportsPage.jsx').then(m => ({ default: m.ReportsPage })))
const LogPage            = lazy(() => import('./pages/LogPage.jsx').then(m => ({ default: m.LogPage })))
const SettingsPage       = lazy(() => import('./pages/SettingsPage.jsx').then(m => ({ default: m.SettingsPage })))
const TimerPage          = lazy(() => import('./pages/TimerPage.jsx').then(m => ({ default: m.TimerPage })))
const HomePage           = lazy(() => import('./pages/HomePage.jsx').then(m => ({ default: m.HomePage })))
const PartnerSettingsPage= lazy(() => import('./pages/PartnerSettingsPage.jsx').then(m => ({ default: m.PartnerSettingsPage })))
const SubjectsPage       = lazy(() => import('./pages/SubjectsPage.jsx').then(m => ({ default: m.SubjectsPage })))
const PinnedPage         = lazy(() => import('./pages/PinnedPage.jsx').then(m => ({ default: m.PinnedPage })))
const StarredPage        = lazy(() => import('./pages/StarredPage.jsx').then(m => ({ default: m.StarredPage })))
const ChecklistsPage     = lazy(() => import('./pages/ChecklistsPage.jsx').then(m => ({ default: m.ChecklistsPage })))
import { SubjectModal } from './features/subjects/SubjectModal.jsx'
import { ReportModal } from './features/reports/ReportModal.jsx'
import { ConfirmReset } from './components/ConfirmReset.jsx'

const tabs = [
  { label: 'Home', path: '/home', icon: Home },
  { label: 'Plan', path: '/', icon: Timer },
  { label: 'Chat', path: '/buddy', icon: MessageCircle },
  { label: 'Settings', path: '/settings', icon: Settings },
]

function App() {
  const navigate = useNavigate()
  const [appState, setAppState] = useState(() =>
    autoArchiveIfPastCutoff(loadStoredState(), { todayDate: todayStr(), nowMinutes: dhakaNowMinutes(), now: Date.now() }),
  )
  const [toast, setToast] = useState(null)
  const [theme, setTheme] = useState(() => loadThemeValue())
  const [resetOpen, setResetOpen] = useState(false)
  const [subjectModal, setSubjectModal] = useState(null)
  const [report, setReport] = useState(null)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(() => new Set())
  const [noteModal, setNoteModal] = useState(null)
  const [endDayOpen, setEndDayOpen] = useState(false)
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
        const start = ctx.currentTime + i * 0.13
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(1.0, start + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55)
        osc.start(start)
        osc.stop(start + 0.56)
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
    const time = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Dhaka', hour: 'numeric', minute: '2-digit', hour12: true })
    patchState((state) => ({
      ...state,
      logs: [{ msg: message, type, time }, ...state.logs].slice(0, 60),
    }))
  }

  // FCM foreground messages — show as toast
  useEffect(() => {
    let unsub = () => {}
    subscribeForegroundMessages((payload) => {
      const data = payload.data || {}
      showToast(`${data.title || 'Message'}: ${data.body || ''}`.slice(0, 80), 'study-t')
    }).then((fn) => { unsub = fn })
    return () => unsub()
  }, [])

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
      if (!user) {
        cloudUidRef.current = null
        setCurrentUser((prev) => (prev?.isGuest ? prev : null))
        return
      }
      // Set user immediately so UI updates even if Firestore is slow/fails
      const baseProfile = { uid: user.uid, email: user.email, username: user.displayName || '', partnerName: '', photoURL: user.photoURL || '' }
      cloudUidRef.current = user.uid
      setCurrentUser(baseProfile)
      // Register for push notifications (fire-and-forget)
      registerPushToken(user.uid).catch(() => {})
      try {
        const userRef = doc(firestore, 'users', user.uid)
        const snap = await getDoc(userRef)
        if (!snap.exists()) {
          await setDoc(userRef, { email: user.email, username: user.displayName || '', partnerName: '', photoURL: user.photoURL || '', createdAt: new Date() })
        }
        const data = snap.exists() ? snap.data() : {}
        const profile = { uid: user.uid, email: user.email, username: data.username || user.displayName || '', partnerName: data.partnerName || '', photoURL: data.photoURL || user.photoURL || '' }
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
      } catch {
        // Silently handle Firestore errors
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
    const plan = appState.dailyPlan
    if (!plan?.activeItemId) return
    const interval = setInterval(() => {
      setAppState((prev) => {
        const archived = autoArchiveIfPastCutoff(prev, { todayDate: todayStr(), nowMinutes: dhakaNowMinutes(), now: Date.now() })
        if (archived !== prev) { persistState(archived); return archived }
        if (Math.floor(Date.now() / 1000) % 10 === 0) persistState(prev)
        return { ...prev }
      })
    }, 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState.dailyPlan?.activeItemId])

  function handleStartItem(itemId) {
    getAudioCtx()
    const plan = appState.dailyPlan
    if (plan?.activeItemId === itemId) return  // already running — no-op (prevents runStartTs reset)
    if (plan?.activeItemId && plan.activeItemId !== itemId) {
      setNoteModal({ itemId: plan.activeItemId, mode: 'switchTo', nextItemId: itemId })
      return
    }
    patchState((s) => startItem(s, itemId, Date.now()))
    const it = plan?.items?.find((i) => i.id === itemId)
    addLog(`Started: ${it?.subjectName || ''}`, 'ls')
  }

  function removeFromPlan(itemId) {
    try {
      patchState((s) => removeItemFromPlan(s, itemId))
    } catch (e) {
      showToast(e.message, 'bank-t')
    }
  }

  function openPauseNote() {
    const id = appState.dailyPlan?.activeItemId
    if (id) setNoteModal({ itemId: id, mode: 'pause' })
  }

  function openDoneNote() {
    const id = appState.dailyPlan?.activeItemId
    if (id) setNoteModal({ itemId: id, mode: 'done' })
  }

  function submitNote(note) {
    const m = noteModal
    if (!m) return
    try {
      patchState((s) => {
        if (m.mode === 'done') return markItemDone(s, { note, now: Date.now() })
        const paused = pauseItem(s, { note, now: Date.now() })
        return m.mode === 'switchTo' ? startItem(paused, m.nextItemId, Date.now()) : paused
      })
      addLog(`Progress: ${note}`, 'ls')
    } catch (e) {
      showToast(e.message, 'bank-t')
    }
    setNoteModal(null)
  }

  function submitEndDay(endNote) {
    patchState((s) => endDay(s, { endNote, now: Date.now() }))
    addLog('Day ended', 'lk')
    setEndDayOpen(false)
    showToast('Day ended & archived', 'study-t')
  }

  function createPlan(items) {
    patchState((s) => buildPlan(s, { date: todayStr(), items }))
    showToast('Plan ready', 'study-t')
  }

  function addSubjectToPlan(item) {
    patchState((s) => addItemToPlan(s, item))
    showToast(`Added: ${item.subjectName}`, 'study-t')
  }


  async function signup(event) {
    event.preventDefault()
    const { signupEmail, signupPassword, signupUsername, signupPartnerName } = authForms
    if (!signupEmail || !signupPassword || !signupUsername) return showToast('Email, password, and username required', 'bank-t')
    if (signupPassword.length < 6) return showToast('Password must be at least 6 characters', 'bank-t')
    try {
      const cred = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword)
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
      await signInWithEmailAndPassword(auth, authForms.loginEmail, authForms.loginPassword)
      setAuthForms((forms) => ({ ...forms, loginEmail: '', loginPassword: '' }))
      showToast('Logged in', 'study-t')
    } catch (error) {
      console.error('[Auth] Login error', error.code, error.message)
      showToast(error.message, 'bank-t')
    }
  }

  async function loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      await signInWithPopup(auth, provider)
    } catch (error) {
      if (error?.code === 'auth/popup-closed-by-user') return
      if (error?.code === 'auth/cancelled-popup-request') return
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
            <NavLink key={path} to={path} end
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
          <NavLink to="/settings" className="flex items-center gap-3 bg-white px-3 py-2 rounded-xl border border-stone-100 shadow-sm hover:bg-stone-50 hover:border-stone-200 transition-colors cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 shrink-0">
              <Settings size={13} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-stone-800 truncate">{currentUser?.username || currentUser?.email || 'Not signed in'}</p>
              <p className="text-[10px] text-stone-400">{currentUser?.isGuest ? 'Guest' : currentUser ? 'Signed in' : 'Sign in'}</p>
            </div>
          </NavLink>
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
          <ErrorBoundary>
          <Suspense fallback={<div className="flex items-center justify-center h-32"><div className="w-6 h-6 rounded-full border-2 border-stone-300 border-t-stone-700 animate-spin" /></div>}>
          <Routes>
            <Route path="/home" element={<HomePage />} />
            <Route path="/" element={<TimerPage
              appState={appState} room={room}
              onStartItem={handleStartItem} onPause={openPauseNote} onDone={openDoneNote}
              onEndDay={() => setEndDayOpen(true)} onCreatePlan={createPlan} onAddSubject={addSubjectToPlan}
              onRemoveItem={removeFromPlan}
              navigate={navigate}
            />} />
            <Route path="/subjects" element={<SubjectsPage
              appState={appState} search={search} setSearch={setSearch}
              setSubjectModal={setSubjectModal} expanded={expanded} setExpanded={setExpanded}
              patchState={patchState} navigate={navigate} showToast={showToast}
            />} />
            <Route path="/settings" element={<SettingsPage
              appState={appState} patchState={patchState} currentUser={currentUser} room={room}
              profileForm={profileForm} setProfileForm={setProfileForm} saveProfile={saveProfile}
              soundOn={soundOn} setSoundOn={setSoundOn} chatSoundOn={chatSoundOn} setChatSoundOn={setChatSoundOn}
              playDing={playDing} playChatPing={playChatPing} setResetOpen={setResetOpen}
              authTab={authTab} setAuthTab={setAuthTab} authForms={authForms} setAuthForms={setAuthForms}
              login={login} signup={signup} loginWithGoogle={loginWithGoogle} setCurrentUser={setCurrentUser}
            />} />
            <Route path="/partner-settings" element={<PartnerSettingsPage room={room} showToast={showToast} />} />
            <Route path="/log" element={<LogPage appState={appState} patchState={patchState} />} />
            <Route path="/reports" element={<ReportsPage appState={appState} />} />
            <Route path="/buddy" element={<PartnerPage room={room} currentUser={currentUser} showToast={showToast} navigate={navigate} />} />
            <Route path="/buddy/pins" element={<PinnedPage room={room} navigate={navigate} />} />
            <Route path="/buddy/starred" element={<StarredPage room={room} navigate={navigate} />} />
            <Route path="/buddy/checklists" element={<ChecklistsPage room={room} navigate={navigate} />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
          </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-stone-100 z-20 pb-safe">
        <div className="flex justify-around items-center px-2 py-3">
          {tabs.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} end
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 transition-colors ${isActive ? 'text-stone-900' : 'text-stone-400'}`
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
      {noteModal ? <ProgressNoteModal mode={noteModal.mode} onSubmit={submitNote} onCancel={() => setNoteModal(null)} /> : null}
      {endDayOpen ? <EndDayModal
        onSubmit={submitEndDay}
        onCancel={() => setEndDayOpen(false)}
        runningItemName={appState.dailyPlan?.activeItemId
          ? appState.dailyPlan.items?.find(i => i.id === appState.dailyPlan.activeItemId)?.subjectName
          : null}
      /> : null}
      {subjectModal ? <SubjectModal modal={subjectModal} onClose={() => setSubjectModal(null)} appState={appState} patchState={patchState} setExpanded={setExpanded} showToast={showToast} /> : null}
      {report ? <ReportModal summary={report} onClose={() => setReport(null)} /> : null}
      {resetOpen ? <ConfirmReset onClose={() => setResetOpen(false)} persistState={persistState} setAppState={setAppState} /> : null}
    </div>
  )






}

export default App
