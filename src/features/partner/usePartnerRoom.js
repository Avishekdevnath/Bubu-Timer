import { useEffect, useRef, useState } from 'react'
import { off, onDisconnect, onValue, ref, update } from 'firebase/database'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { database, firestore } from '../../lib/firebase.js'
import { toPlanPayload } from '../plan/planSync.js'
import { loadStoredPairing, saveStoredPairing, clearStoredPairing } from '../../lib/storage.js'
import * as api from './partnerApi.js'

const roomChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const pushThrottleMs = 5000

function genRoomCode() {
  return Array.from({ length: 6 }, () => roomChars[Math.floor(Math.random() * roomChars.length)]).join('')
}

export function usePartnerRoom({ currentUser, appState, showToast, playChatPing }) {
  const [pair, setPair] = useState(() => ({ connected: false, roomCode: null, mySlot: null, partnerSlot: null, data: null, partnerNick: '' }))
  const [restoring, setRestoring] = useState(() => {
    const stored = loadStoredPairing()
    return !!(stored?.roomCode && stored?.mySlot)
  })
  const [chatMessages, setChatMessages] = useState([])
  const [activeReactionId, setActiveReactionId] = useState(null)
  const [unreadChat, setUnreadChat] = useState(false)
  const [roomInput, setRoomInput] = useState('')
  const [editingMsgId, setEditingMsgId] = useState(null)
  const [editText, setEditText] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [jumpToId, setJumpToId] = useState(null)
  const chatEndRef = useRef(null)
  const notifTimerRef = useRef(null)
  const typingTimerRef = useRef(null)
  const partnerRefs = useRef({ myRef: null, partnerRef: null, lastPush: 0, lastMode: null })
  const msgsCacheRef = useRef({})
  const latestTsRef = useRef(0)

  function stableMsgs(val) {
    const cache = msgsCacheRef.current
    const newCache = {}
    const msgs = []
    for (const [id, m] of Object.entries(val)) {
      const sig = `${m.ts}|${m.editedAt ?? ''}|${JSON.stringify(m.reactions ?? {})}`
      if (cache[id]?.sig === sig) {
        newCache[id] = cache[id]
      } else {
        newCache[id] = { sig, msg: { id, ...m } }
      }
      msgs.push(newCache[id].msg)
    }
    msgsCacheRef.current = newCache
    return msgs.sort((a, b) => a.ts - b.ts)
  }

  function bindRoom(code, mySlot, myName, announce = true) {
    const partnerSlot = mySlot === 'A' ? 'B' : 'A'
    const myRef = ref(database, `rooms/${code}/${mySlot}`)
    const partnerRef = ref(database, `rooms/${code}/${partnerSlot}`)
    partnerRefs.current = { ...partnerRefs.current, myRef, partnerRef, mySlot, roomCode: code }
    onDisconnect(myRef).update({ online: false })
    update(myRef, {
      uid: currentUser?.uid || null,
      name: myName || currentUser?.username || currentUser?.email || 'Partner',
      online: true,
      plan: toPlanPayload(appState.dailyPlan),
      joinedAt: Date.now(),
    }).catch((err) => console.error('[Room] initial write failed', err))
    partnerRefs.current.lastPush = Date.now()
    partnerRefs.current.lastMode = appState.mode

    // Listen to my own slot — sync deletedMsgs + starredMsgs across my devices
    onValue(ref(database, `rooms/${code}/${mySlot}`), (snap) => {
      const val = snap.val() || {}
      setPair((prev) => ({
        ...prev,
        myDeletedMsgs: val.deletedMsgs || {},
        myStarredMsgs: val.starredMsgs || {},
        partnerNick: val.partnerNick || prev.partnerNick || '',
      }))
    })

    // Listen to shared pins
    onValue(ref(database, `rooms/${code}/pins`), (snap) => {
      setPair((prev) => ({ ...prev, pins: snap.val() || {} }))
    })

    // Listen to shared checklists
    onValue(ref(database, `rooms/${code}/checklists`), (snap) => {
      const val = snap.val() || {}
      const list = Object.entries(val).map(([id, c]) => ({
        id,
        ...c,
        items: c.items ? Object.entries(c.items).map(([iid, i]) => ({ id: iid, ...i })) : [],
      }))
      setPair((prev) => ({ ...prev, checklists: list }))
    })

    let sawPartnerOnce = false
    onValue(partnerRef, (snap) => {
      const val = snap.val()
      if (val !== null) sawPartnerOnce = true
      if (mySlot === 'B' && val === null && sawPartnerOnce) {
        showToast('You were removed from the room', 'bank-t')
        disconnect()
        return
      }
      setPair((prev) => ({ ...prev, data: val }))
    })

    const chatRef = ref(database, `rooms/${code}/chat`)
    partnerRefs.current.chatRef = chatRef
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    let firstLoad = true
    onValue(chatRef, (snap) => {
      const val = snap.val()
      const msgs = val ? stableMsgs(val) : []
      setChatMessages(msgs)

      const latest = msgs[msgs.length - 1]
      if (latest && latest.sender !== mySlot) {
        api.markDelivered(code, mySlot, latest.ts).catch(() => {})
      }

      if (firstLoad) {
        latestTsRef.current = latest?.ts ?? 0
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        firstLoad = false
        return
      }

      // Only scroll + notify for genuinely new messages, not reactions/edits
      const isNew = latest && latest.ts > latestTsRef.current
      if (isNew) {
        latestTsRef.current = latest.ts
        setUnreadChat(true)
        if (latest.sender !== mySlot) {
          playChatPing()
          clearTimeout(notifTimerRef.current)
          if (window.location.pathname !== '/buddy' && Notification.permission === 'granted') {
            new Notification('New message from study partner', {
              body: latest.text,
              icon: '/icon-192.png',
              tag: 'bubu-chat',
            })
          }
        }
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      }
    })

    setPair((prev) => ({ ...prev, connected: true, roomCode: code, mySlot, partnerSlot, myName, partnerNick: prev.partnerNick || '' }))
    saveStoredPairing({ roomCode: code, mySlot, myName })
    // Sync activeRoom to Firestore so other devices auto-restore
    if (currentUser?.uid && !currentUser.isGuest) {
      updateDoc(doc(firestore, 'users', currentUser.uid), {
        activeRoom: { roomCode: code, mySlot, myName: myName || '' },
      }).catch(() => {})
    }
    if (announce) showToast(`Room ${code} ready`, 'study-t')
  }

  /* ── Room lifecycle ── */
  async function createRoom() {
    if (!currentUser) return showToast('Please log in first', 'bank-t')
    if (currentUser.isGuest) return showToast("Guest users can't create rooms", 'bank-t')
    const code = genRoomCode()
    await api.wipeRoom(code)
    bindRoom(code, 'A', currentUser.username || currentUser.email)
  }

  async function joinRoom() {
    if (!currentUser) return showToast('Please log in first', 'bank-t')
    if (currentUser.isGuest) return showToast("Guest users can't join rooms", 'bank-t')
    const code = roomInput.trim().toUpperCase()
    if (code.length !== 6) return showToast('Enter 6-char code', 'bank-t')
    if (!(await api.roomExists(code))) return showToast('Room not found', 'bank-t')
    if (await api.slotBOccupied(code)) return showToast('Room is full', 'bank-t')
    bindRoom(code, 'B', currentUser.username || currentUser.email)
  }

  function disconnect() {
    if (partnerRefs.current.myRef) {
      update(partnerRefs.current.myRef, { online: false })
      onDisconnect(partnerRefs.current.myRef).cancel()
    }
    if (partnerRefs.current.partnerRef) off(partnerRefs.current.partnerRef)
    if (partnerRefs.current.chatRef) off(partnerRefs.current.chatRef)
    partnerRefs.current = { myRef: null, partnerRef: null, chatRef: null, lastPush: 0, lastMode: null }
    msgsCacheRef.current = {}
    latestTsRef.current = 0
    clearStoredPairing()
    if (currentUser?.uid && !currentUser.isGuest) {
      updateDoc(doc(firestore, 'users', currentUser.uid), { activeRoom: null }).catch(() => {})
    }
    setChatMessages([])
    setUnreadChat(false)
    setReplyingTo(null)
    clearTimeout(notifTimerRef.current)
    setPair({ connected: false, roomCode: null, mySlot: null, partnerSlot: null, data: null, partnerNick: '' })
    showToast('Disconnected', '')
  }

  async function kickPartner() {
    const { roomCode } = partnerRefs.current
    if (!roomCode) return
    await api.kickSlotB(roomCode)
    setPair((prev) => ({ ...prev, data: null }))
    showToast('Partner removed', '')
  }

  /* ── Messages ── */
  async function sendMessage(msgData) {
    if (!pair.roomCode) return

    // Handle text (string), voice messages (object), or attachments (object with attachments)
    const isVoice = typeof msgData === 'object' && msgData.type === 'voice'
    const isAttachment = typeof msgData === 'object' && msgData.attachments && msgData.attachments.length > 0
    const isText = typeof msgData === 'string'

    if (isText && !msgData.trim()) return
    if (isVoice && (!msgData.audioUrl || !msgData.duration)) return
    if (isAttachment && !msgData.attachments.length) return

    const msg = {
      sender: pair.mySlot,
      senderName: currentUser?.username || currentUser?.email || 'Me',
      ts: Date.now(),
    }

    if (isText) {
      msg.text = msgData.trim()
    } else if (isVoice) {
      msg.type = 'voice'
      msg.audioUrl = msgData.audioUrl
      msg.duration = msgData.duration
    } else if (isAttachment) {
      msg.text = msgData.text || ''
      msg.attachments = msgData.attachments
    }

    if (replyingTo) {
      msg.replyTo = {
        id: replyingTo.id,
        name: replyingTo.sender === pair.mySlot ? 'Me' : (pair.partnerNick || pair.data?.name || 'Partner'),
        text: (replyingTo.text || '').slice(0, 120),
      }
    }

    await api.sendMessage(pair.roomCode, msg)
    setReplyingTo(null)
    stopTyping()
    api.markRead(pair.roomCode, pair.mySlot, msg.ts).catch(() => {})
  }

  function editMessageFn(msgId, newText) {
    if (!pair.roomCode || !newText.trim()) return
    return api.editMessage(pair.roomCode, msgId, newText)
  }

  async function deleteForMeFn(msgId) {
    if (!pair.roomCode || !pair.mySlot) return
    await api.deleteForMe(pair.roomCode, pair.mySlot, msgId)
    setActiveReactionId(null)
  }

  async function deleteForEveryoneFn(msgId) {
    if (!pair.roomCode) return
    await api.deleteForEveryone(pair.roomCode, msgId)
    setActiveReactionId(null)
  }

  function copyText(text) {
    navigator.clipboard?.writeText(text)
    showToast('Copied', 'study-t')
    setActiveReactionId(null)
  }

  /* ── Reactions ── */
  async function addReactionFn(msgId, emoji, currentEmoji) {
    if (!pair.roomCode) return
    const uid = currentUser?.uid || pair.mySlot
    if (currentEmoji === emoji) {
      await api.removeReaction(pair.roomCode, msgId, uid)
    } else {
      await api.addReaction(pair.roomCode, msgId, uid, emoji)
    }
    setActiveReactionId(null)
  }

  /* ── Pin (shared) ── */
  async function togglePinFn(msgId) {
    if (!pair.roomCode) return
    const result = await api.togglePin(pair.roomCode, msgId, pair.mySlot, pair.pins || {})
    if (result?.error === 'limit') {
      showToast(`Max ${result.max} pins. Unpin one first.`, 'bank-t')
    }
    setActiveReactionId(null)
  }

  /* ── Star (personal) ── */
  async function toggleStarFn(msgId) {
    if (!pair.roomCode || !pair.mySlot) return
    await api.toggleStar(pair.roomCode, pair.mySlot, msgId, pair.myStarredMsgs || {})
    setActiveReactionId(null)
  }

  /* ── Reply ── */
  function startReply(msg) {
    setReplyingTo(msg)
    setActiveReactionId(null)
  }

  function cancelReply() {
    setReplyingTo(null)
  }

  /* ── Nickname ── */
  async function saveNicknameFn(nick) {
    const { roomCode, mySlot } = partnerRefs.current
    if (!roomCode || !mySlot) return
    await api.saveNickname(roomCode, mySlot, nick)
    setPair((prev) => ({ ...prev, partnerNick: nick }))
    showToast('Nickname saved', 'study-t')
  }

  /* ── Checklists ── */
  function createChecklist(data) {
    if (!pair.roomCode) return Promise.resolve()
    return api.createChecklist(pair.roomCode, { ...data, createdBy: pair.mySlot })
  }
  function updateChecklist(id, patch) {
    if (!pair.roomCode) return Promise.resolve()
    return api.updateChecklist(pair.roomCode, id, patch)
  }
  function deleteChecklist(id) {
    if (!pair.roomCode) return Promise.resolve()
    return api.deleteChecklist(pair.roomCode, id)
  }
  function addItem(listId, text) {
    if (!pair.roomCode || !text.trim()) return Promise.resolve()
    return api.addChecklistItem(pair.roomCode, listId, text)
  }
  function updateItem(listId, itemId, patch) {
    if (!pair.roomCode) return Promise.resolve()
    return api.updateChecklistItem(pair.roomCode, listId, itemId, patch)
  }
  function deleteItem(listId, itemId) {
    if (!pair.roomCode) return Promise.resolve()
    return api.deleteChecklistItem(pair.roomCode, listId, itemId)
  }
  function toggleItem(listId, item) {
    return updateItem(listId, item.id, { done: !item.done })
  }
  function toggleArchive(list) {
    return updateChecklist(list.id, { isArchived: !list.isArchived })
  }

  /* ── Typing indicator (debounced) ── */
  function notifyTyping() {
    if (!pair.roomCode || !pair.mySlot) return
    api.setTyping(pair.roomCode, pair.mySlot, true).catch(() => {})
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      api.setTyping(pair.roomCode, pair.mySlot, false).catch(() => {})
    }, 2500)
  }

  function stopTyping() {
    if (!pair.roomCode || !pair.mySlot) return
    clearTimeout(typingTimerRef.current)
    api.setTyping(pair.roomCode, pair.mySlot, false).catch(() => {})
  }

  /* ── Read receipts ── */
  function markRead() {
    if (!pair.roomCode || !pair.mySlot) return
    api.markRead(pair.roomCode, pair.mySlot).catch(() => {})
  }

  /* ── Push my study state for partner card ── */
  function pushMyState(force = false) {
    const refs = partnerRefs.current
    if (!refs.myRef) return
    const now = Date.now()
    const planSig = JSON.stringify([appState.dailyPlan?.activeItemId, appState.dailyPlan?.items?.map((i) => i.status)])
    const changed = refs.lastPlanSig !== planSig
    if (!force && !changed && now - refs.lastPush < pushThrottleMs) return
    refs.lastPush = now
    refs.lastPlanSig = planSig
    update(refs.myRef, {
      name: pair.myName || currentUser?.username || currentUser?.email || 'Partner',
      plan: toPlanPayload(appState.dailyPlan),
      online: true,
      updatedAt: now,
    }).catch(() => {})
  }

  /* ── Effects ── */
  useEffect(() => {
    if (!pair.connected || !partnerRefs.current.myRef) return
    pushMyState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState.dailyPlan, pair.connected])

  useEffect(() => {
    const stored = loadStoredPairing()
    if (stored?.roomCode && stored?.mySlot) {
      api.roomExists(stored.roomCode).then((exists) => {
        if (exists) bindRoom(stored.roomCode, stored.mySlot, stored.myName || '', false)
        else clearStoredPairing()
      }).catch(() => clearStoredPairing()).finally(() => setRestoring(false))
    } else {
      // No stored pairing — clear restoring on next tick to avoid sync setState in effect
      Promise.resolve().then(() => setRestoring(false))
    }
    return () => {
      if (partnerRefs.current.partnerRef) off(partnerRefs.current.partnerRef)
      if (partnerRefs.current.chatRef) off(partnerRefs.current.chatRef)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Restore from Firestore on fresh login (no local pairing but user is signed in)
  useEffect(() => {
    if (!currentUser?.uid || currentUser.isGuest || pair.connected) return
    if (loadStoredPairing()?.roomCode) return // local already handled
    getDoc(doc(firestore, 'users', currentUser.uid)).then((snap) => {
      const data = snap.data()
      const ar = data?.activeRoom
      if (!ar?.roomCode || !ar?.mySlot) return
      api.roomExists(ar.roomCode).then((exists) => {
        if (exists) bindRoom(ar.roomCode, ar.mySlot, ar.myName || '', false)
      }).catch(() => {})
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid])

  useEffect(() => {
    if (!activeReactionId) return
    function onDocClick(e) {
      if (!e.target.closest('[data-reaction-picker]') && !e.target.closest('[data-msg-bubble]')) {
        setActiveReactionId(null)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [activeReactionId])

  return {
    pair, chatMessages, unreadChat, setUnreadChat, restoring,
    activeReactionId, setActiveReactionId,
    editingMsgId, setEditingMsgId, editText, setEditText,
    chatEndRef, notifTimerRef,
    roomInput, setRoomInput,
    replyingTo, startReply, cancelReply,
    jumpToId, setJumpToId,
    createRoom, joinRoom, disconnect, kickPartner,
    sendMessage, addReaction: addReactionFn,
    deleteForMe: deleteForMeFn, deleteForEveryone: deleteForEveryoneFn,
    editMessage: editMessageFn, copyText, saveNickname: saveNicknameFn,
    togglePin: togglePinFn, toggleStar: toggleStarFn,
    notifyTyping, stopTyping, markRead,
    createChecklist, updateChecklist, deleteChecklist,
    addItem, updateItem, deleteItem, toggleItem, toggleArchive,
  }
}
