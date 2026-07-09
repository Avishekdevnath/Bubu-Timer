import { doc, updateDoc } from 'firebase/firestore'
import { firestore } from '../../lib/firebase.js'

function patch(uid, updates) {
  return updateDoc(doc(firestore, 'users', uid), updates).catch(() => {})
}

export const markRead = (uid, id) => patch(uid, { [`notifState.read.${id}`]: true })

export const markAllRead = (uid, ids) =>
  ids.length ? patch(uid, Object.fromEntries(ids.map((id) => [`notifState.read.${id}`, true]))) : Promise.resolve()

export const remove = (uid, id) => patch(uid, { [`notifState.deleted.${id}`]: true })

export const clearAll = (uid, ids) =>
  ids.length ? patch(uid, Object.fromEntries(ids.map((id) => [`notifState.deleted.${id}`, true]))) : Promise.resolve()
