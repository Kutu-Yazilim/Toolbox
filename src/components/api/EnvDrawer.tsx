"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { XIcon, PlusIcon } from "lucide-react"

interface EnvDrawerProps {
    open: boolean
    onClose: () => void
    vars: Record<string, string>
    onChange: (vars: Record<string, string>) => void
    referencedVars: string[]
}

export function EnvDrawer({ open, onClose, vars, onChange, referencedVars }: EnvDrawerProps) {
    const [entries, setEntries] = useState(() =>
        Object.entries(vars).map(([key, value]) => ({ key, value }))
    )

    function commit(updated: { key: string; value: string }[]) {
        setEntries(updated)
        const result: Record<string, string> = {}
        for (const entry of updated) {
            if (entry.key.trim()) {
                result[entry.key.trim()] = entry.value
            }
        }
        onChange(result)
    }

    function updateKey(index: number, newKey: string) {
        const updated = entries.map((e, i) => i === index ? { ...e, key: newKey } : e)
        commit(updated)
    }

    function updateValue(index: number, newValue: string) {
        const updated = entries.map((e, i) => i === index ? { ...e, value: newValue } : e)
        commit(updated)
    }

    function removeEntry(index: number) {
        commit(entries.filter((_, i) => i !== index))
    }

    function addEntry() {
        const updated = [...entries, { key: "", value: "" }]
        setEntries(updated)
    }

    const existingKeys = new Set(entries.map(e => e.key.trim()).filter(Boolean))
    const missingVars = referencedVars.filter(v => !existingKeys.has(v))
    const referencedSet = new Set(referencedVars)

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-card border-l border-border w-full max-w-xs h-full flex flex-col shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
                    <h3 className="text-sm font-semibold text-foreground">Environment Variables</h3>
                    <Button variant="ghost" size="icon-xs" onClick={onClose}>
                        <XIcon className="h-3 w-3" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
                    {entries.map((entry, index) => (
                        <div key={index} className="flex items-center gap-1.5">
                            <div className="relative flex-1">
                                {referencedSet.has(entry.key.trim()) && (
                                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                )}
                                <input
                                    type="text"
                                    value={entry.key}
                                    onChange={e => updateKey(index, e.target.value)}
                                    placeholder="KEY"
                                    className={`w-full bg-muted/30 border border-border rounded-md py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/50 ${referencedSet.has(entry.key.trim()) ? "pl-5 pr-2" : "px-2"}`}
                                    spellCheck={false}
                                />
                            </div>
                            <input
                                type="text"
                                value={entry.value}
                                onChange={e => updateValue(index, e.target.value)}
                                placeholder="value"
                                className="flex-1 bg-muted/30 border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/50 font-mono"
                                spellCheck={false}
                            />
                            <Button variant="ghost" size="icon-xs" onClick={() => removeEntry(index)} className="flex-shrink-0">
                                <XIcon className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}

                    {missingVars.length > 0 && (
                        <div className="pt-2 space-y-1">
                            <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Missing Variables</span>
                            {missingVars.map(varName => (
                                <div key={varName} className="flex items-center gap-1.5 px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                    <span className="text-xs font-mono text-amber-400">{varName}</span>
                                    <span className="text-[10px] text-muted-foreground ml-auto">referenced but undefined</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <Button variant="ghost" size="xs" className="w-full justify-start mt-2" onClick={addEntry}>
                        <PlusIcon className="h-3 w-3 mr-1" />
                        <span className="text-[10px]">Add Variable</span>
                    </Button>
                </div>

                <div className="px-4 py-2.5 border-t border-border flex-shrink-0">
                    <span className="text-[10px] text-muted-foreground">
                        {existingKeys.size} variable{existingKeys.size === 1 ? "" : "s"}, {referencedVars.length} referenced in request
                    </span>
                </div>
            </div>
        </div>
    )
}
