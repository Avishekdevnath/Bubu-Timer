import { useEffect, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { ChevronDown, ChevronUp, Mail, Plus, RotateCcw } from 'lucide-react'
import { firestore } from '../../lib/firebase.js'
import { AppModal } from '../../components/AppModal.jsx'
import { UserPicker } from '../../components/UserPicker.jsx'
import { FormattedTextarea } from './FormattedTextarea.jsx'
import { listUsers, retryFailedEmail, sendEmail } from './adminApi.js'

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
  const [composeOpen, setComposeOpen] = useState(false)
  const [retryingId, setRetryingId] = useState(null)

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
      setSubject(''); setBody(''); setTargetUser(null); setComposeOpen(false)
    } catch (err) {
      showToast(`Email failed: ${err.message}`)
    } finally {
      setSending(false)
    }
  }

  async function retry(id) {
    setRetryingId(id)
    try {
      const res = await retryFailedEmail(id)
      showToast(`Retried ${res.retried}: ${res.sent} sent${res.failed ? `, ${res.failed} still failed` : ''}`)
    } catch (err) {
      showToast(`Retry failed: ${err.message}`)
    } finally {
      setRetryingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <section>
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">Sent emails</p>
          <button onClick={() => setComposeOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-stone-900 px-3 py-1.5 rounded-full hover:bg-stone-800">
            <Plus size={12} /> Compose email
          </button>
        </div>
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
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">Recipients</p>
                          {e.failed > 0 && (
                            <button onClick={() => retry(e.id)} disabled={retryingId === e.id}
                              className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-40">
                              <RotateCcw size={11} className={retryingId === e.id ? 'animate-spin' : ''} />
                              {retryingId === e.id ? 'Retrying…' : `Retry failed (${e.failed})`}
                            </button>
                          )}
                        </div>
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

      {composeOpen && (
        <AppModal title="Compose email" onClose={() => setComposeOpen(false)} wide>
          <div className="space-y-2">
            <input className="field-in" placeholder="Subject (max 200)" maxLength={200}
              value={subject} onChange={(e) => setSubject(e.target.value)} />
            <FormattedTextarea rows={16} placeholder="Message (max 20,000 characters)" maxLength={20000}
              value={body} onChange={setBody} />
            <p className="text-xs text-right text-stone-300 -mt-1">{body.length.toLocaleString()} / 20,000</p>
            <p className="text-xs text-stone-400 leading-relaxed">
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
        </AppModal>
      )}
    </div>
  )
}
