"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import Editor from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import {
    ArrowDownIcon,
    ArrowUpIcon,
    ArrowLeftRightIcon,
    ZapIcon,
    UploadIcon,
    AlertCircleIcon,
} from "lucide-react"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { EncoderInfoPanel } from "./EncoderInfoPanel"
import { ENCODER_PRESETS } from "./encoderPresets"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useFileImport } from "@/hooks/useFileImport"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { useAutoDetect } from "@/hooks/useAutoDetect"
import { useTheme } from "@/hooks/useTheme"
import {
    base64Encode,
    base64Decode,
    base64UrlSafeEncode,
    base64UrlSafeDecode,
    urlEncode,
    urlDecode,
    htmlEntityEncode,
    htmlEntityDecode,
    decodeJwt,
    type JwtDecoded,
} from "@/utils/encoderUtils"
import { type Preset } from "@/components/shared/PresetsDrawer"

// --- Constants ---

const STORAGE_KEY = "kutu-encoder" as const
const TOOL_ID = "encoder" as const

const ENCODING_MODES = [
    { id: "base64", label: "Base64" },
    { id: "url", label: "URL" },
    { id: "html-entity", label: "HTML Entity" },
    { id: "jwt", label: "JWT Decode" },
] as const

type EncodingMode = (typeof ENCODING_MODES)[number]["id"]

interface EncoderState {
    input: string
    mode: EncodingMode
    autoEncode: boolean
}

const DEFAULT_STATE: EncoderState = {
    input: "",
    mode: "base64",
    autoEncode: false,
}

const AUTO_DETECT_MODE_MAP: Record<string, EncodingMode> = {
    base64: "base64",
    "url-encoded": "url",
    "html-entity": "html-entity",
    jwt: "jwt",
}

// --- Encoding/Decoding logic ---

function encode(input: string, mode: EncodingMode): string {
    switch (mode) {
        case "base64":
            return base64Encode(input)
        case "url":
            return urlEncode(input, "component")
        case "html-entity":
            return htmlEntityEncode(input)
        case "jwt":
            return JSON.stringify(decodeJwt(input), null, 2)
    }
}

function decode(input: string, mode: EncodingMode): string {
    switch (mode) {
        case "base64":
            return base64Decode(input)
        case "url":
            return urlDecode(input, "component")
        case "html-entity":
            return htmlEntityDecode(input)
        case "jwt":
            return JSON.stringify(decodeJwt(input), null, 2)
    }
}

function tryDecodeJwt(input: string): JwtDecoded | null {
    try {
        return decodeJwt(input.trim())
    } catch {
        return null
    }
}

function toHexView(input: string): string {
    const bytes = new TextEncoder().encode(input)
    const lines: string[] = []
    for (let offset = 0; offset < bytes.length; offset += 16) {
        const chunk = bytes.slice(offset, offset + 16)
        const hex = Array.from(chunk, b => b.toString(16).padStart(2, "0")).join(" ")
        const ascii = Array.from(chunk, b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : ".")).join("")
        lines.push(`${offset.toString(16).padStart(8, "0")}  ${hex.padEnd(48)}  ${ascii}`)
    }
    return lines.join("\n")
}

// --- Component ---

export function EncoderDecoder() {
    const { isDark } = useTheme()

    // Persisted state
    const [persisted, setPersisted] = useLocalStorage<EncoderState>(STORAGE_KEY, DEFAULT_STATE)
    const [input, setInput] = useState(persisted.input)
    const [mode, setMode] = useState<EncodingMode>(persisted.mode)
    const [autoEncode, setAutoEncode] = useState(persisted.autoEncode)

    // Transient state
    const [output, setOutput] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [jwtData, setJwtData] = useState<JwtDecoded | null>(null)

    // Auto-detect
    const detection = useAutoDetect(input)

    // Persist state changes
    useEffect(() => {
        setPersisted({ input, mode, autoEncode })
    }, [input, mode, autoEncode, setPersisted])

    // Shareable URL
    const handleRestore = useCallback((state: EncoderState) => {
        setInput(state.input)
        setMode(state.mode)
        setAutoEncode(state.autoEncode)
    }, [])

    const { shareUrl } = useShareableUrl<EncoderState>(
        TOOL_ID,
        { input, mode, autoEncode },
        handleRestore,
    )

    // File import
    const { dropzoneProps, openFilePicker, isDragging } = useFileImport({
        accept: [],
        onImport: useCallback((content: string) => {
            setInput(content)
            setError(null)
        }, []),
        readAs: "arrayBuffer",
    })

    // Encode action
    const handleEncode = useCallback(() => {
        setError(null)
        try {
            const result = encode(input, mode)
            setOutput(result)
            if (mode === "jwt") {
                setJwtData(tryDecodeJwt(input))
            } else {
                setJwtData(null)
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Encoding failed")
            setOutput("")
            setJwtData(null)
        }
    }, [input, mode])

    // Decode action
    const handleDecode = useCallback(() => {
        setError(null)
        try {
            const result = decode(input, mode)
            setOutput(result)
            if (mode === "jwt") {
                setJwtData(tryDecodeJwt(input))
            } else {
                setJwtData(null)
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Decoding failed")
            setOutput("")
            setJwtData(null)
        }
    }, [input, mode])

    // Swap
    const handleSwap = useCallback(() => {
        setInput(output)
        setOutput(input)
        setError(null)
    }, [input, output])

    // Auto-encode on input change
    useEffect(() => {
        if (!autoEncode || !input.trim()) {
            if (!input.trim()) {
                setOutput("")
                setError(null)
                setJwtData(null)
            }
            return
        }

        // Auto-detect mode suggestion
        const suggestedMode = AUTO_DETECT_MODE_MAP[detection.type]
        if (suggestedMode && detection.confidence > 0.7) {
            setMode(suggestedMode)
            try {
                const result = decode(input, suggestedMode)
                setOutput(result)
                if (suggestedMode === "jwt") {
                    setJwtData(tryDecodeJwt(input))
                } else {
                    setJwtData(null)
                }
                setError(null)
                return
            } catch {
                // Fall through to encode
            }
        }

        try {
            setOutput(encode(input, mode))
            setError(null)
            if (mode === "jwt") {
                setJwtData(tryDecodeJwt(input))
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Encoding failed")
            setOutput("")
            setJwtData(null)
        }
    }, [input, mode, autoEncode, detection])

    // Quick actions
    const handleUrlSafeBase64 = useCallback(() => {
        setError(null)
        try {
            setOutput(base64UrlSafeEncode(input))
            setMode("base64")
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "URL-safe encoding failed")
        }
    }, [input])

    const handleStripPadding = useCallback(() => {
        setOutput(prev => prev.replace(/=+$/, ""))
    }, [])

    const handleHexView = useCallback(() => {
        const source = output || input
        if (source) {
            setOutput(toHexView(source))
        }
    }, [input, output])

    // Preset selection
    const handlePresetSelect = useCallback((preset: Preset) => {
        setInput(preset.content)
        setOutput("")
        setError(null)
        setJwtData(null)
    }, [])

    // Keyboard shortcuts
    const shortcuts: Shortcut[] = useMemo(() => [
        { key: "mod+e", label: "Encode", action: handleEncode },
        { key: "mod+d", label: "Decode", action: handleDecode },
    ], [handleEncode, handleDecode])

    useKeyboardShortcuts(shortcuts)

    // Export options
    const exportOptions = useMemo(() => [
        {
            label: "Copy output",
            action: () => navigator.clipboard.writeText(output),
        },
        {
            label: "Download as .txt",
            action: () => {
                const blob = new Blob([output], { type: "text/plain" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `encoded-output.txt`
                a.click()
                URL.revokeObjectURL(url)
            },
        },
    ], [output])

    // Toolbar status
    const status = useMemo(() => {
        if (error) return { type: "error" as const, label: error }
        if (detection.type !== "unknown" && detection.confidence > 0.5) {
            return { type: "info" as const, label: `Detected: ${detection.type} (${Math.round(detection.confidence * 100)}%)` }
        }
        return null
    }, [error, detection])

    const monacoTheme = isDark ? "vs-dark" : "light"

    return (
        <div className="h-full flex flex-col min-h-0" {...dropzoneProps}>
            <ToolToolbar
                title="Encoder / Decoder"
                status={status}
                copyValue={output}
                onShare={shareUrl}
                exportOptions={exportOptions}
                presets={ENCODER_PRESETS}
                onPresetSelect={handlePresetSelect}
                shortcuts={shortcuts}
                actions={
                    <Button variant="ghost" size="xs" onClick={openFilePicker} title="Import file">
                        <UploadIcon className="h-3 w-3" />
                        <span className="text-[10px]">Import</span>
                    </Button>
                }
            >
                {/* Mode tabs */}
                <div className="flex items-center gap-0.5 ml-3">
                    {ENCODING_MODES.map(m => (
                        <button
                            key={m.id}
                            onClick={() => {
                                setMode(m.id)
                                setError(null)
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                                mode === m.id
                                    ? "bg-muted text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </ToolToolbar>

            <div className="flex-1 flex min-h-0">
                {/* Main editor area */}
                <div className="flex-1 flex flex-col min-h-0 min-w-0">
                    {/* Drag overlay */}
                    {isDragging && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary rounded-lg">
                            <span className="text-sm font-medium text-primary">Drop file to import</span>
                        </div>
                    )}

                    {/* Input editor */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between px-3 h-7 border-b border-border flex-shrink-0">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                Input
                            </span>
                        </div>
                        <div className="flex-1 min-h-0">
                            <Editor
                                height="100%"
                                defaultLanguage="plaintext"
                                value={input}
                                onChange={v => {
                                    setInput(v ?? "")
                                    setError(null)
                                }}
                                theme={monacoTheme}
                                options={{
                                    minimap: { enabled: false },
                                    lineNumbers: "off",
                                    scrollBeyondLastLine: false,
                                    wordWrap: "on",
                                    fontSize: 12,
                                    fontFamily: "ui-monospace, monospace",
                                    padding: { top: 8 },
                                    renderLineHighlight: "none",
                                    overviewRulerBorder: false,
                                    scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                                }}
                            />
                        </div>
                    </div>

                    {/* Action bar */}
                    <div className="flex items-center justify-center gap-2 px-3 h-10 border-y border-border flex-shrink-0 bg-muted/20">
                        <Button variant="outline" size="xs" onClick={handleEncode}>
                            <ArrowDownIcon className="h-3 w-3" />
                            <span className="text-[11px]">Encode</span>
                        </Button>
                        <Button variant="outline" size="xs" onClick={handleDecode}>
                            <ArrowUpIcon className="h-3 w-3" />
                            <span className="text-[11px]">Decode</span>
                        </Button>
                        <Button variant="ghost" size="xs" onClick={handleSwap} title="Swap input/output">
                            <ArrowLeftRightIcon className="h-3 w-3" />
                            <span className="text-[10px]">Swap</span>
                        </Button>
                        <div className="w-px h-4 bg-border mx-0.5" />
                        <Button
                            variant={autoEncode ? "default" : "ghost"}
                            size="xs"
                            onClick={() => setAutoEncode(prev => !prev)}
                            title="Auto encode/decode on input change"
                        >
                            <ZapIcon className="h-3 w-3" />
                            <span className="text-[10px]">Auto</span>
                        </Button>
                        {error && (
                            <span className="text-destructive text-xs flex items-center gap-1 ml-2">
                                <AlertCircleIcon className="h-3 w-3" />
                                <span className="max-w-[200px] truncate">{error}</span>
                            </span>
                        )}
                    </div>

                    {/* Output editor */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between px-3 h-7 border-b border-border flex-shrink-0">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                Output
                            </span>
                        </div>
                        <div className="flex-1 min-h-0">
                            <Editor
                                height="100%"
                                defaultLanguage="plaintext"
                                value={output}
                                theme={monacoTheme}
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    lineNumbers: "off",
                                    scrollBeyondLastLine: false,
                                    wordWrap: "on",
                                    fontSize: 12,
                                    fontFamily: "ui-monospace, monospace",
                                    padding: { top: 8 },
                                    renderLineHighlight: "none",
                                    overviewRulerBorder: false,
                                    scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                                    domReadOnly: true,
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Info panel sidebar */}
                <div className="w-[35%] min-w-[200px] max-w-[320px] flex-shrink-0">
                    <EncoderInfoPanel
                        input={input}
                        output={output}
                        mode={mode}
                        jwtData={jwtData}
                        onUrlSafeBase64={handleUrlSafeBase64}
                        onStripPadding={handleStripPadding}
                        onHexView={handleHexView}
                    />
                </div>
            </div>
        </div>
    )
}
