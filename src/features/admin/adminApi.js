import { httpsCallable } from 'firebase/functions'
import { deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { ref, update } from 'firebase/database'
import { database, firestore, functions } from '../../lib/firebase.js'

const call = (name) => async (payload = {}) => {
  const fn = httpsCallable(functions, name)
  const res = await fn(payload)
  return res.data
}

export const listUsers = () => call('adminListUsers')()
export const resetUser = (uid) => call('adminResetUser')({ uid })
export const deleteUser = (uid) => call('adminDeleteUser')({ uid })
export const closeRoom = (code) => call('adminCloseRoom')({ code })
export const clearChat = (code) => call('adminClearChat')({ code })
export const broadcast = (title, body, url, toUid) =>
  call('adminBroadcast')({ title, body, ...(url ? { url } : {}), ...(toUid ? { toUid } : {}) })
export const kickMember = (code, slot) => call('adminKickMember')({ code, slot })
export const setUserDisabled = (uid, disabled) => call('adminSetUserDisabled')({ uid, disabled })
export const updateUserProfile = (uid, { displayName, email } = {}) =>
  call('adminUpdateUserProfile')({ uid, ...(displayName ? { displayName } : {}), ...(email ? { email } : {}) })
export const createUser = (email, password, displayName) =>
  call('adminCreateUser')({ email, password, ...(displayName ? { displayName } : {}) })

// Rooms: RTDB allows any signed-in user to write `rooms/*`, no callable needed.
export const setRoomSlot = (code, slot, fields) => update(ref(database, `rooms/${code}/${slot}`), fields)

// Notifications: rules allow admin-claim writes directly, no callable needed.
export const updateNotification = (id, patch) => updateDoc(doc(firestore, 'notifications', id), patch)
export const deleteNotification = (id) => deleteDoc(doc(firestore, 'notifications', id))
