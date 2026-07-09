const { onValueCreated } = require('firebase-functions/v2/database')
const { initializeApp } = require('firebase-admin/app')
const { getDatabase } = require('firebase-admin/database')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')
const logger = require('firebase-functions/logger')

// Import voice message cleanup functions
const voiceCleanup = require('./deleteExpiredVoiceMessages.js')

initializeApp()

/**
 * Triggered when a new chat message lands in any room.
 * Sends FCM push to partner's registered devices.
 */
exports.onChatMessage = onValueCreated(
  {
    region: 'asia-southeast1',
    ref: '/rooms/{code}/chat/{msgId}',
    instance: 'bubu-study-timer-default-rtdb',
  },
  async (event) => {
    const msg = event.data.val()
    const { code, msgId } = event.params
    if (!msg || !msg.sender) return

    const partnerSlot = msg.sender === 'A' ? 'B' : 'A'
    const db = getDatabase()
    const partnerSnap = await db.ref(`/rooms/${code}/${partnerSlot}`).once('value')
    const partner = partnerSnap.val()
    if (!partner?.uid) {
      logger.info('No partner uid for room', code)
      return
    }

    // Nickname partner assigned to me (sender). Lives under partner's slot.
    const partnerNick = partner.partnerNick

    const title = partnerNick || msg.senderName || 'New message'
    const body = String(msg.text || '').slice(0, 120) || '(message)'

    // Fetch partner's FCM tokens from Firestore users/{uid}/fcmTokens
    const userDoc = await getFirestore().doc(`users/${partner.uid}`).get()
    const userData = userDoc.exists ? userDoc.data() : null
    const tokenMap = userData?.fcmTokens || {}
    const tokens = Object.keys(tokenMap)
    if (!tokens.length) {
      logger.info('No FCM tokens for partner', partner.uid)
      return
    }

    const message = {
      tokens,
      data: { title, body, url: '/buddy', roomCode: code, msgId },
      webpush: {
        notification: {
          title,
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'bubu-chat',
        },
        fcm_options: { link: '/buddy' },
      },
    }

    const response = await getMessaging().sendEachForMulticast(message)
    logger.info(`Sent: ${response.successCount}/${tokens.length}`)

    // Cleanup expired tokens
    if (response.failureCount > 0) {
      const stale = []
      response.responses.forEach((r, i) => {
        if (!r.success) {
          const err = r.error?.code || ''
          if (err.includes('registration-token-not-registered') ||
              err.includes('invalid-argument')) {
            stale.push(tokens[i])
          }
        }
      })
      if (stale.length) {
        const updates = {}
        stale.forEach((t) => { updates[`fcmTokens.${t}`] = FieldValue.delete() })
        await getFirestore().doc(`users/${partner.uid}`).update(updates).catch(() => {})
        logger.info(`Removed ${stale.length} stale tokens`)
      }
    }
  }
)

// Export voice message cleanup functions
exports.deleteExpiredVoiceMessages = voiceCleanup.deleteExpiredVoiceMessages
exports.cleanupExpiredVoiceMessagesHttp = voiceCleanup.cleanupExpiredVoiceMessagesHttp

// Admin callables (custom-claim gated)
const adminFns = require('./admin.js')
exports.adminListUsers = adminFns.adminListUsers
exports.adminResetUser = adminFns.adminResetUser
exports.adminDeleteUser = adminFns.adminDeleteUser
exports.adminCloseRoom = adminFns.adminCloseRoom
exports.adminClearChat = adminFns.adminClearChat
exports.adminBroadcast = adminFns.adminBroadcast
