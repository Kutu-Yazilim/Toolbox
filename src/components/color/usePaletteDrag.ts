"use client"

import { useState, useCallback } from "react"
import type { PaletteColor } from "./colorTypes"

export function usePaletteDrag(
    colors: PaletteColor[],
    onReorder: (colors: PaletteColor[]) => void,
): {
    handleDragStart: (index: number) => void
    handleDragOver: (e: React.DragEvent, index: number) => void
    handleDrop: () => void
    handleDragEnd: () => void
    dragOverIndex: number | null
} {
    const [dragIndex, setDragIndex] = useState<number | null>(null)
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

    const handleDragStart = useCallback((index: number) => {
        setDragIndex(index)
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
        e.preventDefault()
        setDragOverIndex(index)
    }, [])

    const handleDrop = useCallback(() => {
        if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
            const next = [...colors]
            const [removed] = next.splice(dragIndex, 1)
            next.splice(dragOverIndex, 0, removed)
            onReorder(next)
        }
        setDragIndex(null)
        setDragOverIndex(null)
    }, [dragIndex, dragOverIndex, colors, onReorder])

    const handleDragEnd = useCallback(() => {
        setDragIndex(null)
        setDragOverIndex(null)
    }, [])

    return {
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd,
        dragOverIndex,
    }
}
