import { useEffect, useMemo, useState } from 'react'
import { collection, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { firestore } from '../../lib/firebase.js'
import { unreadCount, visibleNotifs } from './notifModel.js'
import * as api from './notifApi.js'

const EMPTY_STATE = { read: {}, deleted: {} }

export function useNotifications(currentUser) {
  const uid = currentUser && !currentUser.isGuest ? currentUser.uid : null
  const [notifs, setNotifs] = useState([])
  const [notifState, setNotifState] = useState(EMPTY_STATE)

  useEffect(() => {
    if (!uid) {
      setNotifs([])
      setNotifState(EMPTY_STATE)
      return
    }
    const q = query(collection(firestore, 'notifications'), orderBy('createdAt', 'desc'), limit(50))
    const unsubNotifs = onSnapshot(q,
      (snap) => setNotifs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => {}) // silent — inbox is best-effort
    const unsubState = onSnapshot(doc(firestore, 'users', uid),
      (snap) => setNotifState(snap.data()?.notifState || EMPTY_STATE),
      () => {})
    return () => { unsubNotifs(); unsubState() }
  }, [uid])

  const visible = useMemo(() => visibleNotifs(notifs, notifState, uid), [notifs, notifState, uid])
  const unread = useMemo(() => unreadCount(notifs, notifState, uid), [notifs, notifState, uid])

  return {
    notifs,
    visible,
    unread,
    notifState,
    markRead: (id) => uid && api.markRead(uid, id),
    markAllRead: () => uid && api.markAllRead(uid, visible.map((n) => n.id)),
    remove: (id) => uid && api.remove(uid, id),
    clearAll: () => uid && api.clearAll(uid, visible.map((n) => n.id)),
  }
}
