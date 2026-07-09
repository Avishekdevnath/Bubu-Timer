import { httpsCallable } from 'firebase/functions'
import { functions } from '../../lib/firebase.js'

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
