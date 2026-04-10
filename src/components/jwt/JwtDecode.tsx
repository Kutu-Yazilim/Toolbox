"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
    CopyIcon,
    CheckIcon,
    AlertCircleIcon,
    TrashIcon,
    KeyRoundIcon,
} from "lucide-react"
import {
    decodeJwt,
    formatRelativeTime,
    type JwtDecoded,
} from "@/utils/encoderUtils"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useFileImport } from "@/hooks/useFileImport"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { type ExportOption } from "@/components/shared/ExportMenu"
import { JWT_DECODE_PRESETS } from "./presets"

const EXAMPLE_JWT =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4S3ojyNuxKnD_KJbKGSmMm3gT69LxGGDBYasfU0jLuY"

function JwtSection({
    title,
    data,
    onCopy,
    isCopied,
    copyLabel,
    accent,
}: {
    title: string
    data: Record<string, unknown>
    onCopy: (text: string, label: string) => Promise<void>
    isCopied: boolean
    copyLabel: string
    accent: string
}) {
    const json = JSON.stringify(data, null, 2)
    return (
        <div className="border-b border-border">
            <div className="flex items-center justify-between px-3 h-7 bg-muted/30">
                <span className={cn("text-[10px] font-semibold uppercase tracking-wider", accent)}>
                    {title}
                </span>
                <Button variant="ghost" size="xs" onClick={() => onCopy(json, copyLabel)}>
                    {isCopied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
                </Button>
            </div>
            <pre className="px-3 py-2.5 text-xs font-mono text-foreground/90 overflow-x-auto leading-relaxed">
                {json}
            </pre>
        </div>
    )
}

export function JwtDecode() {
    const [input, setInput] = useLocalStorage<string>("jwt-decode-input", EXAMPLE_JWT)
    const [decoded, setDecoded] = useState<JwtDecoded | null>(() => {
        try { return decodeJwt(EXAMPLE_JWT) } catch { return null }
    })
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState<string | null>(null)

    const { shareUrl } = useShareableUrl("jwt-decode", { input }, (restored) => {
        const restoredInput = (restored as { input: string }).input
        setInput(restoredInput)
        try {
            setDecoded(decodeJwt(restoredInput))
            setError(null)
        } catch {
            setDecoded(null)
        }
    })

    const { dropzoneProps, isDragging } = useFileImport({
        accept: [".txt", ".jwt"],
        onImport: (content) => {
            setInput(content.trim())
            try {
                setDecoded(decodeJwt(content.trim()))
                setError(null)
            } catch {
                setDecoded(null)
            }
        },
    })

    const handleDecode = useCallback(() => {
        setError(null)
        setDecoded(null)
        try {
            setDecoded(decodeJwt(input))
        } catch (e) {
            setError(e instanceof Error ? e.message : "Decode failed")
        }
    }, [input])

    const handleClear = useCallback(() => {
        setInput("")
        setDecoded(null)
        setError(null)
    }, [setInput])

    const handleCopy = async (text: string, label: string) => {
        await navigator.clipboard.writeText(text)
        setCopied(label)
        setTimeout(() => setCopied(null), 2000)
    }

    const handlePresetSelect = useCallback((preset: Preset) => {
        setInput(preset.content)
        try {
            setDecoded(decodeJwt(preset.content))
            setError(null)
        } catch {
            setDecoded(null)
        }
    }, [setInput])

    const decodedJson = decoded
        ? JSON.stringify({ header: decoded.header, payload: decoded.payload }, null, 2)
        : ""

    const shortcuts: Shortcut[] = useMemo(() => [
        { key: "mod+shift+d", label: "Decode", action: handleDecode },
        { key: "mod+shift+x", label: "Clear", action: handleClear },
    ], [handleDecode, handleClear])

    useKeyboardShortcuts(shortcuts)

    const exportOptions: ExportOption[] = useMemo(() => [
        {
            label: "Download decoded JSON",
            action: () => {
                const blob = new Blob([decodedJson], { type: "application/json" })
                const a = document.createElement("a")
                a.href = URL.createObjectURL(blob)
                a.download = "jwt-decoded.json"
                a.click()
                URL.revokeObjectURL(a.href)
            },
        },
    ], [decodedJson])

    return (
        <div className="h-full flex flex-col min-h-0 overflow-hidden" {...dropzoneProps}>
            {isDragging && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg">
                    <span className="text-sm font-medium text-primary">Drop JWT file</span>
                </div>
            )}

            <ToolToolbar
                title="JWT Decode"
                copyValue={decodedJson || undefined}
                onShare={shareUrl}
                exportOptions={exportOptions}
                presets={JWT_DECODE_PRESETS}
                onPresetSelect={handlePresetSelect}
                shortcuts={shortcuts}
            />

            {/* Token input */}
            <div className="flex flex-col flex-shrink-0 border-b border-border" style={{ height: "28%" }}>
                <div className="flex items-center justify-between px-3 h-8 border-b border-border bg-muted/20 flex-shrink-0">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        Encoded Token
                    </span>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="xs" onClick={handleDecode}>
                            <span className="text-[10px] font-medium">Decode</span>
                        </Button>
                        <Button variant="ghost" size="xs" onClick={handleClear}>
                            <TrashIcon className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
                <textarea
                    value={input}
                    onChange={e => {
                        setInput(e.target.value)
                        try {
                            setDecoded(decodeJwt(e.target.value))
                            setError(null)
                        } catch {
                            setDecoded(null)
                        }
                    }}
                    className="flex-1 w-full px-3 py-2.5 text-xs font-mono bg-transparent text-foreground resize-none outline-none break-all leading-relaxed"
                    placeholder="Paste your JWT token here..."
                    spellCheck={false}
                />
            </div>

            {/* Error */}
            {error && (
                <div className="px-3 py-2 bg-destructive/10 border-b border-destructive/20 flex-shrink-0">
                    <p className="text-xs text-destructive flex items-center gap-1.5">
                        <AlertCircleIcon className="h-3.5 w-3.5 flex-shrink-0" />
                        {error}
                    </p>
                </div>
            )}

            {/* Decoded output */}
            {decoded && (
                <div className="flex-1 overflow-y-auto min-h-0">
                    {decoded.expiry && (
                        <div
                            className={cn(
                                "px-3 py-2 text-xs border-b flex items-center gap-2",
                                decoded.expiry.expired
                                    ? "bg-destructive/10 border-destructive/20 text-destructive"
                                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            )}
                        >
                            <span className="font-semibold">
                                {decoded.expiry.expired ? "Expired" : "Valid"}
                            </span>
                            <span className="opacity-80">
                                {decoded.expiry.expired ? "Expired " : "Expires "}
                                {formatRelativeTime(decoded.expiry.date)}
                                {" \u2014 "}
                                {decoded.expiry.date.toLocaleString()}
                            </span>
                        </div>
                    )}

                    <JwtSection
                        title="Header"
                        data={decoded.header}
                        onCopy={handleCopy}
                        isCopied={copied === "header"}
                        copyLabel="header"
                        accent="text-red-400"
                    />
                    <JwtSection
                        title="Payload"
                        data={decoded.payload}
                        onCopy={handleCopy}
                        isCopied={copied === "payload"}
                        copyLabel="payload"
                        accent="text-violet-400"
                    />

                    {/* Signature */}
                    <div className="border-b border-border">
                        <div className="flex items-center justify-between px-3 h-7 bg-muted/30">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                                Signature
                            </span>
                            <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => handleCopy(decoded.signature, "sig")}
                            >
                                {copied === "sig" ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
                            </Button>
                        </div>
                        <div className="px-3 py-2.5">
                            <code className="text-xs font-mono text-cyan-400/80 break-all leading-relaxed">
                                {decoded.signature}
                            </code>
                        </div>
                    </div>
                </div>
            )}

            {!decoded && !error && (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                        <KeyRoundIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-xs">Paste a JWT token above to decode it</p>
                    </div>
                </div>
            )}
        </div>
    )
}
