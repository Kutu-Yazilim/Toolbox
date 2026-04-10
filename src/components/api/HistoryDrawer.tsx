"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { XIcon, SearchIcon, Trash2Icon } from "lucide-react"
import { type HistoryEntry, METHOD_COLORS_MUTED } from "./apiTypes"
import { formatTimeAgo } from "./apiUtils"
import { StatusBadge } from "./StatusBadge"

interface HistoryDrawerProps {
    open: boolean
    onClose: () => void
    history: HistoryEntry[]
    onSelect: (entry: HistoryEntry) => void
    onDelete: (id: string) => void
    onClear: () => void
}

export function HistoryDrawer({ open, onClose, history, onSelect, onDelete, onClear }: HistoryDrawerProps) {
    const [search, setSearch] = useState("")

    const filtered = useMemo(() => {
        if (!search.trim()) return history
        const q = search.toLowerCase()
        return history.filter(entry =>
            entry.url.toLowerCase().includes(q) ||
            entry.method.toLowerCase().includes(q)
        )
    }, [history, search])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-card border-l border-border w-full max-w-xs h-full flex flex-col shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
                    <h3 className="text-sm font-semibold text-foreground">History</h3>
                    <Button variant="ghost" size="icon-xs" onClick={onClose}>
                        <XIcon className="h-3 w-3" />
                    </Button>
                </div>

                <div className="px-3 py-2 border-b border-border flex-shrink-0">
                    <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-md px-2 py-1.5">
                        <SearchIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Filter by URL or method..."
                            className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/50"
                            spellCheck={false}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">No history entries</div>
                    ) : (
                        filtered.map(entry => (
                            <div
                                key={entry.id}
                                className="group flex items-center gap-2 px-4 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => onSelect(entry)}
                            >
                                <span className={`text-[10px] font-bold flex-shrink-0 w-10 ${METHOD_COLORS_MUTED[entry.method] ?? "text-muted-foreground"}`}>
                                    {entry.method}
                                </span>
                                <span className="flex-1 font-mono text-[11px] text-foreground truncate">
                                    {entry.url}
                                </span>
                                <StatusBadge status={entry.status} />
                                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                    {formatTimeAgo(entry.timestamp)}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    className="opacity-0 group-hover:opacity-100 flex-shrink-0"
                                    onClick={e => {
                                        e.stopPropagation()
                                        onDelete(entry.id)
                                    }}
                                >
                                    <XIcon className="h-3 w-3" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex items-center justify-between px-4 py-2.5 border-t border-border flex-shrink-0">
                    <span className="text-[10px] text-muted-foreground">
                        {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
                    </span>
                    <Button
                        variant="ghost"
                        size="xs"
                        className="text-destructive hover:text-destructive"
                        onClick={onClear}
                        disabled={history.length === 0}
                    >
                        <Trash2Icon className="h-3 w-3 mr-1" />
                        <span className="text-[10px]">Clear all</span>
                    </Button>
                </div>
            </div>
        </div>
    )
}
