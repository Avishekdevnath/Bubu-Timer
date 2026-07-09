import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false)

  async function copy(e) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* clipboard unavailable — silently ignore */ }
  }

  return (
    <button onClick={copy} aria-label={label || `Copy ${value}`}
      className="p-1 rounded-md text-stone-300 hover:text-stone-600 hover:bg-stone-100 shrink-0" title="Copy">
      {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
    </button>
  )
}
