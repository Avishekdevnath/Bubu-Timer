import { useEffect, useState } from 'react'
import { addDoc, collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { Megaphone, Send } from 'lucide-react'
import { auth, firestore } from '../../lib/firebase.js'
import { broadcast } from './adminApi.js'

export function AdminBroadcastTab({ showToast }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('')
  const [toUid, setToUid] = useState('')
  const [sending, setSending] = useState(false)
  const [annText, setAnnText] = useState('')
  const [annActive, setAnnActive] = useState(false)
  const [annLoaded, setAnnLoaded] = useState(false)

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
    </div>
  )
}
