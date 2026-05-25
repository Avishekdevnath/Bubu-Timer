import { Check, CheckCheck, Pin, Reply, Star } from 'lucide-react'
import { MessageContent } from './MessageContent.jsx'

export function ChatMessage({
  msg, idx, isMe, myUid, blurred, msgRef,
  activeReactionId, setActiveReactionId,
  editingMsgId, editText, setEditText, setEditingMsgId,
  isPinned, isStarred, partnerLastReadTs,
  onReact, onEdit, onCopy, onDeleteForMe, onDeleteForEveryone,
  onPin, onStar, onReply, onJumpToReply,
}) {
  const isRead = isMe && partnerLastReadTs && msg.ts && partnerLastReadTs >= msg.ts
  const myEmoji = msg.reactions?.[myUid] || null
  const reactionCounts = msg.reactions
    ? Object.values(msg.reactions).reduce((acc, e) => { acc[e] = (acc[e] || 0) + 1; return acc }, {})
    : {}
  const reactionEntries = Object.entries(reactionCounts)
  const isEditing = editingMsgId === msg.id

  return (
    <div ref={msgRef} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${blurred ? 'select-none' : ''} transition-all duration-500 rounded-2xl`}>
      <div className="relative">
        {isEditing ? (
          <div className="flex flex-col gap-1.5 bg-white border-2 border-stone-400 rounded-2xl p-2 shadow-md">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              autoFocus
              className="w-72 max-w-[80vw] px-2 py-1 text-[14px] outline-none resize-none text-stone-800"
            />
            <div className="flex gap-1 justify-end">
              <button onClick={() => { setEditingMsgId(null); setEditText('') }}
                className="px-3 py-1 text-xs font-semibold text-stone-500 hover:bg-stone-100 rounded-lg">Cancel</button>
              <button onClick={() => { onEdit(msg.id, editText); setEditingMsgId(null); setEditText('') }}
                className="px-3 py-1 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800">Save</button>
            </div>
          </div>
        ) : (
          <div
            data-msg-bubble
            onClick={() => setActiveReactionId(activeReactionId === msg.id ? null : msg.id)}
            className={`max-w-[72vw] md:max-w-md px-4 py-3 text-[14px] leading-snug shadow-sm cursor-pointer transition-all active:scale-[0.98] break-words ${
              isMe ? 'bg-stone-900 text-white rounded-2xl rounded-tr-sm' : 'bg-white text-stone-800 border border-stone-100 rounded-2xl rounded-tl-sm'
            } ${blurred ? 'blur-sm pointer-events-none' : ''}`}
            style={{ overflowWrap: 'anywhere' }}>
            {/* Quoted reply preview inside bubble */}
            {msg.replyTo && (
              <div
                onClick={(e) => { e.stopPropagation(); onJumpToReply && onJumpToReply(msg.replyTo.id) }}
                className={`text-xs mb-2 p-2 rounded-lg border-l-2 cursor-pointer ${isMe ? 'bg-white/10 border-white/40 text-white/85' : 'bg-stone-50 border-stone-300 text-stone-600'}`}>
                <span className="font-bold block mb-0.5 text-[10px] uppercase tracking-wider">{msg.replyTo.name}</span>
                <p className="truncate opacity-90">{msg.replyTo.text}</p>
              </div>
            )}

            <MessageContent text={msg.text} />

            {/* Pin/Star badges */}
            {(isPinned || isStarred) && (
              <div className={`flex gap-1.5 mt-1.5 justify-end items-center opacity-80 ${isMe ? 'text-stone-300' : 'text-stone-400'}`}>
                {isStarred && <Star size={10} className="fill-current text-yellow-400" />}
                {isPinned && <Pin size={10} className="fill-current" />}
              </div>
            )}
          </div>
        )}
        {activeReactionId === msg.id && !isEditing && (
          <div data-reaction-picker className={`absolute ${idx < 2 ? 'top-full mt-2' : 'bottom-full mb-2'} ${isMe ? 'right-0' : 'left-0'} bg-white shadow-lg border border-stone-100 rounded-2xl p-1.5 flex flex-col gap-1 z-50 min-w-[240px]`}>
            <div className="flex gap-1 px-1">
              {['👍','❤️','😂','😮','😢','🔥'].map(emoji => {
                const isSelected = myEmoji === emoji
                return (
                  <button key={emoji}
                    onClick={(e) => { e.stopPropagation(); onReact(msg.id, emoji, myEmoji) }}
                    className={`w-7 h-7 flex items-center justify-center rounded-full hover:scale-110 transition-all text-base ${isSelected ? 'bg-stone-200 ring-2 ring-stone-800' : 'hover:bg-stone-50'}`}>
                    {emoji}
                  </button>
                )
              })}
            </div>
            <div className="border-t border-stone-100 mt-0.5 pt-1 flex flex-col">
              <button onClick={() => onReply(msg)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 rounded-lg text-left">
                <Reply size={13} /> Reply
              </button>
              <button onClick={() => onPin(msg.id)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 rounded-lg text-left">
                <Pin size={13} className={isPinned ? 'fill-current' : ''} /> {isPinned ? 'Unpin' : 'Pin for both'}
              </button>
              <button onClick={() => onStar(msg.id)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 rounded-lg text-left">
                <Star size={13} className={isStarred ? 'fill-yellow-400 text-yellow-500' : ''} /> {isStarred ? 'Unstar' : 'Star for me'}
              </button>
              <button onClick={() => onCopy(msg.text)}
                className="px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 rounded-lg text-left">
                📋 Copy text
              </button>
              {isMe && (
                <button onClick={() => { setEditingMsgId(msg.id); setEditText(msg.text); setActiveReactionId(null) }}
                  className="px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 rounded-lg text-left">
                  ✏️ Edit
                </button>
              )}
              <button onClick={() => onDeleteForMe(msg.id)}
                className="px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 rounded-lg text-left">
                🙈 Delete for me
              </button>
              {isMe && (
                <button onClick={() => onDeleteForEveryone(msg.id)}
                  className="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg text-left">
                  🗑 Delete for everyone
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <div className={`flex items-center gap-1.5 mt-1 px-1 ${isMe ? 'flex-row-reverse' : ''} ${blurred ? 'blur-sm' : ''}`}>
        <span className="text-[10px] text-stone-400 flex items-center gap-1">
          {msg.ts ? new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          {isMe && (isRead
            ? <CheckCheck size={12} className="text-blue-500" />
            : <Check size={12} className="text-stone-400" />
          )}
        </span>
        {msg.editedAt && <span className="text-[10px] text-stone-400 italic">edited</span>}
        {reactionEntries.length > 0 && reactionEntries.map(([emoji, count]) => {
          const mine = myEmoji === emoji
          return (
            <button
              key={emoji}
              onClick={(e) => { e.stopPropagation(); onReact(msg.id, emoji, myEmoji) }}
              className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-[1px] text-[11px] shadow-sm transition-colors ${mine ? 'bg-stone-200 border border-stone-400' : 'bg-white border border-stone-100 hover:bg-stone-50'}`}
              title={mine ? 'Tap to remove' : 'Tap to add'}>
              <span>{emoji}</span>
              {count > 1 && <span className="font-semibold text-stone-600 ml-0.5">{count}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
