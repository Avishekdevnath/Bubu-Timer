import { getToken, onMessage } from 'firebase/messaging'
import { doc, deleteField, updateDoc } from 'firebase/firestore'
import { firestore, getMessagingIfSupported, VAPID_KEY } from './firebase.js'

const isNative = () => !!(window.Capacitor?.isNativePlatform?.())

/**
 * Save an FCM token to Firestore for a user.
 * Called from native listener (registration event) and web getToken flow.
 */
export async function savePushToken(uid, token) {
  if (!uid || !token) return
  await updateDoc(doc(firestore, 'users', uid), {
    [`fcmTokens.${token}`]: { ts: Date.now(), ua: navigator.userAgent.slice(0, 200) },
  }).catch(() => {})
}

/**
 * Register this device for push notifications.
 * Native (Capacitor): requests permission + calls PushNotifications.register().
 *   Token is delivered via 'registration' listener — wire that up in App.jsx.
 * Web PWA: full flow via Firebase Messaging SDK + service worker.
 */
export async function registerPushToken(uid) {
  if (!uid) return null
  try {
    if (isNative()) {
      const { PushNotifications } = await import('@capacitor/push-notifications')
      let status = await PushNotifications.checkPermissions()
      if (status.receive === 'prompt') {
        status = await PushNotifications.requestPermissions()
      }
      if (status.receive !== 'granted') return null
      await PushNotifications.register()
      return 'native-registered' // token comes via registration event in App.jsx
    }

    // Web PWA path
    if (typeof Notification === 'undefined') return null
    if (Notification.permission === 'denied') return null
    if (Notification.permission !== 'granted') {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return null
    }
    const messaging = await getMessagingIfSupported()
    if (!messaging) return null
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg })
    if (!token) return null
    await savePushToken(uid, token)
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
 * Subscribe to foreground FCM messages (web only — native uses Capacitor listener).
 * Returns unsubscribe fn.
 */
export async function subscribeForegroundMessages(handler) {
  if (isNative()) return () => {} // handled by addListener('pushNotificationReceived') in App.jsx
  const messaging = await getMessagingIfSupported()
  if (!messaging) return () => {}
  return onMessage(messaging, handler)
}

/**
 * Schedule a local notification for when a study timer expires.
 * Native only — no-op in browser.
 */
export async function scheduleTimerDoneNotification(itemName, remainingSec) {
  if (!isNative() || remainingSec <= 0) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    // Cancel any previous timer notification first
    await LocalNotifications.cancel({ notifications: [{ id: 9001 }] }).catch(() => {})
    await LocalNotifications.schedule({
      notifications: [{
        id: 9001,
        title: '⏰ Time\'s up!',
        body: `${itemName} session complete`,
        schedule: { at: new Date(Date.now() + remainingSec * 1000), allowWhileIdle: true },
        sound: null,
        smallIcon: 'ic_launcher_foreground',
        ongoing: false,
      }],
    })
  } catch (err) {
    console.warn('[LocalNotif] schedule failed', err)
  }
}

/**
 * Cancel the pending timer notification (when paused or marked done).
 * Native only — no-op in browser.
 */
export async function cancelTimerNotification() {
  if (!isNative()) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: [{ id: 9001 }] })
  } catch { /* ignore */ }
}

/**
 * Show a local notification for a new chat message (native, app backgrounded).
 */
export async function showChatNotification(senderName, text) {
  if (!isNative()) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Date.now() / 1000) % 2147483647,
        title: senderName || 'Study partner',
        body: (text || 'New message').slice(0, 120),
        schedule: { at: new Date(Date.now() + 300) },
        smallIcon: 'ic_launcher_foreground',
        extra: { url: '/buddy' },
      }],
    })
  } catch (err) {
    console.warn('[LocalNotif] chat notif failed', err)
  }
}
