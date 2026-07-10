import { useState } from 'react'
import { markdownToHtml } from './emailFormat.js'

export function FormattedTextarea({ value, onChange, rows = 8, placeholder, maxLength }) {
  const [tab, setTab] = useState('write')

  return (
    <div>
      <div className="flex gap-1 mb-1.5">
        <button type="button" onClick={() => setTab('write')}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
            tab === 'write' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-100'
          }`}>
          Write
        </button>
        <button type="button" onClick={() => setTab('preview')}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
            tab === 'preview' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-100'
          }`}>
          Preview
        </button>
      </div>
      {tab === 'write' ? (
        <textarea className="field-in resize-y" rows={rows} placeholder={placeholder} maxLength={maxLength}
          value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div className="field-in overflow-y-auto text-sm text-stone-700" style={{ minHeight: `${rows * 1.6}em` }}>
          {value.trim()
            ? <div dangerouslySetInnerHTML={{ __html: markdownToHtml(value) }} />
            : <p className="text-stone-300">Nothing to preview</p>}
        </div>
      )}
    </div>
  )
}
