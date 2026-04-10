"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { XIcon, PlusIcon, ChevronRightIcon, ChevronDownIcon, PencilIcon, SaveIcon } from "lucide-react"
import { type Collection, type StoredRequest, METHOD_COLORS_MUTED } from "./apiTypes"

interface CollectionsDrawerProps {
    open: boolean
    onClose: () => void
    collections: Collection[]
    getRequestsByCollection: (id: string) => StoredRequest[]
    onSelectRequest: (request: StoredRequest) => void
    onDeleteRequest: (id: string) => void
    onAddCollection: (name: string) => void
    onDeleteCollection: (id: string) => void
    onRenameCollection: (id: string, name: string) => void
    onSaveCurrent: (name: string, collectionId: string) => void
}

export function CollectionsDrawer({
    open,
    onClose,
    collections,
    getRequestsByCollection,
    onSelectRequest,
    onDeleteRequest,
    onAddCollection,
    onDeleteCollection,
    onRenameCollection,
    onSaveCurrent,
}: CollectionsDrawerProps) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    const [showNewCollection, setShowNewCollection] = useState(false)
    const [newCollectionName, setNewCollectionName] = useState("")
    const [showSaveCurrent, setShowSaveCurrent] = useState(false)
    const [saveCurrentName, setSaveCurrentName] = useState("")
    const [saveCurrentCollectionId, setSaveCurrentCollectionId] = useState("")
    const [renamingId, setRenamingId] = useState<string | null>(null)
    const [renameValue, setRenameValue] = useState("")

    function toggleExpanded(id: string) {
        setExpanded(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    function handleAddCollection() {
        const name = newCollectionName.trim()
        if (!name) return
        onAddCollection(name)
        setNewCollectionName("")
        setShowNewCollection(false)
    }

    function handleSaveCurrent() {
        const name = saveCurrentName.trim()
        if (!name || !saveCurrentCollectionId) return
        onSaveCurrent(name, saveCurrentCollectionId)
        setSaveCurrentName("")
        setSaveCurrentCollectionId("")
        setShowSaveCurrent(false)
    }

    function startRename(collection: Collection) {
        setRenamingId(collection.id)
        setRenameValue(collection.name)
    }

    function commitRename() {
        if (renamingId && renameValue.trim()) {
            onRenameCollection(renamingId, renameValue.trim())
        }
        setRenamingId(null)
        setRenameValue("")
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-card border-l border-border w-full max-w-xs h-full flex flex-col shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
                    <h3 className="text-sm font-semibold text-foreground">Collections</h3>
                    <Button variant="ghost" size="icon-xs" onClick={onClose}>
                        <XIcon className="h-3 w-3" />
                    </Button>
                </div>

                <div className="px-3 py-2 border-b border-border flex-shrink-0 space-y-2">
                    {showNewCollection ? (
                        <div className="flex items-center gap-1.5">
                            <input
                                type="text"
                                value={newCollectionName}
                                onChange={e => setNewCollectionName(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === "Enter") handleAddCollection()
                                    if (e.key === "Escape") setShowNewCollection(false)
                                }}
                                placeholder="Collection name..."
                                className="flex-1 bg-muted/30 border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/50"
                                autoFocus
                            />
                            <Button variant="ghost" size="icon-xs" onClick={handleAddCollection}>
                                <PlusIcon className="h-3 w-3" />
                            </Button>
                        </div>
                    ) : (
                        <Button variant="ghost" size="xs" className="w-full justify-start" onClick={() => setShowNewCollection(true)}>
                            <PlusIcon className="h-3 w-3 mr-1" />
                            <span className="text-[10px]">New Collection</span>
                        </Button>
                    )}

                    {showSaveCurrent ? (
                        <div className="space-y-1.5">
                            <input
                                type="text"
                                value={saveCurrentName}
                                onChange={e => setSaveCurrentName(e.target.value)}
                                placeholder="Request name..."
                                className="w-full bg-muted/30 border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/50"
                                autoFocus
                            />
                            <select
                                value={saveCurrentCollectionId}
                                onChange={e => setSaveCurrentCollectionId(e.target.value)}
                                className="w-full bg-muted/30 border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none"
                            >
                                <option value="">Select collection...</option>
                                {collections.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <Button variant="ghost" size="xs" className="w-full" onClick={handleSaveCurrent} disabled={!saveCurrentName.trim() || !saveCurrentCollectionId}>
                                <SaveIcon className="h-3 w-3 mr-1" />
                                <span className="text-[10px]">Save</span>
                            </Button>
                        </div>
                    ) : (
                        <Button variant="ghost" size="xs" className="w-full justify-start" onClick={() => setShowSaveCurrent(true)}>
                            <SaveIcon className="h-3 w-3 mr-1" />
                            <span className="text-[10px]">Save Current</span>
                        </Button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {collections.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">No collections yet</div>
                    ) : (
                        collections.map(collection => {
                            const isExpanded = expanded.has(collection.id)
                            const requests = isExpanded ? getRequestsByCollection(collection.id) : []

                            return (
                                <div key={collection.id}>
                                    <div
                                        className="group flex items-center gap-1.5 px-3 py-2 hover:bg-muted/50 transition-colors cursor-pointer"
                                        onClick={() => toggleExpanded(collection.id)}
                                    >
                                        {isExpanded
                                            ? <ChevronDownIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                            : <ChevronRightIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                        }
                                        {renamingId === collection.id ? (
                                            <input
                                                type="text"
                                                value={renameValue}
                                                onChange={e => setRenameValue(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === "Enter") commitRename()
                                                    if (e.key === "Escape") { setRenamingId(null); setRenameValue("") }
                                                }}
                                                onBlur={commitRename}
                                                onClick={e => e.stopPropagation()}
                                                className="flex-1 bg-muted/30 border border-border rounded px-1.5 py-0.5 text-xs text-foreground outline-none"
                                                autoFocus
                                            />
                                        ) : (
                                            <span className="flex-1 text-xs font-medium text-foreground truncate">
                                                {collection.name}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                            {getRequestsByCollection(collection.id).length}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon-xs"
                                            className="opacity-0 group-hover:opacity-100 flex-shrink-0"
                                            onClick={e => {
                                                e.stopPropagation()
                                                startRename(collection)
                                            }}
                                        >
                                            <PencilIcon className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon-xs"
                                            className="opacity-0 group-hover:opacity-100 flex-shrink-0"
                                            onClick={e => {
                                                e.stopPropagation()
                                                onDeleteCollection(collection.id)
                                            }}
                                        >
                                            <XIcon className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    {isExpanded && (
                                        <div className="pl-6">
                                            {requests.length === 0 ? (
                                                <div className="px-3 py-2 text-[10px] text-muted-foreground">No requests</div>
                                            ) : (
                                                requests.map(request => (
                                                    <div
                                                        key={request.id}
                                                        className="group flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50 transition-colors cursor-pointer"
                                                        onClick={() => onSelectRequest(request)}
                                                    >
                                                        <span className={`text-[10px] font-bold flex-shrink-0 w-10 ${METHOD_COLORS_MUTED[request.method] ?? "text-muted-foreground"}`}>
                                                            {request.method}
                                                        </span>
                                                        <span className="flex-1 text-[11px] text-foreground truncate">
                                                            {request.name || request.url}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            className="opacity-0 group-hover:opacity-100 flex-shrink-0"
                                                            onClick={e => {
                                                                e.stopPropagation()
                                                                onDeleteRequest(request.id)
                                                            }}
                                                        >
                                                            <XIcon className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
