const { onSchedule } = require('firebase-functions/v2/scheduler')
const { defineSecret } = require('firebase-functions/params')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')
const logger = require('firebase-functions/logger')
const { escapeHtml } = require('./adminValidation.js')

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

  let sent = 0
  let failed = 0
  const stale = []
  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500)
    const res = await getMessaging().sendEachForMulticast({
      tokens: batch,
      data: { title: reminder.title, body: reminder.body, url: '/home', notifId: notifRef.id, tag },
      webpush: {
        notification: { title: reminder.title, body: reminder.body, icon: '/icon-192.png', badge: '/icon-192.png', tag },
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
  if (recipients.length === 0) return

  const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:480px;margin:0 auto;padding:24px">
<p style="font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#78716c;margin:0 0 16px">${escapeHtml(EMAIL_FROM_NAME)}</p>
<div style="font-size:14px;color:#292524;line-height:1.6">${escapeHtml(reminder.body).replace(/\n/g, '<br>')}</div>
</div>`

  const payload = recipients.map((r) => ({
    from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
    reply_to: EMAIL_REPLY_TO,
    to: r.email,
    subject: reminder.title,
    html,
  }))

  await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY.value()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((err) => logger.error('reminder email send failed', err))
}

const checkReminders = onSchedule(
  { schedule: 'every 15 minutes', region: REGION, secrets: [RESEND_API_KEY] },
  async () => {
    const fs = getFirestore()
    const { dateStr, hour, minute } = dhakaParts(new Date())
    const snap = await fs.collection('reminders').where('active', '==', true).get()

    for (const doc of snap.docs) {
      const reminder = doc.data()
      try {
        if (isExpired(reminder, dateStr)) {
          await doc.ref.update({ active: false })
          continue
        }
        if (reminder.lastFiredDate === dateStr) continue
        if (!isDueNow(reminder, hour, minute)) continue

        await sendReminderPush(fs, reminder, doc.id, dateStr)
        await sendReminderEmail(fs, reminder)
        await doc.ref.update({ lastFiredDate: dateStr })
      } catch (err) {
        logger.error(`reminder ${doc.id} failed`, err)
      }
    }
  },
)

module.exports = { isDueNow, isExpired, checkReminders }
