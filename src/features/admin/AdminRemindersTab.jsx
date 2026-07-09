import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { AlarmClock, Pause, Play, Trash2 } from 'lucide-react'
import { firestore } from '../../lib/firebase.js'
import { AppModal } from '../../components/AppModal.jsx'
import { SkeletonRows } from '../../components/Skeleton.jsx'
import { MultiUserPicker } from '../../components/MultiUserPicker.jsx'
import { createReminder, deleteReminder, listUsers, setReminderActive } from './adminApi.js'

function pad2(n) { return String(n).padStart(2, '0') }

function scheduleSummary(r) {
  const time = `${pad2(r.timeHour)}:${pad2(r.timeMinute)}`
  const from = r.startDate ? `from ${r.startDate}` : 'from today'
  const until = r.endDate ? `until ${r.endDate}` : 'forever'
  return `Daily at ${time} · ${from} · ${until}`
}

export function AdminRemindersTab({ showToast }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [users, setUsers] = useState(null)
  const [targetUsers, setTargetUsers] = useState([])
  const [timeValue, setTimeValue] = useState('08:00')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [forever, setForever] = useState(true)
  const [creating, setCreating] = useState(false)
  const [reminders, setReminders] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // reminder id

  useEffect(() => {
    listUsers().then((res) => setUsers(res.users)).catch(() => {})
  }, [])

  useEffect(() => {
    const q = query(collection(firestore, 'reminders'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snap) => setReminders(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {})
  }, [])

  async function create() {
    if (!title.trim() || !body.trim()) { showToast('Title and body required'); return }
    if (!timeValue) { showToast('Time required'); return }
    const [h, m] = timeValue.split(':').map(Number)
    setCreating(true)
    try {
      await createReminder({
        title: title.trim(),
        body: body.trim(),
        toUid: targetUsers.length > 0 ? targetUsers.map((u) => u.uid) : null,
        timeHour: h,
        timeMinute: m,
        startDate: startDate || null,
        endDate: forever ? null : (endDate || null),
        active: true,
      })
      showToast('Reminder created')
      setTitle(''); setBody(''); setTargetUsers([]); setStartDate(''); setEndDate(''); setForever(true)
    } catch (err) {
      showToast(`Create failed: ${err.message}`)
    } finally {
      setCreating(false)
    }
  }

  async function toggleActive(r) {
    try {
      await setReminderActive(r.id, !r.active)
      showToast(r.active ? 'Reminder paused' : 'Reminder resumed')
    } catch (err) {
      showToast(`Failed: ${err.message}`)
    }
  }

  async function runDelete() {
    try {
      await deleteReminder(deleteConfirm)
      showToast('Reminder deleted')
      setDeleteConfirm(null)
    } catch (err) {
      showToast(`Delete failed: ${err.message}`)
    }
  }

  return (
    <div className="space-y-4">
      <section>
        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">Create reminder</p>
        <div className="bg-white border border-stone-100 rounded-2xl shadow-sm p-4 space-y-2">
          <input className="field-in" placeholder="Title (e.g. Take your medicine)" maxLength={100}
            value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="field-in resize-y" rows={8} placeholder="Message (max 20,000 characters)" maxLength={20000}
            value={body} onChange={(e) => setBody(e.target.value)} />
          <p className="text-xs text-right text-stone-300 px-1 -mt-1">{body.length.toLocaleString()} / 20,000</p>
          <MultiUserPicker users={users} value={targetUsers} onChange={setTargetUsers} />
          <input type="time" className="field-in w-auto" value={timeValue} onChange={(e) => setTimeValue(e.target.value)}
            aria-label="Time (any hour and minute, repeats daily)" />
          <div className="flex gap-2">
            <label className="flex-1">
              <span className="block text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1 px-1">Starts</span>
              <input type="date" className="field-in w-full" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                aria-label="Start date (optional, blank = starts today)" placeholder="Today" />
            </label>
            <label className="flex-1">
              <span className="block text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1 px-1">Ends</span>
              <input type="date" className="field-in w-full disabled:opacity-40" value={endDate} disabled={forever}
                onChange={(e) => setEndDate(e.target.value)} aria-label="End date" />
            </label>
          </div>
          <label className="flex items-center gap-2 px-1 text-sm text-stone-600">
            <input type="checkbox" checked={forever} onChange={(e) => setForever(e.target.checked)} />
            Repeat forever (until stopped manually)
          </label>
          <p className="text-xs text-stone-400 px-1">Repeats every day at this time. Fires within 15 minutes of it — exact minute isn't guaranteed. Blank start = begins today.</p>
          <p className="text-xs text-stone-400 px-1 leading-relaxed">
            Push shows a short preview; the email gets the full message. Emoji work anywhere. Formatting:{' '}
            <code># heading</code>, <code>**bold**</code>, <code>*italic*</code>, <code>~~strikethrough~~</code>,{' '}
            <code>`code`</code>, <code>[link](https://url)</code>, <code>&gt; quote</code>, <code>---</code> divider,{' '}
            <code>- </code> bullet list, <code>1. </code> numbered list.
          </p>
          <button onClick={create} disabled={creating}
            className="w-full py-3 bg-stone-900 text-white text-sm font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
            <AlarmClock size={14} /> {creating ? 'Creating…' : 'Create reminder'}
          </button>
        </div>
      </section>

      <section>
        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">Reminders</p>
        {reminders === null && <SkeletonRows count={3} />}
        {reminders?.length === 0 && <p className="text-xs text-stone-400 px-1">No reminders yet</p>}
        <div className="space-y-2">
          {(reminders || []).map((r) => {
            const targetUids = Array.isArray(r.toUid) ? r.toUid : (r.toUid ? [r.toUid] : [])
            const targetLabel = targetUids.length === 0
              ? 'everyone'
              : targetUids.map((uid) => users?.find((u) => u.uid === uid)?.displayName || uid).join(', ')
            return (
              <div key={r.id} className="bg-white border border-stone-100 rounded-2xl shadow-sm p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-800 truncate flex items-center gap-1.5">
                      {r.title}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${r.active ? 'text-emerald-600 bg-emerald-50' : 'text-stone-400 bg-stone-100'}`}>
                        {r.active ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </p>
                    <p className="text-xs text-stone-400 truncate">
                      {scheduleSummary(r)} · {targetLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleActive(r)}
                      className="p-2 rounded-full border border-stone-200 text-stone-500 hover:bg-stone-50"
                      title={r.active ? 'Pause' : 'Resume'} aria-label={r.active ? `Pause ${r.title}` : `Resume ${r.title}`}>
                      {r.active ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button onClick={() => setDeleteConfirm(r.id)}
                      className="p-2 rounded-full border border-red-200 text-red-500 hover:bg-red-50"
                      title="Delete" aria-label={`Delete ${r.title}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {deleteConfirm && (
        <AppModal title="Delete reminder?" onClose={() => setDeleteConfirm(null)}>
          <p className="text-sm text-stone-500 mb-3">Stops this reminder from ever firing again. Cannot be undone.</p>
          <button onClick={runDelete} className="w-full py-3 bg-red-600 text-white text-sm font-semibold rounded-xl">
            Delete
          </button>
        </AppModal>
      )}
    </div>
  )
}
