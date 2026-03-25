import { useState, useCallback } from "react"

const STORAGE_KEY = "recent-tools"
const MAX_RECENT = 5

function loadRecent(): string[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as string[]) : []
  } catch {
    return []
  }
}

export function useRecentTools(): [string[], (id: string) => void] {
  const [recentIds, setRecentIds] = useState<string[]>(loadRecent)

  const addRecent = useCallback((id: string) => {
    setRecentIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, MAX_RECENT)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return [recentIds, addRecent]
}
