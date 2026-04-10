"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon, LinkIcon } from "lucide-react"
import { ExportMenu, type ExportOption } from "./ExportMenu"
import { PresetsDrawer, type Preset } from "./PresetsDrawer"
import { ShortcutsSheet } from "./ShortcutsSheet"
import { type Shortcut } from "@/hooks/useKeyboardShortcuts"

interface StatusIndicator {
    type: "success" | "error" | "info"
    label: string
}

interface ToolToolbarProps {
    title: string
    status?: StatusIndicator | null
    actions?: React.ReactNode
    copyValue?: string
    onShare?: () => Promise<void>
    exportOptions?: ExportOption[]
    presets?: Preset[]
    onPresetSelect?: (preset: Preset) => void
    shortcuts?: Shortcut[]
    children?: React.ReactNode
}

export function ToolToolbar({
    title,
    status,
    actions,
    copyValue,
    onShare,
    exportOptions,
    presets,
    onPresetSelect,
    shortcuts = [],
    children,
}: ToolToolbarProps) {
    const [copied, setCopied] = useState(false)
    const [shared, setShared] = useState(false)

    const handleCopy = async () => {
        if (!copyValue) return
        await navigator.clipboard.writeText(copyValue)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleShare = async () => {
        if (!onShare) return
        await onShare()
        setShared(true)
        setTimeout(() => setShared(false), 2000)
    }

    return (
        <>
            <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
                    {status && (
                        <span className={`text-xs flex items-center gap-1 ${
                            status.type === "success" ? "text-emerald-500" :
                            status.type === "error" ? "text-destructive" :
                            "text-muted-foreground"
                        }`}>
                            {status.type === "success" && <CheckIcon className="h-3 w-3" />}
                            {status.label}
                        </span>
                    )}
                    {children}
                </div>
                <div className="flex items-center gap-1">
                    {actions}

                    {presets && presets.length > 0 && onPresetSelect && (
                        <>
                            <div className="w-px h-4 bg-border mx-0.5" />
                            <PresetsDrawer presets={presets} onSelect={onPresetSelect} />
                        </>
                    )}

                    {exportOptions && exportOptions.length > 0 && (
                        <ExportMenu options={exportOptions} />
                    )}

                    {copyValue !== undefined && (
                        <Button variant="ghost" size="xs" onClick={handleCopy} title="Copy">
                            {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
                        </Button>
                    )}

                    {onShare && (
                        <Button variant="ghost" size="xs" onClick={handleShare} title="Share link">
                            {shared ? <CheckIcon className="h-3 w-3" /> : <LinkIcon className="h-3 w-3" />}
                        </Button>
                    )}
                </div>
            </div>
            <ShortcutsSheet shortcuts={shortcuts} />
        </>
    )
}
