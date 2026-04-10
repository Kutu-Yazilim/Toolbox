"use client"

import { useState, useEffect } from "react"
import { XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type Shortcut, formatShortcut } from "@/hooks/useKeyboardShortcuts"

interface ShortcutsSheetProps {
    shortcuts: Shortcut[]
}

export function ShortcutsSheet({ shortcuts }: ShortcutsSheetProps) {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
                const target = e.target as HTMLElement
                if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return
                e.preventDefault()
                setOpen(prev => !prev)
            }
            if (e.key === "Escape" && open) {
                setOpen(false)
            }
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [open])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
            <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">Keyboard Shortcuts</h3>
                    <Button variant="ghost" size="icon-xs" onClick={() => setOpen(false)}>
                        <XIcon className="h-3 w-3" />
                    </Button>
                </div>
                <div className="p-2 max-h-80 overflow-y-auto">
                    {shortcuts.map((s, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted/50">
                            <span className="text-sm text-foreground">{s.label}</span>
                            <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded text-muted-foreground">
                                {formatShortcut(s.key)}
                            </kbd>
                        </div>
                    ))}
                    <div className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted/50">
                        <span className="text-sm text-foreground">Toggle shortcuts</span>
                        <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded text-muted-foreground">?</kbd>
                    </div>
                </div>
            </div>
        </div>
    )
}
