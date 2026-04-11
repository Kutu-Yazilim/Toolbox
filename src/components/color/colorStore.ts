import { openDB, type IDBPDatabase } from "idb"
import type { SavedPalette, SavedGradient } from "./colorTypes"

// ─── DB Setup ─────────────────────────────────────────────────────────────────

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB(): Promise<IDBPDatabase> {
    if (!dbPromise) {
        dbPromise = openDB("kutu-colors", 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains("palettes")) {
                    db.createObjectStore("palettes", { keyPath: "id" })
                }
                if (!db.objectStoreNames.contains("gradients")) {
                    db.createObjectStore("gradients", { keyPath: "id" })
                }
            },
        })
    }
    return dbPromise
}

// ─── Palettes ─────────────────────────────────────────────────────────────────

export async function getPalettes(): Promise<SavedPalette[]> {
    const db = await getDB()
    const all = await db.getAll("palettes")
    return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function savePalette(palette: SavedPalette): Promise<void> {
    const db = await getDB()
    await db.put("palettes", palette)
}

export async function updatePalette(palette: SavedPalette): Promise<void> {
    const db = await getDB()
    await db.put("palettes", palette)
}

export async function deletePalette(id: string): Promise<void> {
    const db = await getDB()
    await db.delete("palettes", id)
}

// ─── Gradients ────────────────────────────────────────────────────────────────

export async function getGradients(): Promise<SavedGradient[]> {
    const db = await getDB()
    const all = await db.getAll("gradients")
    return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function saveGradient(gradient: SavedGradient): Promise<void> {
    const db = await getDB()
    await db.put("gradients", gradient)
}

export async function updateGradient(gradient: SavedGradient): Promise<void> {
    const db = await getDB()
    await db.put("gradients", gradient)
}

export async function deleteGradient(id: string): Promise<void> {
    const db = await getDB()
    await db.delete("gradients", id)
}
