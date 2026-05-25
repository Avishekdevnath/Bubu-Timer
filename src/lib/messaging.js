import { getToken, onMessage } from 'firebase/messaging'
import { doc, deleteField, updateDoc } from 'firebase/firestore'
import { firestore, getMessagingIfSupported, VAPID_KEY } from './firebase.js'

/**
 * Register this device for push notifications.
 * Saves FCM token at users/{uid}/fcmTokens/{token} in Firestore.
 */
export async function registerPushToken(uid) {
  if (!uid) return null
  try {
    if (typeof Notification === 'undefined') return null
    if (Notification.permission === 'denied') return null
    if (Notification.permission !== 'granted') {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return null
    }
    const messaging = await getMessagingIfSupported()
    if (!messaging) return null
    // Ensure SW is registered
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg })
    if (!token) return null
    await updateDoc(doc(firestore, 'users', uid), {
      [`fcmTokens.${token}`]: { ts: Date.now(), ua: navigator.userAgent.slice(0, 200) },
    }).catch(() => {})
    return token
  } catch (err) {
    console.warn('[FCM] register failed', err)
    return null
  }
}

/**
 * Remove a stale token from Firestore.
 */
export async function unregisterPushToken(uid, token) {
  if (!uid || !token) return
  await updateDoc(doc(firestore, 'users', uid), {
    [`fcmTokens.${token}`]: deleteField(),
  }).catch(() => {})
}

/**
 * Subscribe to foreground messages (tab open).
 * Returns unsubscribe fn.
 */
export async function subscribeForegroundMessages(handler) {
  const messaging = await getMessagingIfSupported()
  if (!messaging) return () => {}
  return onMessage(messaging, handler)
}
