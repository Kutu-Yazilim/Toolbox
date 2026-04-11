"use client"

import { useState, useEffect, useCallback } from "react"
import type { SavedPalette, SavedGradient } from "./colorTypes"
import * as colorStore from "./colorStore"

export function useColorStore() {
    const [loaded, setLoaded] = useState(false)
    const [palettes, setPalettes] = useState<SavedPalette[]>([])
    const [gradients, setGradients] = useState<SavedGradient[]>([])

    useEffect(() => {
        async function load() {
            const [p, g] = await Promise.all([
                colorStore.getPalettes(),
                colorStore.getGradients(),
            ])
            setPalettes(p)
            setGradients(g)
            setLoaded(true)
        }
        load()
    }, [])

    // ─── Palettes ─────────────────────────────────────────────────────────────

    const savePalette = useCallback(async (palette: SavedPalette) => {
        await colorStore.savePalette(palette)
        setPalettes(await colorStore.getPalettes())
    }, [])

    const updatePalette = useCallback(async (palette: SavedPalette) => {
        await colorStore.updatePalette(palette)
        setPalettes(await colorStore.getPalettes())
    }, [])

    const deletePalette = useCallback(async (id: string) => {
        await colorStore.deletePalette(id)
        setPalettes(await colorStore.getPalettes())
    }, [])

    // ─── Gradients ────────────────────────────────────────────────────────────

    const saveGradient = useCallback(async (gradient: SavedGradient) => {
        await colorStore.saveGradient(gradient)
        setGradients(await colorStore.getGradients())
    }, [])

    const updateGradient = useCallback(async (gradient: SavedGradient) => {
        await colorStore.updateGradient(gradient)
        setGradients(await colorStore.getGradients())
    }, [])

    const deleteGradient = useCallback(async (id: string) => {
        await colorStore.deleteGradient(id)
        setGradients(await colorStore.getGradients())
    }, [])

    return {
        loaded,
        palettes,
        savePalette,
        updatePalette,
        deletePalette,
        gradients,
        saveGradient,
        updateGradient,
        deleteGradient,
    }
}
