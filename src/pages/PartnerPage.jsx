import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Pin, Search, Settings, Users, X } from 'lucide-react'
import { PartnerCard } from '../features/partner/PartnerCard.jsx'
import { RoomSettingsModal } from '../features/partner/RoomSettingsModal.jsx'
import { ChatInput } from '../features/partner/ChatInput.jsx'
import { ChatMessage } from '../features/partner/ChatMessage.jsx'

export function PartnerPage({ room, currentUser, showToast, navigate }) {
  const {
    pair, chatMessages, setUnreadChat, chatEndRef, notifTimerRef, restoring,
    activeReactionId, setActiveReactionId,
    editingMsgId, setEditingMsgId, editText, setEditText,
    roomInput, setRoomInput,
    replyingTo, startReply, cancelReply,
    jumpToId, setJumpToId,
    createRoom, joinRoom, disconnect, kickPartner,
    sendMessage, addReaction, deleteForMe, deleteForEveryone, editMessage, copyText, saveNickname,
    togglePin, toggleStar,
    notifyTyping, markRead,
  } = room

  const d = pair.data
  const [roomSettingsOpen, setRoomSettingsOpen] = useState(false)
  const [privacyMode, setPrivacyMode] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showScrollFab, setShowScrollFab] = useState(false)
  const chatScrollRef = useRef(null)
  const myDeletedMsgs = pair.myDeletedMsgs || {}
  const myStarredMsgs = pair.myStarredMsgs || {}
  const pins = pair.pins || {}
  const pinCount = Object.keys(pins).length
  const msgRefs = useRef({})

  // Latest pinned message for sticky banner
  const latestPin = pinCount > 0
    ? [...chatMessages].filter((m) => pins[m.id]).sort((a, b) => (pins[b.id]?.ts || 0) - (pins[a.id]?.ts || 0))[0]
    : null

  function jumpToMessage(id) {
    const el = msgRefs.current[id]
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('ring-4', 'ring-yellow-300/70', 'bg-yellow-50/50')
    setTimeout(() => {
      el.classList.remove('ring-4', 'ring-yellow-300/70', 'bg-yellow-50/50')
    }, 2000)
  }

  useEffect(() => {
    setUnreadChat(false)
    clearTimeout(notifTimerRef.current)
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
    if (markRead) markRead()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mark read whenever a new message arrives while I'm on this page
  useEffect(() => {
    if (pair.connected && markRead) markRead()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages.length])

  // Scroll-to-bottom FAB visibility
  useEffect(() => {
    const el = chatScrollRef.current
    if (!el) return
    function onScroll() {
      setShowScrollFab(el.scrollHeight - el.scrollTop - el.clientHeight > 120)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [pair.connected])

  // Handle jump from Pinned/Starred pages
  useEffect(() => {
    if (jumpToId) {
      setTimeout(() => {
        jumpToMessage(jumpToId)
        setJumpToId(null)
      }, 150)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpToId, chatMessages.length])

  if (restoring) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-[calc(100dvh-57px-env(safe-area-inset-bottom,0px)-96px)] md:h-[calc(100dvh-57px-env(safe-area-inset-bottom,0px)-24px)]">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-stone-200" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-stone-800 animate-spin" />
          <div className="absolute inset-2 rounded-full bg-stone-100 flex items-center justify-center">
            <Users size={20} className="text-stone-400 animate-pulse" />
          </div>
        </div>
        <p className="text-sm font-medium text-stone-500">Connecting to your room…</p>
        <p className="text-xs text-stone-400 mt-1">Syncing with your study partner</p>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col px-4 md:px-6 h-[calc(100dvh-57px-env(safe-area-inset-bottom,0px)-96px)] md:h-[calc(100dvh-57px-env(safe-area-inset-bottom,0px)-24px)]">
      {!pair.connected ? (
        <div className="flex flex-col items-center pt-10 max-w-sm mx-auto w-full">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 mb-5">
            <Users size={28} />
          </div>
          <h2 className="text-2xl font-light tracking-tight text-stone-800 mb-1">Study Partner</h2>
          <p className="text-sm text-stone-500 max-w-xs text-center mb-8">Create a room and share the code with your study partner.</p>
          <div className="w-full max-w-sm space-y-3">
            <button onClick={createRoom}
              className="w-full py-3.5 bg-stone-900 text-white text-sm font-semibold rounded-2xl hover:bg-stone-800 transition-colors shadow-md">
              Create Room
            </button>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-stone-200" />
              <span className="text-xs text-stone-400 font-medium">OR</span>
              <div className="flex-1 h-px bg-stone-200" />
            </div>
            <div className="flex gap-2">
              <input value={roomInput} onChange={(e) => setRoomInput(e.target.value.toUpperCase())} maxLength={6}
                placeholder="XXXXXX"
                className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm font-mono tracking-widest outline-none focus:border-stone-400 placeholder:text-stone-300 shadow-sm uppercase" />
              <button onClick={joinRoom}
                className="px-6 py-3 bg-white border border-stone-200 rounded-xl text-sm font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm">
                JOIN
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between bg-white border border-stone-100 rounded-2xl px-3 py-2 shadow-sm mb-3 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              {d ? (
                <>
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-sm font-semibold text-stone-600">
                      {((pair.partnerNick || d.name) || 'P')[0].toUpperCase()}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${d.online ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800 leading-tight">{pair.partnerNick || d.name || 'Partner'}</p>
                    <p className="text-[10px] text-stone-400 flex items-center gap-1">
                      {d.online && d.mode === 'study'
                        ? <><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block" />Studying</>
                        : d.online ? 'Online' : 'Offline'}
                      {d.chapter && <><span className="text-stone-300">·</span><span className="truncate max-w-[90px]">{d.chapter}</span></>}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm font-medium text-stone-400 italic">Waiting for partner…</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {d && (
                <>
                  <button onClick={() => navigate('/buddy/checklists')}
                    className="hidden md:flex px-2.5 h-8 items-center gap-1 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors text-xs font-semibold"
                    title="Checklists">
                    ✅ Tasks
                  </button>
                  <button onClick={() => setReportOpen(true)}
                    className="hidden md:flex px-2.5 h-8 items-center gap-1 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors text-xs font-semibold"
                    title="Partner report">
                    📊 Report
                  </button>
                </>
              )}
              {d && (
                <button onClick={() => { setSearchOpen(v => !v); setSearchQuery('') }}
                  className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${searchOpen ? 'bg-stone-900 text-white' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'}`}
                  title="Search messages">
                  <Search size={15} strokeWidth={1.8} />
                </button>
              )}
              {d && (
                <button onClick={() => setPrivacyMode(v => !v)}
                  className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${privacyMode ? 'bg-stone-900 text-white' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'}`}
                  title={privacyMode ? 'Show messages' : 'Hide messages'}>
                  {privacyMode ? '🔒' : '👁'}
                </button>
              )}
              <button onClick={() => setRoomSettingsOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                title="Room settings">
                <Settings size={16} strokeWidth={1.8} />
              </button>
            </div>
          </div>

          {searchOpen && (
            <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3 py-2 mb-2 shadow-sm flex-shrink-0">
              <Search size={14} className="text-stone-400 flex-shrink-0" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages…"
                className="flex-1 text-sm outline-none bg-transparent text-stone-800 placeholder:text-stone-300"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-stone-400 hover:text-stone-700">
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {!d ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Your Room Code</p>
                <p className="text-5xl font-mono font-bold tracking-[0.2em] text-stone-900">{pair.roomCode}</p>
                <p className="text-xs text-stone-400 mt-3">Share this code with your study partner</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { navigator.clipboard?.writeText(pair.roomCode); showToast('Code copied!', 'study-t') }}
                  className="px-5 py-2.5 bg-stone-900 text-white text-sm font-bold rounded-xl hover:bg-stone-800 transition-colors">
                  Copy Code
                </button>
                <button onClick={() => { navigator.share?.({ title: 'Join my study room', text: `Join me on Bubu Timer! Room code: ${pair.roomCode}` }).catch(() => navigator.clipboard?.writeText(pair.roomCode)); showToast('Shared!', 'study-t') }}
                  className="px-5 py-2.5 bg-stone-100 text-stone-700 text-sm font-bold rounded-xl hover:bg-stone-200 transition-colors">
                  Share
                </button>
              </div>
              <div className="flex items-center gap-2 text-stone-300">
                <Users size={20} strokeWidth={1} />
                <p className="text-xs">Waiting for partner to join…</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Sticky Pinned Banner */}
              {latestPin && (
                <div
                  onClick={() => jumpToMessage(latestPin.id)}
                  className="bg-white border border-stone-200 p-2.5 rounded-xl flex items-center gap-3 cursor-pointer shadow-sm hover:border-stone-400 transition-all flex-shrink-0 mb-2 group">
                  <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-stone-200 transition-colors">
                    <Pin size={14} className="text-stone-600 fill-stone-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tight">Latest Pin</span>
                      <span className="text-[10px] text-stone-300">•</span>
                      <span className="text-[10px] font-medium text-stone-500">{pinCount} total</span>
                    </div>
                    <p className="text-xs text-stone-700 truncate font-medium">{latestPin.text}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate('/buddy/pins') }}
                    className="px-2 py-1 bg-stone-50 hover:bg-stone-100 rounded-md text-[10px] font-bold text-stone-500 transition-colors border border-stone-100">
                    VIEW ALL
                  </button>
                </div>
              )}

              <div className="relative flex flex-col min-h-0 flex-1">
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden chat-scroll flex flex-col gap-4 px-3 py-2">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-stone-300 gap-2 py-8">
                    <p className="text-xs font-medium">No messages yet. Say hi! 👋</p>
                  </div>
                )}
                {chatMessages
                  .filter((msg) => !myDeletedMsgs[msg.id])
                  .filter((msg) => !searchQuery || (msg.text || '').toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((msg, idx, arr) => (
                    <ChatMessage
                      key={msg.id}
                      msg={msg}
                      idx={idx}
                      msgRef={(el) => { msgRefs.current[msg.id] = el }}
                      isMe={msg.sender === pair.mySlot}
                      myUid={currentUser?.uid || pair.mySlot}
                      blurred={privacyMode && idx !== arr.length - 1}
                      isPinned={!!pins[msg.id]}
                      isStarred={!!myStarredMsgs[msg.id]}
                      partnerLastReadTs={d?.lastReadTs}
                      partnerLastDeliveredTs={d?.lastDeliveredTs}
                      activeReactionId={activeReactionId}
                      setActiveReactionId={setActiveReactionId}
                      editingMsgId={editingMsgId}
                      editText={editText}
                      setEditText={setEditText}
                      setEditingMsgId={setEditingMsgId}
                      onReact={addReaction}
                      onEdit={editMessage}
                      onCopy={copyText}
                      onDeleteForMe={deleteForMe}
                      onDeleteForEveryone={deleteForEveryone}
                      onPin={togglePin}
                      onStar={toggleStar}
                      onReply={startReply}
                      onJumpToReply={jumpToMessage}
                    />
                  ))}
                {d?.typing && (
                  <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="bg-white border border-stone-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              {showScrollFab && (
                <button
                  onClick={() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="absolute bottom-2 right-3 w-9 h-9 bg-stone-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-stone-700 transition-colors z-10">
                  <ChevronDown size={18} />
                </button>
              )}
              </div>
              <ChatInput partnerName={pair.partnerNick || d.name} onSend={sendMessage} replyingTo={replyingTo} cancelReply={cancelReply} onTyping={notifyTyping} />
            </div>
          )}

          {reportOpen && d && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setReportOpen(false)}>
              <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-3 text-white">
                  <p className="text-sm font-semibold">Partner Report</p>
                  <button onClick={() => setReportOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-lg leading-none">✕</button>
                </div>
                <PartnerCard data={d} partnerNick={pair.partnerNick} />
                <button
                  onClick={() => { setReportOpen(false); navigate('/reports') }}
                  className="w-full mt-3 py-2.5 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-stone-800 transition-colors">
                  View Full Details →
                </button>
              </div>
            </div>
          )}

          {roomSettingsOpen && (
            <RoomSettingsModal
              pair={pair}
              d={d}
              onClose={() => setRoomSettingsOpen(false)}
              onCopy={() => { navigator.clipboard?.writeText(pair.roomCode); showToast('Code copied!', 'study-t') }}
              onShare={() => { navigator.share?.({ title: 'Join my study room', text: `Join me on Bubu Timer! Room code: ${pair.roomCode}` }).catch(() => navigator.clipboard?.writeText(pair.roomCode)); showToast('Shared!', 'study-t') }}
              onKick={() => { kickPartner(); setRoomSettingsOpen(false) }}
              onLeave={() => { disconnect(); setRoomSettingsOpen(false) }}
              onSaveNick={(nick) => { saveNickname(nick); setRoomSettingsOpen(false) }}
              onOpenPins={() => { setRoomSettingsOpen(false); navigate('/buddy/pins') }}
              onOpenStarred={() => { setRoomSettingsOpen(false); navigate('/buddy/starred') }}
              onOpenChecklists={() => { setRoomSettingsOpen(false); navigate('/buddy/checklists') }}
              onOpenReport={() => { setRoomSettingsOpen(false); setReportOpen(true) }}
            />
          )}
        </div>
      )}
    </div>
  )
}
