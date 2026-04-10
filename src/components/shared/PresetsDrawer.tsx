"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { BookOpenIcon, XIcon, SearchIcon } from "lucide-react"

export interface Preset {
    name: string
    category: string
    description?: string
    content: string
}

interface PresetsDrawerProps {
    presets: Preset[]
    onSelect: (preset: Preset) => void
}

export function PresetsDrawer({ presets, onSelect }: PresetsDrawerProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")

    const categories = useMemo(() => {
        const cats = new Map<string, Preset[]>()
        for (const p of presets) {
            const list = cats.get(p.category) || []
            list.push(p)
            cats.set(p.category, list)
        }
        return cats
    }, [presets])

    const filteredCategories = useMemo(() => {
        if (!search.trim()) return categories
        const q = search.toLowerCase()
        const filtered = new Map<string, Preset[]>()
        for (const [cat, items] of categories) {
            const matching = items.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q)
            )
            if (matching.length > 0) filtered.set(cat, matching)
        }
        return filtered
    }, [categories, search])

    return (
        <>
            <Button variant="ghost" size="xs" onClick={() => setOpen(true)} title="Presets">
                <BookOpenIcon className="h-3 w-3" />
                <span className="text-[10px]">Presets</span>
            </Button>

            {open && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
                    <div
                        className="bg-card border-l border-border w-full max-w-xs h-full flex flex-col shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
                            <h3 className="text-sm font-semibold text-foreground">Presets</h3>
                            <Button variant="ghost" size="icon-xs" onClick={() => setOpen(false)}>
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
                                    placeholder="Search presets..."
                                    className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/50"
                                    spellCheck={false}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {filteredCategories.size === 0 ? (
                                <div className="p-4 text-center text-xs text-muted-foreground">No presets found</div>
                            ) : (
                                Array.from(filteredCategories).map(([cat, items]) => (
                                    <div key={cat}>
                                        <div className="px-4 py-2 sticky top-0 bg-card/95 backdrop-blur-sm">
                                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{cat}</span>
                                        </div>
                                        {items.map((preset, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    onSelect(preset)
                                                    setOpen(false)
                                                    setSearch("")
                                                }}
                                                className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="text-xs font-medium text-foreground">{preset.name}</div>
                                                {preset.description && (
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">{preset.description}</div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
