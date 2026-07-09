import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { ChevronDown, ChevronUp, RefreshCw, Send, ShieldCheck, ShieldOff, Trash2, RotateCcw } from 'lucide-react'
import { AppModal } from '../components/AppModal.jsx'
import { listUsers, resetUser, deleteUser, setUserDisabled, broadcast } from '../features/admin/adminApi.js'
import { AdminDashboardTab } from '../features/admin/AdminDashboardTab.jsx'
import { AdminRoomsTab } from '../features/admin/AdminRoomsTab.jsx'
import { AdminBroadcastTab } from '../features/admin/AdminBroadcastTab.jsx'
import { AdminLogsTab } from '../features/admin/AdminLogsTab.jsx'
import { database } from '../lib/firebase.js'

const TABS = ['dashboard', 'users', 'rooms', 'broadcast', 'logs']

export function AdminPage({ showToast, currentUser }) {
  const [tab, setTab] = useState('dashboard')
  return (
    <div className="w-full px-4 md:px-6 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck size={20} className="text-stone-700" />
        <h2 className="text-2xl font-light tracking-tight text-stone-800">Admin</h2>
      </div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-colors ${tab === t ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-500 hover:bg-stone-50'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'dashboard' && <AdminDashboardTab showToast={showToast} onOpenLogs={() => setTab('logs')} />}
      {tab === 'users' && <UsersTab showToast={showToast} currentUser={currentUser} />}
      {tab === 'rooms' && <AdminRoomsTab showToast={showToast} />}
      {tab === 'broadcast' && <AdminBroadcastTab showToast={showToast} />}
      {tab === 'logs' && <AdminLogsTab />}
    </div>
  )
}

function UsersTab({ showToast, currentUser }) {
  const [users, setUsers] = useState(null)
  const [rooms, setRooms] = useState(null)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(null) // { kind: 'reset'|'delete'|'disable', user }
  const [confirmText, setConfirmText] = useState('')
  const [expandedUid, setExpandedUid] = useState(null)
  const [pushTitle, setPushTitle] = useState('')
  const [pushBody, setPushBody] = useState('')
  const [pushing, setPushing] = useState(false)

  async function refresh() {
    setBusy(true)
    try {
      const res = await listUsers()
      setUsers(res.users)
    } catch (err) {
      showToast(`Load failed: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }
  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return onValue(ref(database, 'rooms'), (snap) => setRooms(snap.val() || {}), () => {})
  }, [])

  function activeRoomFor(uid) {
    for (const [code, room] of Object.entries(rooms || {})) {
      if (room?.A?.uid === uid || room?.B?.uid === uid) return code
    }
    return null
  }

  async function runConfirm() {
    const { kind, user } = confirm
    setBusy(true)
    try {
      if (kind === 'reset') await resetUser(user.uid)
      else if (kind === 'delete') await deleteUser(user.uid)
      else await setUserDisabled(user.uid, !user.disabled)
      showToast(kind === 'reset' ? 'State reset' : kind === 'delete' ? 'Account deleted' : (user.disabled ? 'Account enabled' : 'Account disabled'))
      setConfirm(null)
      setConfirmText('')
      await refresh()
    } catch (err) {
      showToast(`Failed: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  async function sendPush(uid) {
    if (!pushTitle.trim() || !pushBody.trim()) { showToast('Title and body required'); return }
    setPushing(true)
    try {
      const res = await broadcast(pushTitle.trim(), pushBody.trim(), undefined, uid)
      showToast(`Sent to ${res.sent}/${res.tokens} devices`)
      setPushTitle(''); setPushBody('')
    } catch (err) {
      showToast(`Push failed: ${err.message}`)
    } finally {
      setPushing(false)
    }
  }

  const deleteArmed = confirm?.kind !== 'delete' || confirmText === confirm.user.email

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs text-stone-400">{users ? `${users.length} accounts` : 'Loading…'}</p>
        <button onClick={refresh} disabled={busy}
          className="flex items-center gap-1.5 text-xs font-medium text-stone-500 bg-white border border-stone-200 px-3 py-1.5 rounded-full hover:bg-stone-50 disabled:opacity-50">
          <RefreshCw size={12} className={busy ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>
      <div className="space-y-2">
        {(users || []).map((u) => {
          const expanded = expandedUid === u.uid
          const activeRoom = activeRoomFor(u.uid)
          const devices = Object.entries(u.fcmTokens || {})
          return (
            <div key={u.uid} className="bg-white border border-stone-100 rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between gap-3">
                <button onClick={() => setExpandedUid(expanded ? null : u.uid)} className="min-w-0 text-left flex-1">
                  <p className="text-sm font-semibold text-stone-800 truncate flex items-center gap-1.5">
                    {u.displayName || '(no name)'}
                    {u.uid === currentUser?.uid && <span className="text-[10px] font-bold text-emerald-600">YOU</span>}
                    {u.disabled && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">DISABLED</span>}
                  </p>
                  <p className="text-xs text-stone-400 truncate">{u.email}</p>
                  <p className="text-[10px] text-stone-400 mt-1">
                    {u.subjectsCount} subjects · {u.planDays} plan days · {u.tokenCount} devices ·
                    last sign-in {u.lastSignInTime ? new Date(u.lastSignInTime).toLocaleDateString() : '—'}
                  </p>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => { setConfirm({ kind: 'reset', user: u }); setConfirmText('') }}
                    className="p-2 rounded-full border border-stone-200 text-stone-500 hover:bg-stone-50" title="Reset state">
                    <RotateCcw size={14} />
                  </button>
                  {u.uid !== currentUser?.uid && (
                    <button onClick={() => { setConfirm({ kind: 'delete', user: u }); setConfirmText('') }}
                      className="p-2 rounded-full border border-red-200 text-red-500 hover:bg-red-50" title="Delete account">
                      <Trash2 size={14} />
                    </button>
                  )}
                  {expanded ? <ChevronUp size={14} className="text-stone-300" /> : <ChevronDown size={14} className="text-stone-300" />}
                </div>
              </div>

              {expanded && (
                <div className="mt-3 pt-3 border-t border-stone-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-stone-500">Active room: {activeRoom || 'none'}</p>
                    {u.uid !== currentUser?.uid && (
                      <button onClick={() => { setConfirm({ kind: 'disable', user: u }); setConfirmText('') }}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${u.disabled ? 'text-emerald-600 border-emerald-200 hover:bg-emerald-50' : 'text-red-500 border-red-200 hover:bg-red-50'}`}>
                        <ShieldOff size={12} /> {u.disabled ? 'Enable account' : 'Disable account'}
                      </button>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1.5">Devices</p>
                    {devices.length === 0 && <p className="text-xs text-stone-400">No devices registered</p>}
                    {devices.map(([token, meta]) => (
                      <p key={token} className="text-xs text-stone-500 truncate">
                        {token.slice(0, 16)}… · {meta?.ts ? new Date(meta.ts).toLocaleDateString() : '—'}
                      </p>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1.5">Push to this user</p>
                    <div className="space-y-2">
                      <input className="field-in" placeholder="Title" maxLength={100}
                        value={pushTitle} onChange={(e) => setPushTitle(e.target.value)} />
                      <textarea className="field-in resize-none" rows={2} placeholder="Message" maxLength={500}
                        value={pushBody} onChange={(e) => setPushBody(e.target.value)} />
                      <button onClick={() => sendPush(u.uid)} disabled={pushing}
                        className="w-full py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
                        <Send size={14} /> {pushing ? 'Sending…' : 'Send'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {confirm && (
        <AppModal title={confirm.kind === 'reset' ? 'Reset user state?' : confirm.kind === 'delete' ? 'Delete account?' : (confirm.user.disabled ? 'Enable account?' : 'Disable account?')} onClose={() => setConfirm(null)}>
          <p className="text-sm text-stone-500 mb-3">
            {confirm.kind === 'reset' && `Wipes all subjects, plans and history for ${confirm.user.email}. Profile and devices survive. Cannot be undone.`}
            {confirm.kind === 'delete' && `Permanently deletes ${confirm.user.email}: login, cloud data, room membership. Cannot be undone.`}
            {confirm.kind === 'disable' && (confirm.user.disabled
              ? `Re-enables sign-in for ${confirm.user.email}.`
              : `Blocks ${confirm.user.email} from signing in. Existing sessions may still work until token refresh.`)}
          </p>
          {confirm.kind === 'delete' && (
            <input className="field-in" placeholder={`Type ${confirm.user.email} to confirm`}
              value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
          )}
          <button onClick={runConfirm} disabled={busy || !deleteArmed}
            className={`w-full py-3 mt-2 text-white text-sm font-semibold rounded-xl disabled:opacity-40 ${confirm.kind === 'disable' && confirm.user.disabled ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {confirm.kind === 'reset' ? 'Reset state' : confirm.kind === 'delete' ? 'Delete forever' : (confirm.user.disabled ? 'Enable' : 'Disable')}
          </button>
        </AppModal>
      )}
    </div>
  )
}
