const { onSchedule } = require('firebase-functions/v2/scheduler')
const { HttpsError } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')
const logger = require('firebase-functions/logger')
const { requireString, escapeHtml, markdownToHtml } = require('./adminValidation.js')
const { adminCall } = require('./admin.js')

const REGION = 'asia-southeast1'
const RESEND_API_KEY = defineSecret('RESEND_API_KEY')
const EMAIL_FROM = 'hello@avishekdevnath.com'
const EMAIL_FROM_NAME = 'BUBU Timer'
const EMAIL_REPLY_TO = 'hello@avishekdevnath.com'

function isDueNow(reminder, nowHour, nowMinute) {
  if (reminder.timeHour !== nowHour) return false
  const bucketStart = Math.floor(nowMinute / 15) * 15
  const bucketEnd = bucketStart + 14
  return reminder.timeMinute >= bucketStart && reminder.timeMinute <= bucketEnd
}

function isExpired(reminder, dateStr) {
  if (!reminder.endDate) return false
  return dateStr > reminder.endDate
}

function isNotStarted(reminder, dateStr) {
  if (!reminder.startDate) return false
  return dateStr < reminder.startDate
}

// Reminder bodies can now be long, formatted email copy, but FCM data
// messages cap out around 4KB total — the notification tray only ever
// shows a few lines anyway, so push gets a short plain-text preview
// while the email gets the full body.
function truncateForPush(text, maxLen = 300) {
  const trimmed = text.trim()
  if (trimmed.length <= maxLen) return trimmed
  return `${trimmed.slice(0, maxLen - 1).trimEnd()}…`
}

// reminder.toUid is null (everyone), a single uid string, or an array of uids
// (multi-user targeting). Normalizes to an array of uids, or null for everyone.
function targetUidList(toUid) {
  if (toUid == null) return null
  return Array.isArray(toUid) ? toUid : [toUid]
}

async function fetchTargetUserDocs(fs, toUid) {
  const uids = targetUidList(toUid)
  if (uids === null) return (await fs.collection('users').get()).docs
  return Promise.all(uids.map((uid) => fs.doc(`users/${uid}`).get()))
}

function dhakaParts(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date)
  const get = (type) => parts.find((p) => p.type === type)?.value
  return {
    dateStr: `${get('year')}-${get('month')}-${get('day')}`,
    hour: Number(get('hour')) % 24,
    minute: Number(get('minute')),
  }
}

async function sendReminderPush(fs, reminder, reminderId, dateStr) {
  const tag = `bubu-reminder-${reminderId}-${dateStr}`
  const notifRef = await fs.collection('notifications').add({
    type: 'reminder',
    title: reminder.title,
    body: reminder.body,
    url: '/home',
    toUid: reminder.toUid,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: reminder.createdBy,
    push: null,
  })

  const docsSnap = await fetchTargetUserDocs(fs, reminder.toUid)
  const tokenOwners = new Map()
  for (const doc of docsSnap) {
    if (!doc.exists) continue
    for (const t of Object.keys(doc.data()?.fcmTokens || {})) tokenOwners.set(t, doc.id)
  }
  const tokens = [...tokenOwners.keys()]
  const pushBody = truncateForPush(reminder.body)

  let sent = 0
  let failed = 0
  const stale = []
  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500)
    const res = await getMessaging().sendEachForMulticast({
      tokens: batch,
      data: { title: reminder.title, body: pushBody, url: '/home', notifId: notifRef.id, tag },
      webpush: {
        notification: { title: reminder.title, body: pushBody, icon: '/icon-192.png', badge: '/icon-192.png', tag },
        fcm_options: { link: '/home' },
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
    Object.entries(staleByUid).map(([uid, updates]) => fs.doc(`users/${uid}`).update(updates).catch(() => {})),
  )
  await notifRef.update({ push: { sent, failed, tokens: tokens.length } })
}

async function sendReminderEmail(fs, reminder) {
  const docsSnap = await fetchTargetUserDocs(fs, reminder.toUid)
  const recipients = docsSnap
    .filter((d) => d.exists)
    .map((d) => ({ uid: d.id, email: d.data()?.email }))
    .filter((r) => r.email)
  if (recipients.length === 0) {
    logger.warn('reminder email skipped: no target recipients have an email on file')
    return
  }

  const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:480px;margin:0 auto;padding:24px">
<p style="font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#78716c;margin:0 0 16px">${escapeHtml(EMAIL_FROM_NAME)}</p>
<div style="font-size:14px;color:#292524;line-height:1.6">${markdownToHtml(reminder.body)}</div>
</div>`

  const payload = recipients.map((r) => ({
    from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
    reply_to: EMAIL_REPLY_TO,
    to: r.email,
    subject: reminder.title,
    html,
  }))

  // fetch() only rejects on network failure — a non-2xx Resend response
  // (bad key, rate limit, validation error) resolves normally and was
  // previously swallowed by a bare .catch(), so failures sent zero email
  // with zero trace anywhere. Check res.ok explicitly and log the body.
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY.value()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    logger.error('reminder email send failed', { status: res.status, body: await res.text() })
    return
  }
  logger.info('reminder email sent', { recipients: recipients.length })
}

const checkReminders = onSchedule(
  { schedule: 'every 15 minutes', region: REGION, secrets: [RESEND_API_KEY] },
  async () => {
    const fs = getFirestore()
    const { dateStr, hour, minute } = dhakaParts(new Date())
    const snap = await fs.collection('reminders').where('active', '==', true).get()
    logger.info(`checkReminders: ${snap.size} active reminder(s) at ${dateStr} ${hour}:${minute}`)

    for (const doc of snap.docs) {
      const reminder = doc.data()
      try {
        if (isExpired(reminder, dateStr)) {
          logger.info(`reminder ${doc.id} expired (endDate ${reminder.endDate}) — deactivating`)
          await doc.ref.update({ active: false })
          continue
        }
        if (isNotStarted(reminder, dateStr)) {
          logger.info(`reminder ${doc.id} not started yet (startDate ${reminder.startDate})`)
          continue
        }
        if (reminder.lastFiredDate === dateStr) {
          logger.info(`reminder ${doc.id} already fired today (${dateStr})`)
          continue
        }
        if (!isDueNow(reminder, hour, minute)) continue

        logger.info(`reminder ${doc.id} due now — sending`)
        await sendReminderPush(fs, reminder, doc.id, dateStr)
        await sendReminderEmail(fs, reminder)
        await doc.ref.update({
          lastFiredDate: dateStr,
          lastFiredAt: FieldValue.serverTimestamp(),
          fireCount: FieldValue.increment(1),
        })
      } catch (err) {
        logger.error(`reminder ${doc.id} failed`, err)
      }
    }
  },
)

// Manual trigger for admins: fires push + email for one reminder right now,
// bypassing the schedule/lastFiredDate/startDate/endDate checks entirely.
// Still counts toward fireCount/lastFiredAt (it did send), but deliberately
// leaves lastFiredDate untouched so it never disturbs the normal daily schedule.
const adminSendReminderNow = adminCall('sendReminderNow', async (request) => {
  const id = requireString(request.data?.id, 'id', 200)
  const fs = getFirestore()
  const doc = await fs.doc(`reminders/${id}`).get()
  if (!doc.exists) throw new HttpsError('not-found', 'Reminder not found')
  const reminder = doc.data()
  const { dateStr } = dhakaParts(new Date())

  await sendReminderPush(fs, reminder, doc.id, dateStr)
  await sendReminderEmail(fs, reminder)
  await doc.ref.update({ lastFiredAt: FieldValue.serverTimestamp(), fireCount: FieldValue.increment(1) })

  return { data: { ok: true }, target: id, params: { title: reminder.title } }
}, { secrets: [RESEND_API_KEY] })

module.exports = { isDueNow, isExpired, isNotStarted, truncateForPush, checkReminders, adminSendReminderNow }
