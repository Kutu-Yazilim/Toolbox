"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DownloadIcon } from "lucide-react"

export interface ExportOption {
    label: string
    action: () => void | Promise<void>
    icon?: React.ReactNode
}

interface ExportMenuProps {
    options: ExportOption[]
}

export function ExportMenu({ options }: ExportMenuProps) {
    const [open, setOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [open])

    return (
        <div className="relative" ref={menuRef}>
            <Button variant="ghost" size="xs" onClick={() => setOpen(!open)} title="Export">
                <DownloadIcon className="h-3 w-3" />
                <span className="text-[10px]">Export</span>
            </Button>
            {open && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-md shadow-lg py-1 min-w-[160px]">
                    {options.map((opt, i) => (
                        <button
                            key={i}
                            onClick={async () => {
                                await opt.action()
                                setOpen(false)
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors flex items-center gap-2"
                        >
                            {opt.icon}
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
