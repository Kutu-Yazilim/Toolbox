"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CopyIcon, CheckIcon, LoaderIcon } from "lucide-react"
import Editor from "@monaco-editor/react"
import { type ApiResponse, MONACO_OPTIONS } from "./apiTypes"
import { detectLanguage, formatSize } from "./apiUtils"
import { StatusBadge } from "./StatusBadge"

interface ResponsePanelProps {
    response: ApiResponse | null
    loading: boolean
    error: string | null
    isDark: boolean
}

interface TimingBreakdownProps {
    time: number
}

function TimingBreakdown({ time }: TimingBreakdownProps) {
    return (
        <div className="p-4 space-y-3">
            <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                    <span>Total</span>
                    <span className="font-mono">{time} ms</span>
                </div>
                <div className="h-4 w-full rounded bg-muted overflow-hidden">
                    <div
                        className="h-full rounded bg-primary"
                        style={{ width: "100%" }}
                    />
                </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
                Detailed breakdown requires the Resource Timing API, which may not be available in all environments.
            </p>
        </div>
    )
}

export function ResponsePanel({ response, loading, error, isDark }: ResponsePanelProps) {
    const [copiedHeader, setCopiedHeader] = useState<string | null>(null)

    function handleCopyHeader(key: string, value: string) {
        navigator.clipboard.writeText(value).then(() => {
            setCopiedHeader(key)
            setTimeout(() => setCopiedHeader(null), 1500)
        })
    }

    const sortedHeaders = response
        ? Object.entries(response.headers).sort(([a], [b]) => a.localeCompare(b))
        : []

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Status bar */}
            <div className="h-7 border-b px-3 flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-medium text-muted-foreground tracking-wider">
                    RESPONSE
                </span>
                {response && !error && (
                    <>
                        <StatusBadge status={response.status} />
                        <span className="text-[11px] text-muted-foreground font-mono">
                            {response.time} ms
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                            {formatSize(response.size)}
                        </span>
                    </>
                )}
                {error && (
                    <span className="text-[11px] text-destructive truncate">{error}</span>
                )}
            </div>

            {/* Content area */}
            <div className="flex-1 min-h-0 flex flex-col">
                {loading && (
                    <div className="flex-1 flex items-center justify-center">
                        <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
                    </div>
                )}

                {!loading && response && (
                    <Tabs defaultValue="body" className="flex-1 min-h-0 flex flex-col">
                        <TabsList
                            variant="line"
                            className="h-8 px-3 shrink-0 w-full justify-start border-b rounded-none"
                        >
                            <TabsTrigger value="body" className="text-[11px]">
                                Body
                            </TabsTrigger>
                            <TabsTrigger value="headers" className="text-[11px]">
                                Headers
                            </TabsTrigger>
                            <TabsTrigger value="timing" className="text-[11px]">
                                Timing
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="body" className="flex-1 min-h-0">
                            <Editor
                                height="100%"
                                language={detectLanguage(response.body)}
                                value={response.body}
                                theme={isDark ? "vs-dark" : "light"}
                                options={{ ...MONACO_OPTIONS, readOnly: true }}
                            />
                        </TabsContent>

                        <TabsContent value="headers" className="flex-1 min-h-0 overflow-auto">
                            <div className="divide-y">
                                {sortedHeaders.map(([key, value]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => handleCopyHeader(key, value)}
                                        className="group w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-muted/50 transition-colors"
                                    >
                                        <span className="w-40 shrink-0 truncate text-[11px] text-muted-foreground font-mono">
                                            {key}
                                        </span>
                                        <span className="flex-1 truncate text-[11px] font-mono">
                                            {value}
                                        </span>
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            {copiedHeader === key ? (
                                                <CheckIcon className="size-3 text-emerald-500" />
                                            ) : (
                                                <CopyIcon className="size-3 text-muted-foreground" />
                                            )}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="timing" className="flex-1 min-h-0 overflow-auto">
                            <TimingBreakdown time={response.time} />
                        </TabsContent>
                    </Tabs>
                )}

                {!loading && !response && !error && (
                    <div className="flex-1 flex items-center justify-center">
                        <span className="text-[13px] text-muted-foreground">
                            Send a request to see the response
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
