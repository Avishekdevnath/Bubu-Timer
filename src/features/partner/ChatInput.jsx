import { useLayoutEffect, useRef, useState } from 'react'
import { Reply, X } from 'lucide-react'

const MIN_HEIGHT = 40   // ~1 line
const MAX_HEIGHT = 140  // ~5-6 lines, then scroll

export function ChatInput({ partnerName, onSend, replyingTo, cancelReply, onTyping }) {
  const [val, setVal] = useState('')
  const [composing, setComposing] = useState(false)
  const taRef = useRef(null)

  // Auto-grow on content change
  useLayoutEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = `${MIN_HEIGHT}px` // reset first to shrink when deleting
    const next = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, ta.scrollHeight))
    ta.style.height = `${next}px`
    ta.style.overflowY = ta.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden'
  }, [val])

  function submit(e) {
    if (e) e.preventDefault()
    if (!val.trim()) return
    onSend(val)
    setVal('')
  }

  function onKeyDown(e) {
    // Ctrl/Cmd + Enter sends. Plain Enter inserts newline.
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !composing) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex-shrink-0 mt-2">
    {replyingTo && (
      <div className="bg-stone-100/90 backdrop-blur-md border border-stone-200 rounded-xl p-2.5 flex justify-between items-center shadow-sm mb-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
        <div className="flex flex-col overflow-hidden text-sm flex-1 mr-3">
          <span className="font-bold text-stone-700 flex items-center gap-1.5 mb-0.5 text-[11px] uppercase tracking-wider">
            <Reply size={11}/> Replying to {replyingTo.senderName || 'message'}
          </span>
          <span className="text-stone-500 truncate text-xs">
            {(replyingTo.text || '').slice(0, 100) || '(message)'}
          </span>
        </div>
        <button onClick={cancelReply} className="text-stone-400 hover:text-stone-700 bg-white rounded-full p-1 shadow-sm transition-colors flex-shrink-0">
          <X size={14}/>
        </button>
      </div>
    )}
    <form onSubmit={submit} className="flex gap-2 items-end bg-white border border-stone-200 shadow-sm p-2 rounded-2xl">
      <textarea
        ref={taRef}
        value={val}
        onChange={(e) => { setVal(e.target.value); if (e.target.value.trim() && onTyping) onTyping() }}
        onKeyDown={onKeyDown}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={() => setComposing(false)}
        placeholder={`Message ${partnerName || 'partner'}…`}
        rows={1}
        className="flex-1 bg-transparent px-3 py-2 text-[14px] outline-none text-stone-800 placeholder:text-stone-400 resize-none leading-snug chat-scroll"
        style={{ height: MIN_HEIGHT, overflowWrap: 'anywhere' }}
      />
      <button
        type="submit"
        disabled={!val.trim()}
        className="w-9 h-9 bg-stone-900 text-white rounded-xl flex items-center justify-center hover:bg-stone-800 disabled:opacity-40 transition-colors flex-shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
      </button>
    </form>
    <p className="text-[10px] text-stone-400 mt-1 px-2">
      <span className="font-semibold">**bold**</span> · <span className="italic">_italic_</span> · <span className="line-through">~~strike~~</span> · <code className="bg-stone-100 px-1 rounded">`code`</code> · Tap send (or Ctrl+Enter)
    </p>
    </div>
  )
}
