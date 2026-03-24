import { useState, useCallback } from "react"

const STORAGE_KEY = "favorite-tools"

function loadFavorites(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as string[]) : []
  } catch {
    return []
  }
}

export function useFavorites(): [
  string[],
  (id: string) => void,
  (id: string) => boolean,
] {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(loadFavorites)

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (id: string) => favoriteIds.includes(id),
    [favoriteIds]
  )

  return [favoriteIds, toggleFavorite, isFavorite]
}
