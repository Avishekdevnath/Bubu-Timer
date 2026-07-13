import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Star, X } from 'lucide-react'
import { cardUrl } from './vocabModel.js'
import { storageBucket } from '../../lib/firebase.js'

export function VocabLightbox({ cards, index, onClose, onNavigate, isFavorite, onToggleFavorite }) {
  const card = cards[index]
  const touchStartX = useRef(null)

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1)
      if (e.key === 'ArrowRight' && index < cards.length - 1) onNavigate(index + 1)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [index, cards.length, onClose, onNavigate])

  if (!card) return null

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(deltaX) < 50) return
    if (deltaX > 0 && index > 0) onNavigate(index - 1)
    if (deltaX < 0 && index < cards.length - 1) onNavigate(index + 1)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20">
        <X size={20} />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(card) }}
        className={`absolute top-4 left-4 p-2 rounded-full transition-colors ${
          isFavorite(card) ? 'bg-amber-400 text-white' : 'bg-white/10 text-white hover:bg-white/20'
        }`}
      >
        <Star size={18} fill={isFavorite(card) ? 'currentColor' : 'none'} />
      </button>

      {index > 0 ? (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(index - 1) }}
          className="absolute left-2 md:left-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <ChevronLeft size={24} />
        </button>
      ) : null}

      <img
        src={cardUrl(card.path, storageBucket)}
        alt={card.word}
        className="max-h-[90vh] max-w-[92vw] rounded-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {index < cards.length - 1 ? (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(index + 1) }}
          className="absolute right-2 md:right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <ChevronRight size={24} />
        </button>
      ) : null}
    </div>
  )
}
