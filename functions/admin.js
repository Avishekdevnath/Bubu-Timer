const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { getAuth } = require('firebase-admin/auth')
const { getDatabase } = require('firebase-admin/database')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')
const logger = require('firebase-functions/logger')
const { requireString, requireSlot, validateBroadcast } = require('./adminValidation.js')

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
      fcmTokens: doc?.fcmTokens || {},
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

exports.adminSetUserDisabled = adminCall('setUserDisabled', async (request) => {
  const uid = requireString(request.data?.uid, 'uid', 200)
  const disabled = !!request.data?.disabled
  if (uid === request.auth.uid) throw new HttpsError('invalid-argument', 'Cannot disable yourself')
  await getAuth().updateUser(uid, { disabled })
  return { target: uid, params: { disabled } }
})

exports.adminCloseRoom = adminCall('closeRoom', async (request) => {
  const code = requireString(request.data?.code, 'code', 50)
  const ref = getDatabase().ref(`/rooms/${code}`)
  const snap = await ref.once('value')
  if (!snap.exists()) throw new HttpsError('not-found', 'No such room')
  await ref.remove()
  return { target: code }
})

exports.adminKickMember = adminCall('kickMember', async (request) => {
  const code = requireString(request.data?.code, 'code', 50)
  const slot = requireSlot(request.data?.slot)
  await getDatabase().ref(`/rooms/${code}/${slot}`).remove()
  return { target: code, params: { slot } }
})

exports.adminClearChat = adminCall('clearChat', async (request) => {
  const code = requireString(request.data?.code, 'code', 50)
  await getDatabase().ref(`/rooms/${code}/chat`).remove()
  return { target: code }
})

exports.adminBroadcast = adminCall('broadcast', async (request) => {
  const { title, body, url, toUid } = validateBroadcast(request.data)
  const fs = getFirestore()

  // Persist first — record survives even if FCM fails
  const notifRef = await fs.collection('notifications').add({
    type: 'broadcast',
    title,
    body,
    url,
    toUid,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: request.auth.uid,
    push: null,
  })
  const tag = `bubu-bcast-${notifRef.id}`

  const docsSnap = toUid
    ? [await fs.collection('users').doc(toUid).get()]
    : (await fs.collection('users').get()).docs
  const tokenOwners = new Map() // token -> uid, for stale-token pruning
  for (const doc of docsSnap) {
    if (!doc.exists) continue
    for (const t of Object.keys(doc.data()?.fcmTokens || {})) tokenOwners.set(t, doc.id)
  }
  const tokens = [...tokenOwners.keys()]

  let sent = 0
  let failed = 0
  const stale = []
  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500)
    const res = await getMessaging().sendEachForMulticast({
      tokens: batch,
      data: { title, body, url, notifId: notifRef.id, tag },
      webpush: {
        notification: { title, body, icon: '/icon-192.png', badge: '/icon-192.png', tag },
        fcm_options: { link: url },
      },
    })
    sent += res.successCount
    failed += res.failureCount
    res.responses.forEach((r, j) => {
      if (!r.success) {
        const code = r.error?.code || ''
        if (code.includes('registration-token-not-registered') || code.includes('invalid-argument')) {
          stale.push(batch[j])
        }
      }
    })
  }

  const staleByUid = {}
  for (const t of stale) {
    const uid = tokenOwners.get(t)
    if (!uid) continue
    ;(staleByUid[uid] ??= {})[`fcmTokens.${t}`] = FieldValue.delete()
  }
  await Promise.all(
    Object.entries(staleByUid).map(([uid, updates]) =>
      fs.doc(`users/${uid}`).update(updates).catch(() => {}),
    ),
  )

  await notifRef.update({ push: { sent, failed, tokens: tokens.length } })
  return { data: { sent, failed, tokens: tokens.length }, target: toUid || 'all', params: { title, sent, failed, pruned: stale.length, toUid } }
})
