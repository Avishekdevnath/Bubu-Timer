const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { getAuth } = require('firebase-admin/auth')
const { getDatabase } = require('firebase-admin/database')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')
const logger = require('firebase-functions/logger')
const { requireString, validateBroadcast } = require('./adminValidation.js')

const REGION = 'asia-southeast1'

// Mirror of react-app/src/state/defaultState.js createDefaultState() — keep in sync.
const DEFAULT_STATE = {
  version: 2,
  subjects: [],
  subjectProgress: {},
  chapterProgress: {},
  logs: [],
  dayCutoff: 23 * 60 + 59,
  dailyPlan: null,
  planHistory: [],
  futurePlans: {},
}

function assertAdmin(request) {
  if (request.auth?.token?.admin !== true) {
    throw new HttpsError('permission-denied', 'Admin only')
  }
}

async function auditLog(request, action, target, params = {}) {
  await getFirestore().collection('adminLogs').add({
    action,
    target,
    params,
    by: request.auth.uid,
    at: FieldValue.serverTimestamp(),
  })
}

function adminCall(action, handler) {
  return onCall({ region: REGION }, async (request) => {
    assertAdmin(request)
    try {
      const result = await handler(request)
      await auditLog(request, action, result.target ?? '', result.params ?? {})
      return result.data ?? { ok: true }
    } catch (err) {
      if (err instanceof HttpsError) throw err
      logger.error(`${action} failed`, err)
      throw new HttpsError('invalid-argument', err.message)
    }
  })
}

exports.adminListUsers = adminCall('listUsers', async () => {
  const [authUsers, docsSnap] = await Promise.all([
    getAuth().listUsers(1000),
    getFirestore().collection('users').get(),
  ])
  const docs = new Map(docsSnap.docs.map((d) => [d.id, d.data()]))
  const users = authUsers.users.map((u) => {
    const doc = docs.get(u.uid)
    return {
      uid: u.uid,
      email: u.email || '',
      displayName: u.displayName || doc?.username || '',
      lastSignInTime: u.metadata.lastSignInTime || '',
      disabled: u.disabled,
      hasDoc: !!doc,
      stateUpdatedAtMs: doc?.stateUpdatedAtMs || 0,
      tokenCount: Object.keys(doc?.fcmTokens || {}).length,
      subjectsCount: doc?.state?.subjects?.length || 0,
      planDays: doc?.state?.planHistory?.length || 0,
    }
  })
  return { data: { users }, target: 'all', params: { count: users.length } }
})

exports.adminResetUser = adminCall('resetUser', async (request) => {
  const uid = requireString(request.data?.uid, 'uid', 200)
  const ref = getFirestore().doc(`users/${uid}`)
  const snap = await ref.get()
  if (!snap.exists) throw new HttpsError('not-found', 'No such user doc')
  await ref.set(
    { state: DEFAULT_STATE, stateUpdatedAt: FieldValue.serverTimestamp(), stateUpdatedAtMs: Date.now() },
    { merge: true }, // keeps profile fields + fcmTokens
  )
  return { target: uid }
})

exports.adminDeleteUser = adminCall('deleteUser', async (request) => {
  const uid = requireString(request.data?.uid, 'uid', 200)
  if (uid === request.auth.uid) throw new HttpsError('invalid-argument', 'Cannot delete yourself')
  // Remove room slots pointing at this uid
  const roomsSnap = await getDatabase().ref('/rooms').once('value')
  const rooms = roomsSnap.val() || {}
  const removals = []
  for (const [code, room] of Object.entries(rooms)) {
    for (const slot of ['A', 'B']) {
      if (room?.[slot]?.uid === uid) {
        removals.push(getDatabase().ref(`/rooms/${code}/${slot}`).remove())
      }
    }
  }
  await Promise.all(removals)
  await getFirestore().doc(`users/${uid}`).delete()
  await getAuth().deleteUser(uid).catch((err) => {
    if (err.code !== 'auth/user-not-found') throw err
  })
  return { target: uid, params: { roomSlotsCleared: removals.length } }
})

exports.adminCloseRoom = adminCall('closeRoom', async (request) => {
  const code = requireString(request.data?.code, 'code', 50)
  const ref = getDatabase().ref(`/rooms/${code}`)
  const snap = await ref.once('value')
  if (!snap.exists()) throw new HttpsError('not-found', 'No such room')
  await ref.remove()
  return { target: code }
})

exports.adminClearChat = adminCall('clearChat', async (request) => {
  const code = requireString(request.data?.code, 'code', 50)
  await getDatabase().ref(`/rooms/${code}/chat`).remove()
  return { target: code }
})

exports.adminBroadcast = adminCall('broadcast', async (request) => {
  const { title, body } = validateBroadcast(request.data)
  const docsSnap = await getFirestore().collection('users').get()
  const tokens = []
  for (const doc of docsSnap.docs) {
    tokens.push(...Object.keys(doc.data()?.fcmTokens || {}))
  }
  if (!tokens.length) return { data: { sent: 0, failed: 0, tokens: 0 }, target: 'all', params: { title } }

  let sent = 0
  let failed = 0
  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500)
    const res = await getMessaging().sendEachForMulticast({
      tokens: batch,
      data: { title, body, url: '/home' },
      webpush: {
        notification: { title, body, icon: '/icon-192.png', badge: '/icon-192.png', tag: 'bubu-admin' },
        fcm_options: { link: '/home' },
      },
    })
    sent += res.successCount
    failed += res.failureCount
  }
  return { data: { sent, failed, tokens: tokens.length }, target: 'all', params: { title, sent, failed } }
})
