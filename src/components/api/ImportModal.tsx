"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { XIcon, AlertCircleIcon, UploadIcon } from "lucide-react"
import { parseOpenApiSpec, type ParsedOpenApiSpec } from "@/utils/openApiParser"

interface ImportModalProps {
    onImport: (spec: ParsedOpenApiSpec) => void
    onClose: () => void
}

export function ImportModal({ onImport, onClose }: ImportModalProps) {
    const [text, setText] = useState("")
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImport = () => {
        setError(null)
        if (!text.trim()) {
            setError("Please paste an OpenAPI spec or upload a file")
            return
        }
        try {
            const parsed = JSON.parse(text)
            const spec = parseOpenApiSpec(parsed)
            onImport(spec)
        } catch (e: unknown) {
            if (e instanceof SyntaxError) {
                setError("Invalid JSON: " + e.message)
            } else {
                setError(e instanceof Error ? e.message : "Failed to parse spec")
            }
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setError(null)
        const reader = new FileReader()
        reader.onload = () => {
            const content = reader.result as string
            setText(content)
            // Auto-import on file upload
            try {
                const parsed = JSON.parse(content)
                const spec = parseOpenApiSpec(parsed)
                onImport(spec)
            } catch (err: unknown) {
                if (err instanceof SyntaxError) {
                    setError("Invalid JSON: " + err.message)
                } else {
                    setError(err instanceof Error ? err.message : "Failed to parse spec")
                }
            }
        }
        reader.readAsText(file)
    }

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[80%]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 h-10 border-b border-border flex-shrink-0">
                    <span className="text-sm font-medium text-foreground">Import OpenAPI Spec</span>
                    <Button variant="ghost" size="xs" onClick={onClose}>
                        <XIcon className="h-3 w-3" />
                    </Button>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col gap-3 p-4 min-h-0">
                    <textarea
                        value={text}
                        onChange={e => { setText(e.target.value); setError(null) }}
                        placeholder="Paste your OpenAPI / Swagger JSON spec here..."
                        className="flex-1 min-h-[200px] w-full px-3 py-2 text-xs font-mono bg-muted/30 border border-border rounded-md resize-none outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                        spellCheck={false}
                    />

                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">or</span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                    >
                        <UploadIcon className="h-3.5 w-3.5" />
                        <span className="text-xs">Upload .json file</span>
                    </Button>

                    {error && (
                        <div className="flex items-start gap-1.5 text-destructive text-xs">
                            <AlertCircleIcon className="h-3 w-3 flex-shrink-0 mt-0.5" />
                            <span className="break-words">{error}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-4 h-12 border-t border-border flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <span className="text-xs">Cancel</span>
                    </Button>
                    <Button variant="default" size="sm" onClick={handleImport} disabled={!text.trim()}>
                        <span className="text-xs">Import</span>
                    </Button>
                </div>
            </div>
        </div>
    )
}
