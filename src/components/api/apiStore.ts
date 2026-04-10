import { openDB, type IDBPDatabase } from "idb"
import { type StoredRequest, type Collection, type HistoryEntry, HISTORY_LIMIT } from "./apiTypes"

// ─── DB Setup ─────────────────────────────────────────────────────────────────

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB(): Promise<IDBPDatabase> {
    if (!dbPromise) {
        dbPromise = openDB("kutu-api", 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains("requests")) {
                    db.createObjectStore("requests", { keyPath: "id" })
                }
                if (!db.objectStoreNames.contains("collections")) {
                    db.createObjectStore("collections", { keyPath: "id" })
                }
                if (!db.objectStoreNames.contains("history")) {
                    const historyStore = db.createObjectStore("history", { keyPath: "id" })
                    historyStore.createIndex("by-timestamp", "timestamp")
                }
            },
        })
    }
    return dbPromise
}

// ─── History ──────────────────────────────────────────────────────────────────

export async function getHistory(limit: number = HISTORY_LIMIT): Promise<HistoryEntry[]> {
    const db = await getDB()
    const all = await db.getAllFromIndex("history", "by-timestamp")
    return all.reverse().slice(0, limit)
}

export async function addHistory(entry: HistoryEntry): Promise<void> {
    const db = await getDB()
    await db.put("history", entry)

    const all = await db.getAllFromIndex("history", "by-timestamp")
    if (all.length > HISTORY_LIMIT) {
        const toDelete = all.slice(0, all.length - HISTORY_LIMIT)
        const tx = db.transaction("history", "readwrite")
        await Promise.all(toDelete.map((e: HistoryEntry) => tx.store.delete(e.id)))
        await tx.done
    }
}

export async function deleteHistory(id: string): Promise<void> {
    const db = await getDB()
    await db.delete("history", id)
}

export async function clearHistory(): Promise<void> {
    const db = await getDB()
    await db.clear("history")
}

// ─── Collections ──────────────────────────────────────────────────────────────

export async function getCollections(): Promise<Collection[]> {
    const db = await getDB()
    const all = await db.getAll("collections")
    return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function addCollection(collection: Collection): Promise<void> {
    const db = await getDB()
    await db.put("collections", collection)
}

export async function updateCollection(collection: Collection): Promise<void> {
    const db = await getDB()
    await db.put("collections", collection)
}

export async function deleteCollection(id: string): Promise<void> {
    const db = await getDB()
    const requests = await db.getAll("requests")
    const toDelete = requests.filter((r: StoredRequest) => r.collectionId === id)

    const tx = db.transaction(["collections", "requests"], "readwrite")
    await tx.objectStore("collections").delete(id)
    await Promise.all(toDelete.map((r: StoredRequest) => tx.objectStore("requests").delete(r.id)))
    await tx.done
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export async function getRequests(): Promise<StoredRequest[]> {
    const db = await getDB()
    const all = await db.getAll("requests")
    return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getRequestsByCollection(collectionId: string): Promise<StoredRequest[]> {
    const db = await getDB()
    const all = await db.getAll("requests")
    return all
        .filter((r: StoredRequest) => r.collectionId === collectionId)
        .sort((a: StoredRequest, b: StoredRequest) => b.updatedAt - a.updatedAt)
}

export async function saveRequest(request: StoredRequest): Promise<void> {
    const db = await getDB()
    await db.put("requests", request)
}

export async function updateRequest(request: StoredRequest): Promise<void> {
    const db = await getDB()
    await db.put("requests", request)
}

export async function deleteRequest(id: string): Promise<void> {
    const db = await getDB()
    await db.delete("requests", id)
}
