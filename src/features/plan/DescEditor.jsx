import { useState } from 'react'

export function DescEditor({ value, onChange, placeholder }) {
  const [addingItem, setAddingItem] = useState(false)
  const [newItem, setNewItem] = useState('')

  function appendItem() {
    const text = newItem.trim()
    if (!text) { setAddingItem(false); return }
    const current = value.trim()
    onChange(current ? `${current}\n• ${text}` : `• ${text}`)
    setNewItem('')
    setAddingItem(false)
  }

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Notes, topics, pages to cover…'}
        rows={3}
        className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-400 resize-none leading-relaxed"
      />
      {addingItem ? (
        <div className="flex items-center gap-2">
          <span className="text-stone-400 text-base leading-none flex-shrink-0">•</span>
          <input
            autoFocus
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') appendItem()
              if (e.key === 'Escape') { setAddingItem(false); setNewItem('') }
            }}
            placeholder="Checklist item…"
            className="flex-1 text-sm border border-stone-200 rounded-lg px-2 py-1.5 outline-none focus:border-stone-400"
          />
          <button onClick={appendItem} className="text-xs px-2.5 py-1.5 bg-stone-900 text-white rounded-lg font-medium">Add</button>
          <button onClick={() => { setAddingItem(false); setNewItem('') }} className="text-xs text-stone-400 hover:text-stone-600">✕</button>
        </div>
      ) : (
        <button onClick={() => setAddingItem(true)}
          className="text-xs text-stone-400 hover:text-stone-700 flex items-center gap-1 font-medium">
          <span className="text-sm leading-none">+</span> Add checklist item
        </button>
      )}
    </div>
  )
}
