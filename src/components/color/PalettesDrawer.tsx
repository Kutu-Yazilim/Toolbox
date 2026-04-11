"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { XIcon, SearchIcon, PlusIcon, CheckIcon } from "lucide-react"
import type { SavedPalette } from "./colorTypes"

interface PalettesDrawerProps {
    open: boolean
    onClose: () => void
    palettes: SavedPalette[]
    onSave: (name: string) => void
    onLoad: (palette: SavedPalette) => void
    onDelete: (id: string) => void
    onRename: (id: string, name: string) => void
}

export function PalettesDrawer({
    open,
    onClose,
    palettes,
    onSave,
    onLoad,
    onDelete,
    onRename,
}: PalettesDrawerProps) {
    const [search, setSearch] = useState("")
    const [saving, setSaving] = useState(false)
    const [saveName, setSaveName] = useState("")
    const [renamingId, setRenamingId] = useState<string | null>(null)
    const [renameValue, setRenameValue] = useState("")

    const saveInputRef = useRef<HTMLInputElement>(null)
    const renameInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (saving) saveInputRef.current?.focus()
    }, [saving])

    useEffect(() => {
        if (renamingId) renameInputRef.current?.focus()
    }, [renamingId])

    const filtered = useMemo(() => {
        if (!search.trim()) return palettes
        const q = search.toLowerCase()
        return palettes.filter(p => p.name.toLowerCase().includes(q))
    }, [palettes, search])

    const handleSave = () => {
        const trimmed = saveName.trim()
        if (!trimmed) return
        onSave(trimmed)
        setSaveName("")
        setSaving(false)
    }

    const handleRename = (id: string) => {
        const trimmed = renameValue.trim()
        if (!trimmed) {
            setRenamingId(null)
            return
        }
        onRename(id, trimmed)
        setRenamingId(null)
    }

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-card border-l border-border w-full max-w-xs h-full flex flex-col shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
                    <h3 className="text-sm font-semibold text-foreground">Saved Palettes</h3>
                    <Button variant="ghost" size="icon-xs" onClick={onClose}>
                        <XIcon className="h-3 w-3" />
                    </Button>
                </div>

                {/* Save section */}
                <div className="px-3 py-2 border-b border-border flex-shrink-0">
                    {saving ? (
                        <div className="flex items-center gap-2">
                            <input
                                ref={saveInputRef}
                                type="text"
                                value={saveName}
                                onChange={e => setSaveName(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === "Enter") handleSave()
                                    if (e.key === "Escape") {
                                        setSaving(false)
                                        setSaveName("")
                                    }
                                }}
                                placeholder="Palette name..."
                                className="flex-1 bg-muted/30 border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/50"
                                spellCheck={false}
                            />
                            <Button variant="ghost" size="icon-xs" onClick={handleSave}>
                                <CheckIcon className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => {
                                    setSaving(false)
                                    setSaveName("")
                                }}
                            >
                                <XIcon className="h-3 w-3" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="ghost"
                            size="xs"
                            className="w-full justify-start"
                            onClick={() => setSaving(true)}
                        >
                            <PlusIcon className="h-3 w-3 mr-1.5" />
                            <span className="text-xs">Save Current</span>
                        </Button>
                    )}
                </div>

                {/* Search */}
                <div className="px-3 py-2 border-b border-border flex-shrink-0">
                    <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-md px-2 py-1.5">
                        <SearchIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search palettes..."
                            className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/50"
                            spellCheck={false}
                        />
                    </div>
                </div>

                {/* Palette list */}
                <div className="flex-1 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                            No palettes found
                        </div>
                    ) : (
                        filtered.map(palette => (
                            <div
                                key={palette.id}
                                className="group relative w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => onLoad(palette)}
                            >
                                {/* Color preview strip */}
                                <div className="flex gap-0.5 mb-1.5">
                                    {palette.colors.map((color, i) => (
                                        <div
                                            key={i}
                                            className="h-4 flex-1 first:rounded-l-sm last:rounded-r-sm"
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>

                                {/* Name row */}
                                <div className="flex items-center justify-between">
                                    {renamingId === palette.id ? (
                                        <input
                                            ref={renameInputRef}
                                            type="text"
                                            value={renameValue}
                                            onChange={e => setRenameValue(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === "Enter") handleRename(palette.id)
                                                if (e.key === "Escape") setRenamingId(null)
                                            }}
                                            onBlur={() => handleRename(palette.id)}
                                            onClick={e => e.stopPropagation()}
                                            className="flex-1 bg-muted/30 border border-border rounded px-1.5 py-0.5 text-xs text-foreground outline-none"
                                            spellCheck={false}
                                        />
                                    ) : (
                                        <span
                                            className="text-xs font-medium text-foreground cursor-text hover:underline"
                                            onClick={e => {
                                                e.stopPropagation()
                                                setRenamingId(palette.id)
                                                setRenameValue(palette.name)
                                            }}
                                        >
                                            {palette.name}
                                        </span>
                                    )}

                                    {/* Delete button */}
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={e => {
                                            e.stopPropagation()
                                            onDelete(palette.id)
                                        }}
                                    >
                                        <XIcon className="h-3 w-3" />
                                    </Button>
                                </div>

                                {/* Date */}
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                    {new Date(palette.updatedAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-border flex-shrink-0">
                    <span className="text-[10px] text-muted-foreground">
                        {palettes.length} {palettes.length === 1 ? "palette" : "palettes"}
                    </span>
                </div>
            </div>
        </div>
    )
}
