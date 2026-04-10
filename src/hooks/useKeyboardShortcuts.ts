"use client"

import { useEffect, useCallback, useRef } from "react"

export interface Shortcut {
    key: string // e.g. "mod+s", "mod+shift+c", "?"
    label: string
    action: () => void
}

const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().includes("MAC")

function parseShortcut(shortcut: string): { ctrlOrCmd: boolean; shift: boolean; alt: boolean; key: string } {
    const parts = shortcut.toLowerCase().split("+")
    return {
        ctrlOrCmd: parts.includes("mod") || parts.includes("ctrl") || parts.includes("cmd"),
        shift: parts.includes("shift"),
        alt: parts.includes("alt"),
        key: parts[parts.length - 1],
    }
}

function matchesEvent(e: KeyboardEvent, parsed: ReturnType<typeof parseShortcut>): boolean {
    const modKey = isMac ? e.metaKey : e.ctrlKey
    if (parsed.ctrlOrCmd && !modKey) return false
    if (!parsed.ctrlOrCmd && modKey) return false
    if (parsed.shift && !e.shiftKey) return false
    if (!parsed.shift && e.shiftKey && parsed.key !== "?") return false
    if (parsed.alt && !e.altKey) return false
    return e.key.toLowerCase() === parsed.key
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
    const shortcutsRef = useRef(shortcuts)
    shortcutsRef.current = shortcuts

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // Don't trigger in input/textarea/contenteditable unless it's a mod shortcut
            const target = e.target as HTMLElement
            const isEditable = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable
            const modKey = isMac ? e.metaKey : e.ctrlKey

            for (const shortcut of shortcutsRef.current) {
                const parsed = parseShortcut(shortcut.key)
                if (matchesEvent(e, parsed)) {
                    // Only allow non-mod shortcuts outside editables
                    if (isEditable && !parsed.ctrlOrCmd) continue
                    // Don't block "?" in Monaco editors
                    if (parsed.key === "?" && isEditable) continue
                    e.preventDefault()
                    shortcut.action()
                    return
                }
            }
        }

        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [])
}

export function formatShortcut(shortcut: string): string {
    return shortcut
        .replace(/mod/gi, isMac ? "⌘" : "Ctrl")
        .replace(/shift/gi, isMac ? "⇧" : "Shift")
        .replace(/alt/gi, isMac ? "⌥" : "Alt")
        .replace(/\+/g, " + ")
        .replace(/\b\w/g, c => c.toUpperCase())
}
