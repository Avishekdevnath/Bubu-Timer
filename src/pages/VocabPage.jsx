import { useEffect, useRef, useState } from 'react'
import { Star } from 'lucide-react'
import manifest from '../features/vocab/vocabManifest.json'
import { lettersWithCards, cardsForLetter, favoritedCards, favoriteKey, cardUrl, toggleFavorite } from '../features/vocab/vocabModel.js'
import { storageBucket } from '../lib/firebase.js'
import { VocabLightbox } from '../features/vocab/VocabLightbox.jsx'

const BATCH_SIZE = 40
const LETTERS = lettersWithCards(manifest)

export function VocabPage({ appState, patchState }) {
  const [selected, setSelected] = useState(LETTERS[0] || null)
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const sentinelRef = useRef(null)

  const favorites = appState.vocabFavorites || []
  const isFavoritesView = selected === 'favorites'
  const cards = isFavoritesView ? favoritedCards(manifest, favorites) : cardsForLetter(manifest, selected)
  const visibleCards = isFavoritesView ? cards : cards.slice(0, visibleCount)

  useEffect(() => {
    setVisibleCount(BATCH_SIZE)
  }, [selected])

  useEffect(() => {
    if (isFavoritesView || !sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((count) => Math.min(count + BATCH_SIZE, cards.length))
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [isFavoritesView, cards.length, selected])

  function toggleCardFavorite(card) {
    patchState((s) => ({ ...s, vocabFavorites: toggleFavorite(s.vocabFavorites || [], favoriteKey(card)) }))
  }

  return (
    <div className="w-full px-4 md:px-6 pt-6">
      <div className="mb-5">
        <h2 className="text-2xl font-light tracking-tight text-stone-800">Vocab</h2>
        <p className="text-sm text-stone-500 mt-0.5">{manifest.length} cards</p>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        <button
          onClick={() => setSelected('favorites')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1 ${
            isFavoritesView ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          <Star size={12} fill={isFavoritesView ? 'currentColor' : 'none'} /> Favorites
        </button>
        {LETTERS.map((letter) => (
          <button
            key={letter}
            onClick={() => setSelected(letter)}
            className={`w-8 h-8 rounded-full text-xs font-semibold border transition-colors ${
              selected === letter ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {letter}
          </button>
        ))}
      </div>

      {!cards.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-stone-400">
          <p className="text-sm">{isFavoritesView ? 'No favorites yet — tap the star on a card.' : 'No cards for this letter.'}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {visibleCards.map((card, i) => (
              <VocabCard
                key={favoriteKey(card)}
                card={card}
                isFavorite={favorites.includes(favoriteKey(card))}
                onToggleFavorite={() => toggleCardFavorite(card)}
                onOpen={() => setLightboxIndex(i)}
              />
            ))}
          </div>
          {!isFavoritesView && visibleCount < cards.length ? <div ref={sentinelRef} className="h-8" /> : null}
        </>
      )}

      {lightboxIndex !== null ? (
        <VocabLightbox
          cards={visibleCards}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
          isFavorite={(card) => favorites.includes(favoriteKey(card))}
          onToggleFavorite={toggleCardFavorite}
        />
      ) : null}
    </div>
  )
}

function VocabCard({ card, isFavorite, onToggleFavorite, onOpen }) {
  return (
    <div className="relative rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden cursor-pointer group" onClick={onOpen}>
      <img src={cardUrl(card.path, storageBucket)} alt={card.word} loading="lazy" className="w-full aspect-[9/11] object-cover" />
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
        className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-colors ${
          isFavorite ? 'bg-amber-400 text-white' : 'bg-white/80 text-stone-400 hover:text-amber-500'
        }`}
      >
        <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
      <p className="px-2 py-1.5 text-xs font-medium text-stone-700 truncate">{card.word}</p>
    </div>
  )
}
