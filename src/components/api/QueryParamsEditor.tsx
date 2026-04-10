"use client"

import { Button } from "@/components/ui/button"
import { PlusIcon, XIcon } from "lucide-react"
import { type KeyValuePair } from "./apiTypes"

interface QueryParamsEditorProps {
    params: KeyValuePair[]
    onChange: (params: KeyValuePair[]) => void
}

export function QueryParamsEditor({ params, onChange }: QueryParamsEditorProps) {
    const enabledCount = params.filter(p => p.enabled).length

    const addParam = () => {
        onChange([...params, { key: "", value: "", enabled: true }])
    }

    const removeParam = (index: number) => {
        onChange(params.filter((_, i) => i !== index))
    }

    const updateParam = (index: number, field: keyof KeyValuePair, value: string | boolean) => {
        onChange(params.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
    }

    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between px-3 h-7 border-b border-border">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Params ({enabledCount})
                </span>
                <Button variant="ghost" size="xs" onClick={addParam} title="Add param">
                    <PlusIcon className="h-3 w-3" />
                </Button>
            </div>
            <div>
                {params.length === 0 ? (
                    <div className="px-3 py-2 text-[11px] text-muted-foreground">
                        No query params. Click + to add one.
                    </div>
                ) : (
                    params.map((param, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-3 py-1">
                            <input
                                type="checkbox"
                                checked={param.enabled}
                                onChange={e => updateParam(i, "enabled", e.target.checked)}
                                className="rounded accent-primary flex-shrink-0"
                            />
                            <input
                                type="text"
                                value={param.key}
                                onChange={e => updateParam(i, "key", e.target.value)}
                                placeholder="Key"
                                className="flex-1 min-w-0 h-5 px-1.5 text-[11px] font-mono bg-transparent border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                                spellCheck={false}
                            />
                            <input
                                type="text"
                                value={param.value}
                                onChange={e => updateParam(i, "value", e.target.value)}
                                placeholder="Value"
                                className="flex-1 min-w-0 h-5 px-1.5 text-[11px] font-mono bg-transparent border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                                spellCheck={false}
                            />
                            <Button variant="ghost" size="xs" onClick={() => removeParam(i)} title="Remove param">
                                <XIcon className="h-3 w-3" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
