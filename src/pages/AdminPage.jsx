import { useEffect, useState } from 'react'
import { RefreshCw, ShieldCheck, Trash2, RotateCcw } from 'lucide-react'
import { AppModal } from '../components/AppModal.jsx'
import { listUsers, resetUser, deleteUser } from '../features/admin/adminApi.js'
import { AdminRoomsTab } from '../features/admin/AdminRoomsTab.jsx'
import { AdminBroadcastTab } from '../features/admin/AdminBroadcastTab.jsx'

const TABS = ['users', 'rooms', 'broadcast']

export function AdminPage({ showToast, currentUser }) {
  const [tab, setTab] = useState('users')
  return (
    <div className="w-full px-4 md:px-6 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck size={20} className="text-stone-700" />
        <h2 className="text-2xl font-light tracking-tight text-stone-800">Admin</h2>
      </div>
      <div className="flex gap-2 mb-5">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-colors ${tab === t ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-500 hover:bg-stone-50'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'users' && <UsersTab showToast={showToast} currentUser={currentUser} />}
      {tab === 'rooms' && <AdminRoomsTab showToast={showToast} />}
      {tab === 'broadcast' && <AdminBroadcastTab showToast={showToast} />}
    </div>
  )
}

function UsersTab({ showToast, currentUser }) {
  const [users, setUsers] = useState(null)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(null) // { kind: 'reset'|'delete', user }
  const [confirmText, setConfirmText] = useState('')

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

  async function runConfirm() {
    const { kind, user } = confirm
    setBusy(true)
    try {
      if (kind === 'reset') await resetUser(user.uid)
      else await deleteUser(user.uid)
      showToast(kind === 'reset' ? 'State reset' : 'Account deleted')
      setConfirm(null)
      setConfirmText('')
      await refresh()
    } catch (err) {
      showToast(`Failed: ${err.message}`)
    } finally {
      setBusy(false)
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
        {(users || []).map((u) => (
          <div key={u.uid} className="bg-white border border-stone-100 rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-800 truncate">{u.displayName || '(no name)'} {u.uid === currentUser?.uid && <span className="text-[10px] font-bold text-emerald-600">YOU</span>}</p>
                <p className="text-xs text-stone-400 truncate">{u.email}</p>
                <p className="text-[10px] text-stone-400 mt-1">
                  {u.subjectsCount} subjects · {u.planDays} plan days · {u.tokenCount} devices ·
                  last sign-in {u.lastSignInTime ? new Date(u.lastSignInTime).toLocaleDateString() : '—'}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
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
              </div>
            </div>
          </div>
        ))}
      </div>

      {confirm && (
        <AppModal title={confirm.kind === 'reset' ? 'Reset user state?' : 'Delete account?'} onClose={() => setConfirm(null)}>
          <p className="text-sm text-stone-500 mb-3">
            {confirm.kind === 'reset'
              ? `Wipes all subjects, plans and history for ${confirm.user.email}. Profile and devices survive. Cannot be undone.`
              : `Permanently deletes ${confirm.user.email}: login, cloud data, room membership. Cannot be undone.`}
          </p>
          {confirm.kind === 'delete' && (
            <input className="field-in" placeholder={`Type ${confirm.user.email} to confirm`}
              value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
          )}
          <button onClick={runConfirm} disabled={busy || !deleteArmed}
            className="w-full py-3 mt-2 bg-red-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40">
            {confirm.kind === 'reset' ? 'Reset state' : 'Delete forever'}
          </button>
        </AppModal>
      )}
    </div>
  )
}
