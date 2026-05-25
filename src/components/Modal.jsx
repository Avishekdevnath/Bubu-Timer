export function Modal({ title, children, onClose }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-stone-900">{title}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function BreakPrompt({ minutes, onAccept, onReject, onStopSound }) {
  return (
    <div className="break-overlay">
      <div className="break-card">
        <div className="flex items-center justify-between mb-1">
          <p className="text-lg font-bold text-stone-900">Session Done! 🎉</p>
          <button onClick={onStopSound} type="button"
            className="text-stone-400 hover:text-stone-700 text-xl leading-none px-1" title="Stop sound">
            🔕
          </button>
        </div>
        <p className="text-sm text-stone-500 mb-6">
          Take a {minutes}-min break now, or bank it for later?
        </p>
        <div className="flex gap-3">
          <button onClick={onAccept} type="button"
            className="flex-1 py-3.5 bg-stone-900 text-white text-sm font-bold rounded-2xl hover:bg-stone-800 transition-colors shadow-md">
            Take Break
          </button>
          <button onClick={onReject} type="button"
            className="flex-1 py-3.5 bg-white border border-stone-200 text-stone-700 text-sm font-bold rounded-2xl hover:bg-stone-50 transition-colors">
            Bank It
          </button>
        </div>
      </div>
    </div>
  )
}
