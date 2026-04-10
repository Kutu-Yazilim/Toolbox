"use client"

import { Button } from "@/components/ui/button"
import { PlusIcon, XIcon } from "lucide-react"
import { type KeyValuePair } from "./apiTypes"

interface HeadersEditorProps {
    headers: KeyValuePair[]
    onChange: (headers: KeyValuePair[]) => void
}

export function HeadersEditor({ headers, onChange }: HeadersEditorProps) {
    const enabledCount = headers.filter(h => h.enabled).length

    const addHeader = () => {
        onChange([...headers, { key: "", value: "", enabled: true }])
    }

    const removeHeader = (index: number) => {
        onChange(headers.filter((_, i) => i !== index))
    }

    const updateHeader = (index: number, field: keyof KeyValuePair, value: string | boolean) => {
        onChange(headers.map((h, i) => (i === index ? { ...h, [field]: value } : h)))
    }

    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between px-3 h-7 border-b border-border">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Headers ({enabledCount})
                </span>
                <Button variant="ghost" size="xs" onClick={addHeader} title="Add header">
                    <PlusIcon className="h-3 w-3" />
                </Button>
            </div>
            <div>
                {headers.length === 0 ? (
                    <div className="px-3 py-2 text-[11px] text-muted-foreground">
                        No headers. Click + to add one.
                    </div>
                ) : (
                    headers.map((header, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-3 py-1">
                            <input
                                type="checkbox"
                                checked={header.enabled}
                                onChange={e => updateHeader(i, "enabled", e.target.checked)}
                                className="rounded accent-primary flex-shrink-0"
                            />
                            <input
                                type="text"
                                value={header.key}
                                onChange={e => updateHeader(i, "key", e.target.value)}
                                placeholder="Key"
                                className="flex-1 min-w-0 h-5 px-1.5 text-[11px] font-mono bg-transparent border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                                spellCheck={false}
                            />
                            <input
                                type="text"
                                value={header.value}
                                onChange={e => updateHeader(i, "value", e.target.value)}
                                placeholder="Value"
                                className="flex-1 min-w-0 h-5 px-1.5 text-[11px] font-mono bg-transparent border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                                spellCheck={false}
                            />
                            <Button variant="ghost" size="xs" onClick={() => removeHeader(i)} title="Remove header">
                                <XIcon className="h-3 w-3" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
