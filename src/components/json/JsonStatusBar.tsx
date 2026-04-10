"use client"

import { useState, useCallback, useMemo } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

const DASH = "\u2014"
const COPY_FEEDBACK_MS = 1500

interface JsonStatusBarProps {
    jsonPath: string | null
    json: string
    isValid: boolean
}

function computeStats(json: string, isValid: boolean): { depth: number; totalKeys: number; byteSize: number } {
    const byteSize = new TextEncoder().encode(json).length
    if (!isValid || !json.trim()) {
        return { depth: 0, totalKeys: 0, byteSize }
    }

    try {
        const parsed = JSON.parse(json)
        let maxDepth = 0
        let keyCount = 0

        function walk(value: unknown, currentDepth: number): void {
            if (currentDepth > maxDepth) maxDepth = currentDepth
            if (Array.isArray(value)) {
                for (const item of value) {
                    walk(item, currentDepth + 1)
                }
            } else if (value !== null && typeof value === "object") {
                const entries = Object.entries(value as Record<string, unknown>)
                keyCount += entries.length
                for (const [, val] of entries) {
                    walk(val, currentDepth + 1)
                }
            }
        }

        walk(parsed, 0)
        return { depth: maxDepth, totalKeys: keyCount, byteSize }
    } catch {
        return { depth: 0, totalKeys: 0, byteSize }
    }
}

function formatByteSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function JsonStatusBar({ jsonPath, json, isValid }: JsonStatusBarProps) {
    const [copied, setCopied] = useState(false)
    const stats = useMemo(() => computeStats(json, isValid), [json, isValid])

    const handleCopyPath = useCallback(async () => {
        if (!jsonPath) return
        await navigator.clipboard.writeText(jsonPath)
        setCopied(true)
        setTimeout(() => setCopied(false), COPY_FEEDBACK_MS)
    }, [jsonPath])

    return (
        <div className="flex items-center justify-between px-3 h-7 border-t border-border bg-muted/30 flex-shrink-0 text-[10px] text-muted-foreground font-mono">
            <button
                onClick={handleCopyPath}
                disabled={!jsonPath}
                className="flex items-center gap-1 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-default truncate max-w-[50%]"
                title={jsonPath ? "Click to copy path" : "Select a node in the tree view"}
            >
                {copied ? (
                    <CheckIcon className="h-2.5 w-2.5 text-emerald-500 flex-shrink-0" />
                ) : (
                    <CopyIcon className="h-2.5 w-2.5 flex-shrink-0" />
                )}
                <span className="truncate">{jsonPath ?? DASH}</span>
            </button>

            <div className="flex items-center gap-3">
                <span>Depth: {isValid && json.trim() ? stats.depth : DASH}</span>
                <span>Keys: {isValid && json.trim() ? stats.totalKeys : DASH}</span>
                <span>{formatByteSize(stats.byteSize)}</span>
            </div>
        </div>
    )
}
