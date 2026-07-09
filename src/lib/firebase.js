import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getMessaging, isSupported } from 'firebase/messaging'
import { getFunctions } from 'firebase/functions'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyChyw7KIkkDs2jNpSXW2pauhE37_GGmOw4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'bubu-study-timer.firebaseapp.com',
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ||
    'https://bubu-study-timer-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'bubu-study-timer',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'bubu-study-timer.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '13147084238',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:13147084238:web:68c48e8345aeaf29d4879f',
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const database = getDatabase(firebaseApp)
export const firestore = initializeFirestore(firebaseApp, { localCache: persistentLocalCache() })
export const storage = getStorage(firebaseApp)
export const functions = getFunctions(firebaseApp, 'asia-southeast1')

export const VAPID_KEY = 'BDjYgKlK6Kah2Q7eWfQXHvZTlt_at0429Z6iL6vukvtE2gJUVYqbwnCMPH5nfxozsoAxYu0Yrll0t9XspgcAIMc'

export async function getMessagingIfSupported() {
  if (!(await isSupported())) return null
  return getMessaging(firebaseApp)
}
