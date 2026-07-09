import { useEffect, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { onValue, ref } from 'firebase/database'
import { AlertTriangle, ChevronRight, MessageSquare, Radio, Smartphone, Users } from 'lucide-react'
import { database, firestore } from '../../lib/firebase.js'
import { listUsers } from './adminApi.js'
import { messagesToday, staleRoomCount } from './roomStats.js'
import { Skeleton, SkeletonRows } from '../../components/Skeleton.jsx'

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border border-stone-100 rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-2 text-stone-400 mb-1">
        <Icon size={14} />
        <p className="text-[10px] font-bold tracking-widest uppercase">{label}</p>
      </div>
      {value === null ? <Skeleton className="h-7 w-10" /> : <p className="text-2xl font-light text-stone-800">{value}</p>}
    </div>
  )
}

export function AdminDashboardTab({ showToast, onOpenLogs }) {
  const [userCount, setUserCount] = useState(null)
  const [deviceCount, setDeviceCount] = useState(null)
  const [disabledCount, setDisabledCount] = useState(null)
  const [rooms, setRooms] = useState(null)
  const [recentLogs, setRecentLogs] = useState(null)

  useEffect(() => {
    listUsers().then((res) => {
      setUserCount(res.users.length)
      setDeviceCount(res.users.reduce((sum, u) => sum + u.tokenCount, 0))
      setDisabledCount(res.users.filter((u) => u.disabled).length)
    }).catch((err) => showToast(`Load failed: ${err.message}`))
  }, [showToast])

  useEffect(() => {
    return onValue(ref(database, 'rooms'), (snap) => setRooms(snap.val() || {}), () => {})
  }, [])

  useEffect(() => {
    const q = query(collection(firestore, 'adminLogs'), orderBy('at', 'desc'), limit(5))
    return onSnapshot(q, (snap) => setRecentLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {})
  }, [])

  const roomCount = rooms ? Object.keys(rooms).length : null
  const msgsToday = rooms ? messagesToday(rooms, Date.now()) : null
  const staleCount = rooms ? staleRoomCount(rooms, Date.now(), 30) : null

  const callouts = []
  if (disabledCount > 0) callouts.push(`${disabledCount} user${disabledCount > 1 ? 's' : ''} disabled`)
  if (staleCount > 0) callouts.push(`${staleCount} room${staleCount > 1 ? 's' : ''} inactive 30+ days`)

  return (
    <div className="space-y-4">
      {callouts.length > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-amber-800 text-xs">
          <AlertTriangle size={14} className="shrink-0" />
          {callouts.join(' · ')}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Users" value={userCount} />
        <StatCard icon={Radio} label="Active rooms" value={roomCount} />
        <StatCard icon={MessageSquare} label="Messages today" value={msgsToday} />
        <StatCard icon={Smartphone} label="Devices" value={deviceCount} />
      </div>
      <section>
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">Recent activity</p>
          <button onClick={onOpenLogs} className="flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-800">
            View all <ChevronRight size={12} />
          </button>
        </div>
        {recentLogs === null ? (
          <SkeletonRows count={3} height="h-11" />
        ) : (
          <div className="bg-white border border-stone-100 rounded-2xl shadow-sm divide-y divide-stone-100">
            {recentLogs.length === 0 && <p className="text-sm text-stone-400 p-4">No activity yet</p>}
            {recentLogs.map((log) => (
              <div key={log.id} className="p-3 flex items-center justify-between gap-3">
                <p className="text-sm text-stone-700">{log.action} <span className="text-stone-400">→ {log.target || '—'}</span></p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
