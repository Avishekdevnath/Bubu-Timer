import { httpsCallable } from 'firebase/functions'
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { ref, update } from 'firebase/database'
import { auth, database, firestore, functions } from '../../lib/firebase.js'

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
export const sendEmail = (subject, body, toUid) =>
  call('adminSendEmail')({ subject, body, ...(toUid ? { toUid } : {}) })

// Rooms: RTDB allows any signed-in user to write `rooms/*`, no callable needed.
export const setRoomSlot = (code, slot, fields) => update(ref(database, `rooms/${code}/${slot}`), fields)

// Notifications: rules allow admin-claim writes directly, no callable needed.
export const updateNotification = (id, patch) => updateDoc(doc(firestore, 'notifications', id), patch)
export const deleteNotification = (id) => deleteDoc(doc(firestore, 'notifications', id))

// Reminders: rules allow admin-claim read+write directly, no callable needed.
export const createReminder = (data) =>
  addDoc(collection(firestore, 'reminders'), {
    ...data,
    createdBy: auth.currentUser?.uid || '',
    createdAt: serverTimestamp(),
    lastFiredDate: null,
  })
export const setReminderActive = (id, active) => updateDoc(doc(firestore, 'reminders', id), { active })
export const updateReminder = (id, patch) => updateDoc(doc(firestore, 'reminders', id), patch)
export const deleteReminder = (id) => deleteDoc(doc(firestore, 'reminders', id))
// Fires push + email for this reminder right now — bypasses the schedule
// entirely and never touches lastFiredDate, so it can't disturb the daily run.
export const sendReminderNow = (id) => call('adminSendReminderNow')({ id })
