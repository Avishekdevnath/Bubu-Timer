import { useEffect, useState } from 'react'
import { addDoc, collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore'
import { ChevronDown, ChevronUp, Megaphone, Send, Trash2 } from 'lucide-react'
import { auth, firestore } from '../../lib/firebase.js'
import { AppModal } from '../../components/AppModal.jsx'
import { broadcast, deleteNotification, updateNotification } from './adminApi.js'

function relTime(ts) {
  const ms = ts?.toMillis ? ts.toMillis() : ts || 0
  if (!ms) return ''
  const diff = Date.now() - ms
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'now'
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h ago`
  return new Date(ms).toLocaleDateString()
}

export function AdminBroadcastTab({ showToast }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('')
  const [toUid, setToUid] = useState('')
  const [sending, setSending] = useState(false)
  const [annText, setAnnText] = useState('')
  const [annActive, setAnnActive] = useState(false)
  const [annLoaded, setAnnLoaded] = useState(false)
  const [notifs, setNotifs] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // notif id

  useEffect(() => {
    return onSnapshot(doc(firestore, 'config', 'announcement'), (snap) => {
      const d = snap.data()
      if (!annLoaded) {
        setAnnText(d?.text || '')
        setAnnActive(!!d?.active)
        setAnnLoaded(true)
      }
    })
  }, [annLoaded])

  useEffect(() => {
    const q = query(collection(firestore, 'notifications'), orderBy('createdAt', 'desc'), limit(20))
    return onSnapshot(q, (snap) => setNotifs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {})
  }, [])

  async function send() {
    if (!title.trim() || !body.trim()) { showToast('Title and body required'); return }
    if (url.trim() && !url.trim().startsWith('/')) { showToast('Link must start with /'); return }
    setSending(true)
    try {
      const res = await broadcast(title.trim(), body.trim(), url.trim() || undefined, toUid.trim() || undefined)
      showToast(`Sent to ${res.sent}/${res.tokens} devices${res.failed ? ` (${res.failed} failed)` : ''}`)
      setTitle(''); setBody(''); setUrl(''); setToUid('')
    } catch (err) {
      showToast(`Broadcast failed: ${err.message}`)
    } finally {
      setSending(false)
    }
  }

  async function saveAnnouncement(nextActive) {
    try {
      let notifId = null
      if (nextActive) {
        const notifRef = await addDoc(collection(firestore, 'notifications'), {
          type: 'announcement',
          title: 'Announcement',
          body: annText.trim(),
          url: '/home',
          toUid: null,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser?.uid || '',
          push: null,
        })
        notifId = notifRef.id
      }
      await setDoc(doc(firestore, 'config', 'announcement'), {
        text: annText.trim(),
        active: nextActive,
        updatedAt: Date.now(),
        ...(notifId ? { notifId } : {}),
      }, { merge: true })
      setAnnActive(nextActive)
      showToast(nextActive ? 'Announcement live' : 'Announcement off')
    } catch (err) {
      showToast(`Save failed: ${err.message}`)
    }
  }

  function toggleExpand(n) {
    const willExpand = expandedId !== n.id
    setExpandedId(willExpand ? n.id : null)
    if (willExpand) {
      setEditTitle(n.title || '')
      setEditBody(n.body || '')
    }
  }

  async function saveNotif(id) {
    setSavingId(id)
    try {
      await updateNotification(id, { title: editTitle.trim(), body: editBody.trim() })
      showToast('Notification updated')
    } catch (err) {
      showToast(`Update failed: ${err.message}`)
    } finally {
      setSavingId(null)
    }
  }

  async function runDelete() {
    try {
      await deleteNotification(deleteConfirm)
      showToast('Notification deleted')
      setDeleteConfirm(null)
      if (expandedId === deleteConfirm) setExpandedId(null)
    } catch (err) {
      showToast(`Delete failed: ${err.message}`)
    }
  }

  return (
    <div className="space-y-4">
      <section>
        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">Push to all devices</p>
        <div className="bg-white border border-stone-100 rounded-2xl shadow-sm p-4 space-y-2">
          <input className="field-in" placeholder="Title (max 100)" maxLength={100}
            value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="field-in resize-none" rows={3} placeholder="Message (max 500)" maxLength={500}
            value={body} onChange={(e) => setBody(e.target.value)} />
          <input className="field-in" placeholder="Link route (default /home)"
            value={url} onChange={(e) => setUrl(e.target.value)} />
          <input className="field-in" placeholder="Target uid (blank = everyone)"
            value={toUid} onChange={(e) => setToUid(e.target.value)} />
          <button onClick={send} disabled={sending}
            className="w-full py-3 bg-stone-900 text-white text-sm font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
            <Send size={14} /> {sending ? 'Sending…' : 'Send broadcast'}
          </button>
        </div>
      </section>

      <section>
        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">Announcement banner</p>
        <div className="bg-white border border-stone-100 rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2 text-stone-500 text-xs"><Megaphone size={13} /> Shows at top of app for everyone while active.</div>
          <textarea className="field-in resize-none" rows={2} placeholder="Announcement text"
            value={annText} onChange={(e) => setAnnText(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={() => saveAnnouncement(true)} disabled={!annText.trim()}
              className="flex-1 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl disabled:opacity-40">
              Publish
            </button>
            <button onClick={() => saveAnnouncement(false)} disabled={!annActive}
              className="flex-1 py-2.5 border border-stone-200 text-stone-600 text-sm font-semibold rounded-xl disabled:opacity-40">
              Turn off
            </button>
          </div>
        </div>
      </section>

      <section>
        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">Sent notifications</p>
        <div className="space-y-2">
          {notifs === null && <p className="text-xs text-stone-400 px-1">Loading…</p>}
          {notifs?.length === 0 && <p className="text-xs text-stone-400 px-1">No notifications sent yet</p>}
          {(notifs || []).map((n) => {
            const expanded = expandedId === n.id
            return (
              <div key={n.id} className="bg-white border border-stone-100 rounded-2xl shadow-sm p-4">
                <div className="flex items-center justify-between gap-3">
                  <button onClick={() => toggleExpand(n)} className="min-w-0 text-left flex-1">
                    <p className="text-sm font-semibold text-stone-800 truncate">{n.title}</p>
                    <p className="text-xs text-stone-400 truncate">{n.type} · {relTime(n.createdAt)}{n.toUid ? ` · to ${n.toUid}` : ''}</p>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setDeleteConfirm(n.id)}
                      className="p-2 rounded-full border border-red-200 text-red-500 hover:bg-red-50" title="Delete" aria-label={`Delete notification: ${n.title}`}>
                      <Trash2 size={14} />
                    </button>
                    {expanded ? <ChevronUp size={14} className="text-stone-300" /> : <ChevronDown size={14} className="text-stone-300" />}
                  </div>
                </div>
                {expanded && (
                  <div className="mt-3 pt-3 border-t border-stone-100 space-y-2">
                    <input className="field-in" placeholder="Title" maxLength={100}
                      value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                    <textarea className="field-in resize-none" rows={2} placeholder="Body" maxLength={500}
                      value={editBody} onChange={(e) => setEditBody(e.target.value)} />
                    <button onClick={() => saveNotif(n.id)} disabled={savingId === n.id}
                      className="w-full py-2.5 bg-white border border-stone-200 text-stone-700 text-sm font-semibold rounded-xl disabled:opacity-40 hover:bg-stone-50">
                      {savingId === n.id ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {deleteConfirm && (
        <AppModal title="Delete notification?" onClose={() => setDeleteConfirm(null)}>
          <p className="text-sm text-stone-500 mb-3">
            Removes it from every user&apos;s inbox. Already-delivered push notifications on devices are unaffected. Cannot be undone.
          </p>
          <button onClick={runDelete}
            className="w-full py-3 bg-red-600 text-white text-sm font-semibold rounded-xl">
            Delete
          </button>
        </AppModal>
      )}
    </div>
  )
}
