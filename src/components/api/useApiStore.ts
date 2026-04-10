"use client"
import { useState, useEffect, useCallback } from "react"
import { type StoredRequest, type Collection, type HistoryEntry } from "./apiTypes"
import * as apiStore from "./apiStore"

export function useApiStore() {
    const [loaded, setLoaded] = useState(false)
    const [history, setHistory] = useState<HistoryEntry[]>([])
    const [collections, setCollections] = useState<Collection[]>([])
    const [requests, setRequests] = useState<StoredRequest[]>([])

    useEffect(() => {
        async function load() {
            const [h, c, r] = await Promise.all([
                apiStore.getHistory(),
                apiStore.getCollections(),
                apiStore.getRequests(),
            ])
            setHistory(h)
            setCollections(c)
            setRequests(r)
            setLoaded(true)
        }
        load()
    }, [])

    // ─── History ──────────────────────────────────────────────────────────────

    const addHistory = useCallback(async (entry: HistoryEntry) => {
        await apiStore.addHistory(entry)
        setHistory(await apiStore.getHistory())
    }, [])

    const deleteHistory = useCallback(async (id: string) => {
        await apiStore.deleteHistory(id)
        setHistory(await apiStore.getHistory())
    }, [])

    const clearHistory = useCallback(async () => {
        await apiStore.clearHistory()
        setHistory([])
    }, [])

    // ─── Collections ──────────────────────────────────────────────────────────

    const addCollection = useCallback(async (collection: Collection) => {
        await apiStore.addCollection(collection)
        setCollections(await apiStore.getCollections())
    }, [])

    const updateCollection = useCallback(async (collection: Collection) => {
        await apiStore.updateCollection(collection)
        setCollections(await apiStore.getCollections())
    }, [])

    const deleteCollection = useCallback(async (id: string) => {
        await apiStore.deleteCollection(id)
        const [c, r] = await Promise.all([apiStore.getCollections(), apiStore.getRequests()])
        setCollections(c)
        setRequests(r)
    }, [])

    // ─── Requests ─────────────────────────────────────────────────────────────

    const saveRequest = useCallback(async (request: StoredRequest) => {
        await apiStore.saveRequest(request)
        setRequests(await apiStore.getRequests())
    }, [])

    const updateRequest = useCallback(async (request: StoredRequest) => {
        await apiStore.updateRequest(request)
        setRequests(await apiStore.getRequests())
    }, [])

    const deleteRequest = useCallback(async (id: string) => {
        await apiStore.deleteRequest(id)
        setRequests(await apiStore.getRequests())
    }, [])

    const getRequestsByCollection = useCallback(
        (collectionId: string): StoredRequest[] =>
            requests.filter((r) => r.collectionId === collectionId),
        [requests],
    )

    return {
        loaded,
        history,
        addHistory,
        deleteHistory,
        clearHistory,
        collections,
        addCollection,
        updateCollection,
        deleteCollection,
        requests,
        saveRequest,
        updateRequest,
        deleteRequest,
        getRequestsByCollection,
    }
}
