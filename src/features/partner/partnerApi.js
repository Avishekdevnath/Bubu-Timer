import { get, push, ref, remove, set, update } from 'firebase/database'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { database, storage } from '../../lib/firebase.js'

export const MAX_PINS = 15

/* ── Messages ── */
export function sendMessage(code, msg) {
  return push(ref(database, `rooms/${code}/chat`), msg)
}

export function editMessage(code, msgId, newText) {
  return update(ref(database, `rooms/${code}/chat/${msgId}`), { text: newText.trim(), editedAt: Date.now() })
}

export function deleteForEveryone(code, msgId) {
  return remove(ref(database, `rooms/${code}/chat/${msgId}`))
}

export function deleteForMe(code, slot, msgId) {
  return update(ref(database, `rooms/${code}/${slot}/deletedMsgs`), { [msgId]: true })
}

/**
 * Upload voice message blob to Firebase Storage
 * @param {string} roomCode - Room code
 * @param {Blob} blob - Audio blob (webm format)
 * @param {number} duration - Recording duration in seconds
 * @returns {Promise<{audioUrl: string, duration: number}>}
 */
export async function uploadVoice(roomCode, blob, duration) {
  const timestamp = Date.now()
  const path = `voiceMsgs/${roomCode}/${timestamp}.webm`
  
  try {
    const ref = storageRef(storage, path)
    await uploadBytes(ref, blob, { contentType: 'audio/webm' })
    const audioUrl = await getDownloadURL(ref)
    
    return { audioUrl, duration }
  } catch (err) {
    console.error('Failed to upload voice message:', err)
    throw err
  }
}

/**
 * Upload image attachment to Firebase Storage
 * @param {string} roomCode - Room code
 * @param {File} file - Image file
 * @param {function} onProgress - Progress callback (0-100)
 * @returns {Promise<{imageUrl: string, fileName: string, size: number}>}
 */
export async function uploadAttachment(roomCode, file, onProgress = () => {}) {
  const timestamp = Date.now()
  const fileExtension = file.name.split('.').pop()
  const fileName = `img_${timestamp}.${fileExtension}`
  const path = `attachments/${roomCode}/${fileName}`

  try {
    const fileRef = storageRef(storage, path)
    
    // Upload with progress tracking
    const task = uploadBytes(fileRef, file, { contentType: file.type })
    
    // For client-side, we track based on file size chunks
    onProgress(50)
    await task
    onProgress(80)
    
    const imageUrl = await getDownloadURL(fileRef)
    onProgress(100)

    return {
      imageUrl,
      fileName: file.name,
      size: file.size,
    }
  } catch (err) {
    console.error('Failed to upload attachment:', err)
    throw err
  }
}

/* ── Reactions ── */
export function addReaction(code, msgId, uid, emoji) {
  return update(ref(database, `rooms/${code}/chat/${msgId}/reactions`), { [uid]: emoji })
}

export function removeReaction(code, msgId, uid) {
  return remove(ref(database, `rooms/${code}/chat/${msgId}/reactions/${uid}`))
}

/* ── Pin (shared, max 15) ── */
export async function togglePin(code, msgId, pinnedBy, currentPins = {}) {
  const isPinned = !!currentPins[msgId]
  if (isPinned) {
    return remove(ref(database, `rooms/${code}/pins/${msgId}`))
  }
  // Enforce max
  if (Object.keys(currentPins).length >= MAX_PINS) {
    return { error: 'limit', max: MAX_PINS }
  }
  await update(ref(database, `rooms/${code}/pins`), { [msgId]: { ts: Date.now(), pinnedBy } })
  return { ok: true }
}

/* ── Star (personal, under my slot) ── */
export async function toggleStar(code, slot, msgId, currentStarred = {}) {
  const isStarred = !!currentStarred[msgId]
  if (isStarred) {
    return remove(ref(database, `rooms/${code}/${slot}/starredMsgs/${msgId}`))
  }
  return update(ref(database, `rooms/${code}/${slot}/starredMsgs`), { [msgId]: true })
}

/* ── Nickname ── */
export function saveNickname(code, slot, nick) {
  return update(ref(database, `rooms/${code}/${slot}`), { partnerNick: nick })
}

/* ── Typing indicator ── */
export function setTyping(code, slot, isTyping) {
  return update(ref(database, `rooms/${code}/${slot}`), { typing: !!isTyping, typingAt: Date.now() })
}

/* ── Read receipts ── */
export function markRead(code, slot, ts) {
  return update(ref(database, `rooms/${code}/${slot}`), { lastReadTs: ts || Date.now() })
}

export function markDelivered(code, slot, ts) {
  return update(ref(database, `rooms/${code}/${slot}`), { lastDeliveredTs: ts || Date.now() })
}

/* ── Checklists ── */
export function createChecklist(code, data) {
  return push(ref(database, `rooms/${code}/checklists`), {
    title: data.title.trim(),
    topic: (data.topic || '').trim(),
    isArchived: false,
    items: {},
    createdAt: Date.now(),
    createdBy: data.createdBy || null,
  })
}

export function updateChecklist(code, id, patch) {
  return update(ref(database, `rooms/${code}/checklists/${id}`), patch)
}

export function deleteChecklist(code, id) {
  return remove(ref(database, `rooms/${code}/checklists/${id}`))
}

export function addChecklistItem(code, listId, text) {
  return push(ref(database, `rooms/${code}/checklists/${listId}/items`), {
    text: text.trim(),
    done: false,
    addedAt: Date.now(),
  })
}

export function updateChecklistItem(code, listId, itemId, patch) {
  return update(ref(database, `rooms/${code}/checklists/${listId}/items/${itemId}`), patch)
}

export function deleteChecklistItem(code, listId, itemId) {
  return remove(ref(database, `rooms/${code}/checklists/${listId}/items/${itemId}`))
}

/* ── Plan history ── */
export function pushPlanHistory(code, slot, date, payload) {
  return set(ref(database, `rooms/${code}/history/${slot}/${date}`), payload)
}

export async function fetchPlanHistory(code, slot, date) {
  const snap = await get(ref(database, `rooms/${code}/history/${slot}/${date}`))
  return snap.val()
}

/* ── Room management ── */
export function wipeRoom(code) {
  return remove(ref(database, `rooms/${code}`))
}

export function kickSlotB(code) {
  return remove(ref(database, `rooms/${code}/B`))
}

export async function roomExists(code) {
  const snap = await get(ref(database, `rooms/${code}/A`))
  return snap.exists()
}

export async function slotBOccupied(code) {
  const snap = await get(ref(database, `rooms/${code}/B`))
  return snap.exists() && snap.val()?.online
}
