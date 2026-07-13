export function lettersWithCards(manifest) {
  return [...new Set(manifest.map((c) => c.letter))].sort()
}

export function cardsForLetter(manifest, letter) {
  return manifest.filter((c) => c.letter === letter)
}

export function favoriteKey(card) {
  return `${card.letter}/${card.word}`
}

export function favoritedCards(manifest, favorites) {
  const set = new Set(favorites || [])
  return manifest.filter((c) => set.has(favoriteKey(c)))
}

export function cardUrl(path, bucket) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`
}

export function toggleFavorite(favorites, key) {
  const set = new Set(favorites || [])
  if (set.has(key)) set.delete(key)
  else set.add(key)
  return [...set]
}
