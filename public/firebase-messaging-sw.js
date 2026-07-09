/* eslint-disable */
// Firebase Cloud Messaging service worker.
// Receives push events when the PWA tab is closed/backgrounded.

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyChyw7KIkkDs2jNpSXW2pauhE37_GGmOw4',
  authDomain: 'bubu-study-timer.firebaseapp.com',
  databaseURL: 'https://bubu-study-timer-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'bubu-study-timer',
  storageBucket: 'bubu-study-timer.firebasestorage.app',
  messagingSenderId: '13147084238',
  appId: '1:13147084238:web:68c48e8345aeaf29d4879f',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {}
  const title = data.title || 'New message'
  const body = data.body || ''
  const url = data.url || '/buddy'
  const tag = data.tag || `bubu-${Date.now()}`
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag,
    data: { url },
    vibrate: [200, 100, 200, 100, 200],
    silent: false,
    requireInteraction: true,
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification?.data?.url || '/buddy'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if open
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
