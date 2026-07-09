export function AppModal({ title, onClose, children, wide }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className={`modal-box${wide ? ' modal-box--wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-stone-900">{title}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
