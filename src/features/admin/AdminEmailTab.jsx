import { useEffect, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { ChevronDown, ChevronUp, Mail } from 'lucide-react'
import { firestore } from '../../lib/firebase.js'
import { UserPicker } from '../../components/UserPicker.jsx'
import { listUsers, sendEmail } from './adminApi.js'

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

export function AdminEmailTab({ showToast }) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [users, setUsers] = useState(null)
  const [targetUser, setTargetUser] = useState(null)
  const [sending, setSending] = useState(false)
  const [emails, setEmails] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    listUsers().then((res) => setUsers(res.users)).catch(() => {})
  }, [])

  useEffect(() => {
    const q = query(collection(firestore, 'emails'), orderBy('createdAt', 'desc'), limit(20))
    return onSnapshot(q, (snap) => setEmails(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {})
  }, [])

  async function send() {
    if (!subject.trim() || !body.trim()) { showToast('Subject and body required'); return }
    setSending(true)
    try {
      const res = await sendEmail(subject.trim(), body.trim(), targetUser?.uid)
      showToast(`Sent to ${res.sent}/${res.total} recipients${res.failed ? ` (${res.failed} failed)` : ''}`)
      setSubject(''); setBody(''); setTargetUser(null)
    } catch (err) {
      showToast(`Email failed: ${err.message}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <section>
        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">Compose email</p>
        <div className="bg-white border border-stone-100 rounded-2xl shadow-sm p-4 space-y-2">
          <input className="field-in" placeholder="Subject (max 200)" maxLength={200}
            value={subject} onChange={(e) => setSubject(e.target.value)} />
          <textarea className="field-in resize-y" rows={16} placeholder="Message (max 20,000 characters)" maxLength={20000}
            value={body} onChange={(e) => setBody(e.target.value)} />
          <p className="text-xs text-right text-stone-300 px-1 -mt-1">{body.length.toLocaleString()} / 20,000</p>
          <p className="text-xs text-stone-400 px-1 leading-relaxed">
            Emoji work anywhere. Formatting: <code># heading</code>, <code>**bold**</code>, <code>*italic*</code>,{' '}
            <code>~~strikethrough~~</code>, <code>`code`</code>, <code>[link](https://url)</code>, <code>&gt; quote</code>,{' '}
            <code>---</code> divider, <code>- </code> bullet list, <code>1. </code> numbered list.
          </p>
          <UserPicker users={users} value={targetUser} onChange={setTargetUser} />
          <button onClick={send} disabled={sending}
            className="w-full py-3 bg-stone-900 text-white text-sm font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
            <Mail size={14} /> {sending ? 'Sending…' : 'Send email'}
          </button>
        </div>
      </section>

      <section>
        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">Sent emails</p>
        <div className="space-y-2">
          {emails === null && <p className="text-xs text-stone-400 px-1">Loading…</p>}
          {emails?.length === 0 && <p className="text-xs text-stone-400 px-1">No emails sent yet</p>}
          {(emails || []).map((e) => {
            const expanded = expandedId === e.id
            const target = e.toUid ? users?.find((u) => u.uid === e.toUid) : null
            return (
              <div key={e.id} className="bg-white border border-stone-100 rounded-2xl shadow-sm p-4">
                <button onClick={() => setExpandedId(expanded ? null : e.id)} className="w-full flex items-center justify-between gap-3 text-left">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-800 truncate">{e.subject}</p>
                    <p className="text-xs text-stone-400 truncate">
                      {relTime(e.createdAt)} · {e.sent}/{e.sent + e.failed} sent
                      {e.toUid ? ` · to ${target?.displayName || target?.email || e.toUid}` : ' · to everyone'}
                    </p>
                  </div>
                  {expanded ? <ChevronUp size={14} className="text-stone-300 shrink-0" /> : <ChevronDown size={14} className="text-stone-300 shrink-0" />}
                </button>
                {expanded && (
                  <div className="mt-3 pt-3 border-t border-stone-100 space-y-2">
                    <p className="text-sm text-stone-600 whitespace-pre-wrap">{e.body}</p>
                    {e.error && (
                      <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{e.error}</p>
                    )}
                    {e.recipients?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1">Recipients</p>
                        {e.recipients.map((r) => (
                          <p key={r.uid} className="text-xs text-stone-500">
                            {r.email} — <span className={r.status === 'sent' ? 'text-emerald-600' : 'text-red-500'}>{r.status}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
