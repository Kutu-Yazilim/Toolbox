"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { PlusIcon, XIcon, UploadIcon, FileIcon } from "lucide-react"
import Editor from "@monaco-editor/react"
import { type BodyType, type KeyValuePair, BODY_TYPES, MONACO_OPTIONS } from "./apiTypes"

// ─── Internal Helper Components ───────────────────────────────────────────────

function KeyValueWithFileEditor({
    data,
    onChange,
}: {
    data: KeyValuePair[]
    onChange: (data: KeyValuePair[]) => void
}) {
    const handleKeyChange = (index: number, key: string) => {
        const next = data.map((row, i) => (i === index ? { ...row, key } : row))
        onChange(next)
    }

    const handleValueChange = (index: number, value: string) => {
        const next = data.map((row, i) => (i === index ? { ...row, value } : row))
        onChange(next)
    }

    const handleRemove = (index: number) => {
        onChange(data.filter((_, i) => i !== index))
    }

    const handleAdd = () => {
        onChange([...data, { key: "", value: "", enabled: true }])
    }

    return (
        <div className="flex flex-col gap-1 p-2">
            {data.map((row, index) => (
                <div key={index} className="flex items-center gap-1">
                    <input
                        type="text"
                        value={row.key}
                        onChange={e => handleKeyChange(index, e.target.value)}
                        placeholder="Key"
                        className="flex-1 h-7 px-2 text-xs bg-muted/30 border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                    />
                    <input
                        type="text"
                        value={row.value}
                        onChange={e => handleValueChange(index, e.target.value)}
                        placeholder="Value"
                        className="flex-1 h-7 px-2 text-xs bg-muted/30 border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                    />
                    <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleRemove(index)}
                        className="h-7 w-7 p-0 flex-shrink-0"
                    >
                        <XIcon className="h-3 w-3" />
                    </Button>
                </div>
            ))}
            <Button
                variant="ghost"
                size="xs"
                onClick={handleAdd}
                className="self-start mt-1 h-6 gap-1 text-[10px] text-muted-foreground hover:text-foreground"
            >
                <PlusIcon className="h-3 w-3" />
                Add Row
            </Button>
        </div>
    )
}

function KeyValueSimpleEditor({
    data,
    onChange,
}: {
    data: KeyValuePair[]
    onChange: (data: KeyValuePair[]) => void
}) {
    const handleKeyChange = (index: number, key: string) => {
        const next = data.map((row, i) => (i === index ? { ...row, key } : row))
        onChange(next)
    }

    const handleValueChange = (index: number, value: string) => {
        const next = data.map((row, i) => (i === index ? { ...row, value } : row))
        onChange(next)
    }

    const handleRemove = (index: number) => {
        onChange(data.filter((_, i) => i !== index))
    }

    const handleAdd = () => {
        onChange([...data, { key: "", value: "", enabled: true }])
    }

    return (
        <div className="flex flex-col gap-1 p-2">
            {data.map((row, index) => (
                <div key={index} className="flex items-center gap-1">
                    <input
                        type="text"
                        value={row.key}
                        onChange={e => handleKeyChange(index, e.target.value)}
                        placeholder="Key"
                        className="flex-1 h-7 px-2 text-xs bg-muted/30 border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                    />
                    <input
                        type="text"
                        value={row.value}
                        onChange={e => handleValueChange(index, e.target.value)}
                        placeholder="Value"
                        className="flex-1 h-7 px-2 text-xs bg-muted/30 border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                    />
                    <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleRemove(index)}
                        className="h-7 w-7 p-0 flex-shrink-0"
                    >
                        <XIcon className="h-3 w-3" />
                    </Button>
                </div>
            ))}
            <Button
                variant="ghost"
                size="xs"
                onClick={handleAdd}
                className="self-start mt-1 h-6 gap-1 text-[10px] text-muted-foreground hover:text-foreground"
            >
                <PlusIcon className="h-3 w-3" />
                Add Row
            </Button>
        </div>
    )
}

// ─── BodyEditor ───────────────────────────────────────────────────────────────

interface BodyEditorProps {
    bodyType: BodyType
    body: string
    formData: KeyValuePair[]
    urlEncodedData: KeyValuePair[]
    binaryFile: File | null
    onBodyTypeChange: (type: BodyType) => void
    onBodyChange: (body: string) => void
    onFormDataChange: (data: KeyValuePair[]) => void
    onUrlEncodedChange: (data: KeyValuePair[]) => void
    onBinaryFileChange: (file: File | null) => void
    isDark: boolean
    method: string
}

const BODY_METHODS = ["POST", "PUT", "PATCH"]

export function BodyEditor({
    bodyType,
    body,
    formData,
    urlEncodedData,
    binaryFile,
    onBodyTypeChange,
    onBodyChange,
    onFormDataChange,
    onUrlEncodedChange,
    onBinaryFileChange,
    isDark,
    method,
}: BodyEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!BODY_METHODS.includes(method)) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">
                    No body for {method} requests
                </span>
            </div>
        )
    }

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Body type pills bar */}
            <div className="flex items-center gap-1 px-2 h-7 border-b border-border flex-shrink-0">
                {BODY_TYPES.map(bt => (
                    <button
                        key={bt.value}
                        onClick={() => onBodyTypeChange(bt.value)}
                        className={
                            `text-[10px] font-medium px-2 py-0.5 rounded transition-colors ` +
                            (bodyType === bt.value
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted")
                        }
                    >
                        {bt.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-auto">
                {bodyType === "json" && (
                    <Editor
                        height="100%"
                        language="json"
                        value={body}
                        onChange={val => onBodyChange(val ?? "")}
                        theme={isDark ? "vs-dark" : "light"}
                        options={MONACO_OPTIONS}
                    />
                )}

                {bodyType === "raw" && (
                    <Editor
                        height="100%"
                        language="plaintext"
                        value={body}
                        onChange={val => onBodyChange(val ?? "")}
                        theme={isDark ? "vs-dark" : "light"}
                        options={MONACO_OPTIONS}
                    />
                )}

                {bodyType === "form-data" && (
                    <KeyValueWithFileEditor
                        data={formData}
                        onChange={onFormDataChange}
                    />
                )}

                {bodyType === "x-www-form-urlencoded" && (
                    <KeyValueSimpleEditor
                        data={urlEncodedData}
                        onChange={onUrlEncodedChange}
                    />
                )}

                {bodyType === "binary" && (
                    <div className="flex flex-col items-center justify-center gap-3 h-full p-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={e => onBinaryFileChange(e.target.files?.[0] ?? null)}
                            className="hidden"
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="gap-1.5"
                        >
                            <UploadIcon className="h-3.5 w-3.5" />
                            <span className="text-xs">Choose File</span>
                        </Button>
                        {binaryFile && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <FileIcon className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate max-w-[200px]">{binaryFile.name}</span>
                                <span className="flex-shrink-0">
                                    ({(binaryFile.size / 1024).toFixed(1)} KB)
                                </span>
                                <button
                                    onClick={() => onBinaryFileChange(null)}
                                    className="text-muted-foreground hover:text-foreground flex-shrink-0"
                                >
                                    <XIcon className="h-3 w-3" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {bodyType === "none" && (
                    <div className="flex-1 flex items-center justify-center h-full">
                        <span className="text-xs text-muted-foreground">No body content</span>
                    </div>
                )}
            </div>
        </div>
    )
}
