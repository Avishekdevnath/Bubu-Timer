const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const { getAuth } = require('firebase-admin/auth')
const { getDatabase } = require('firebase-admin/database')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')
const logger = require('firebase-functions/logger')
const { requireString, requireSlot, requireEmail, requirePassword, validateBroadcast, validateEmailMessage, escapeHtml } = require('./adminValidation.js')

const REGION = 'asia-southeast1'
const RESEND_API_KEY = defineSecret('RESEND_API_KEY')
const EMAIL_FROM = 'hello@avishekdevnath.com'
const EMAIL_FROM_NAME = 'BUBU Timer'
const EMAIL_REPLY_TO = 'hello@avishekdevnath.com'

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

function adminCall(action, handler, extraOptions = {}) {
  return onCall({ region: REGION, ...extraOptions }, async (request) => {
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

exports.adminUpdateUserProfile = adminCall('updateUserProfile', async (request) => {
  const uid = requireString(request.data?.uid, 'uid', 200)
  const authUpdates = {}
  const docUpdates = {}
  if (request.data?.displayName != null && String(request.data.displayName).trim() !== '') {
    const displayName = requireString(request.data.displayName, 'displayName', 100)
    authUpdates.displayName = displayName
    docUpdates.username = displayName
  }
  if (request.data?.email != null && String(request.data.email).trim() !== '') {
    const email = requireEmail(request.data.email, 'email')
    authUpdates.email = email
    docUpdates.email = email
  }
  if (Object.keys(authUpdates).length === 0) throw new HttpsError('invalid-argument', 'Nothing to update')
  await getAuth().updateUser(uid, authUpdates)
  await getFirestore().doc(`users/${uid}`).set(docUpdates, { merge: true })
  return { target: uid, params: authUpdates }
})

exports.adminCreateUser = adminCall('createUser', async (request) => {
  const email = requireEmail(request.data?.email, 'email')
  const password = requirePassword(request.data?.password)
  const displayName = request.data?.displayName ? requireString(request.data.displayName, 'displayName', 100) : ''
  const userRecord = await getAuth().createUser({ email, password, displayName: displayName || undefined })
  await getFirestore().doc(`users/${userRecord.uid}`).set({
    email,
    username: displayName,
    partnerName: '',
    createdAt: FieldValue.serverTimestamp(),
  })
  return { data: { uid: userRecord.uid }, target: userRecord.uid, params: { email } }
})

exports.adminSetUserDisabled = adminCall('setUserDisabled', async (request) => {
  const uid = requireString(request.data?.uid, 'uid', 200)
  const disabled = !!request.data?.disabled
  if (uid === request.auth.uid) throw new HttpsError('invalid-argument', 'Cannot disable yourself')
  await getAuth().updateUser(uid, { disabled })
  if (disabled) {
    // Kill any already-signed-in sessions immediately — updateUser alone only
    // blocks new sign-ins; existing ID tokens stay valid until natural refresh.
    await getAuth().revokeRefreshTokens(uid)
  }
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

exports.adminSendEmail = adminCall('sendEmail', async (request) => {
  const { subject, body, toUid } = validateEmailMessage(request.data)
  const fs = getFirestore()

  let recipients = []
  if (toUid) {
    const doc = await fs.doc(`users/${toUid}`).get()
    if (!doc.exists || !doc.data()?.email) throw new HttpsError('not-found', 'User has no email on file')
    recipients = [{ uid: toUid, email: doc.data().email }]
  } else {
    const docsSnap = await fs.collection('users').get()
    recipients = docsSnap.docs
      .map((d) => ({ uid: d.id, email: d.data()?.email }))
      .filter((r) => r.email)
  }
  if (recipients.length === 0) throw new HttpsError('failed-precondition', 'No recipients with an email on file')

  const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:480px;margin:0 auto;padding:24px">
<p style="font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#78716c;margin:0 0 16px">${escapeHtml(EMAIL_FROM_NAME)}</p>
<div style="font-size:14px;color:#292524;line-height:1.6">${escapeHtml(body).replace(/\n/g, '<br>')}</div>
</div>`

  const results = await Promise.allSettled(
    recipients.map((r) =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY.value()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
          reply_to: EMAIL_REPLY_TO,
          to: r.email,
          subject,
          html,
        }),
      }).then(async (res) => {
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      }),
    ),
  )

  const perRecipient = recipients.map((r, i) => ({
    uid: r.uid,
    email: r.email,
    status: results[i].status === 'fulfilled' ? 'sent' : 'failed',
    resendId: results[i].status === 'fulfilled' ? results[i].value?.id || null : null,
  }))
  const sent = perRecipient.filter((r) => r.status === 'sent').length
  const failed = perRecipient.length - sent

  await fs.collection('emails').add({
    subject,
    body,
    toUid,
    sentBy: request.auth.uid,
    createdAt: FieldValue.serverTimestamp(),
    recipients: perRecipient,
    sent,
    failed,
  })

  return { data: { sent, failed, total: perRecipient.length }, target: toUid || 'all', params: { subject, sent, failed } }
}, { secrets: [RESEND_API_KEY] })
