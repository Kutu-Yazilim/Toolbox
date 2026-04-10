"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
    AlertCircleIcon,
    ArrowDownIcon,
    ArrowUpIcon,
} from "lucide-react"
import { base64Encode, base64Decode } from "@/utils/encoderUtils"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useFileImport } from "@/hooks/useFileImport"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { type ExportOption } from "@/components/shared/ExportMenu"
import { BASE64_PRESETS } from "./presets"

interface Base64State {
    input: string
    output: string
}

const DEFAULT_STATE: Base64State = { input: "", output: "" }

export function Base64Encoder() {
    const [state, setState] = useLocalStorage<Base64State>("base64-encoder", DEFAULT_STATE)
    const [error, setError] = useState<string | null>(null)

    const { shareUrl } = useShareableUrl("base64-encoder", state, (restored) => {
        setState(restored)
        setError(null)
    })

    const { dropzoneProps, isDragging } = useFileImport({
        accept: [".txt", ".json", ".xml", ".csv", ".html"],
        onImport: (content) => {
            setState(prev => ({ ...prev, input: content }))
            setError(null)
        },
    })

    const handleEncode = useCallback(() => {
        setError(null)
        try {
            setState(prev => ({ ...prev, output: base64Encode(prev.input) }))
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Encoding failed")
        }
    }, [setState])

    const handleDecode = useCallback(() => {
        setError(null)
        try {
            setState(prev => ({ ...prev, output: base64Decode(prev.input) }))
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Decoding failed")
        }
    }, [setState])

    const handleSwap = useCallback(() => {
        setState(prev => ({ input: prev.output, output: prev.input }))
    }, [setState])

    const shortcuts: Shortcut[] = useMemo(() => [
        { key: "mod+shift+e", label: "Encode", action: handleEncode },
        { key: "mod+shift+d", label: "Decode", action: handleDecode },
        { key: "mod+shift+s", label: "Swap input/output", action: handleSwap },
    ], [handleEncode, handleDecode, handleSwap])

    useKeyboardShortcuts(shortcuts)

    const exportOptions: ExportOption[] = useMemo(() => [
        {
            label: "Download as .txt",
            action: () => {
                const blob = new Blob([state.output], { type: "text/plain" })
                const a = document.createElement("a")
                a.href = URL.createObjectURL(blob)
                a.download = "base64-output.txt"
                a.click()
                URL.revokeObjectURL(a.href)
            },
        },
    ], [state.output])

    const handlePresetSelect = useCallback((preset: Preset) => {
        setState({ input: preset.content, output: "" })
        setError(null)
    }, [setState])

    return (
        <div className="h-full flex flex-col min-h-0" {...dropzoneProps}>
            {isDragging && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg">
                    <span className="text-sm font-medium text-primary">Drop file to import</span>
                </div>
            )}

            {/* Input */}
            <div className="flex-1 flex flex-col min-h-0">
                <ToolToolbar
                    title="Input"
                    copyValue={state.input}
                    onShare={shareUrl}
                    exportOptions={exportOptions}
                    presets={BASE64_PRESETS}
                    onPresetSelect={handlePresetSelect}
                    shortcuts={shortcuts}
                />
                <textarea
                    value={state.input}
                    onChange={e => { setState(prev => ({ ...prev, input: e.target.value })); setError(null) }}
                    className="flex-1 w-full px-3 py-2 text-sm font-mono bg-transparent text-foreground resize-none outline-none"
                    placeholder="Enter text to encode/decode..."
                    spellCheck={false}
                />
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
                    <span className="text-[10px]">Swap</span>
                </Button>
                {error && (
                    <span className="text-destructive text-xs flex items-center gap-1 ml-2">
                        <AlertCircleIcon className="h-3 w-3" />
                        {error}
                    </span>
                )}
            </div>

            {/* Output */}
            <div className="flex-1 flex flex-col min-h-0">
                <ToolToolbar title="Output" copyValue={state.output} shortcuts={[]} />
                <textarea
                    value={state.output}
                    readOnly
                    className="flex-1 w-full px-3 py-2 text-sm font-mono bg-muted/10 text-foreground resize-none outline-none"
                    placeholder="Result will appear here..."
                />
            </div>
        </div>
    )
}
