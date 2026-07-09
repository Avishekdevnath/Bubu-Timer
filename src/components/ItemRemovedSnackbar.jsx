export function ItemRemovedSnackbar({ item, onUndo, onClose }) {
  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-4 max-w-sm bg-stone-800 text-white rounded-xl p-4 shadow-lg z-50 flex items-center justify-between">
      <p className="text-sm font-medium">Removed: {item.subjectName}</p>
      <button onClick={onUndo} className="text-xs font-semibold text-amber-300 hover:text-amber-200 px-2 py-1">
        UNDO
      </button>
    </div>
  )
}