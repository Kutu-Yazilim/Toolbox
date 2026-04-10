"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ShieldIcon, MinusIcon, HashIcon } from "lucide-react"
import { type JwtDecoded } from "@/utils/encoderUtils"

const ENCODING_CHARSET = "UTF-8" as const

type EncodingMode = "base64" | "url" | "html-entity" | "jwt"

interface EncoderInfoPanelProps {
    input: string
    output: string
    mode: EncodingMode
    jwtData: JwtDecoded | null
    onUrlSafeBase64: () => void
    onStripPadding: () => void
    onHexView: () => void
}

function countPaddingChars(base64: string): number {
    const match = base64.match(/=+$/)
    return match ? match[0].length : 0
}

function computeByteSize(text: string): number {
    return new TextEncoder().encode(text).length
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B"
    const units = ["B", "KB", "MB"] as const
    const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
    const value = bytes / Math.pow(1024, unitIndex)
    return `${unitIndex === 0 ? value : value.toFixed(1)} ${units[unitIndex]}`
}

function computeSizeRatio(inputSize: number, outputSize: number): string {
    if (inputSize === 0) return "--"
    return `${(outputSize / inputSize).toFixed(2)}x`
}

export function EncoderInfoPanel({
    input,
    output,
    mode,
    jwtData,
    onUrlSafeBase64,
    onStripPadding,
    onHexView,
}: EncoderInfoPanelProps) {
    const inputSize = useMemo(() => computeByteSize(input), [input])
    const outputSize = useMemo(() => computeByteSize(output), [output])

    return (
        <div className="h-full flex flex-col border-l border-border overflow-y-auto">
            <div className="px-3 h-7 flex items-center border-b border-border flex-shrink-0">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Info
                </span>
            </div>

            <div className="p-3 space-y-4 text-xs">
                {/* Size stats */}
                <div className="space-y-1.5">
                    <InfoRow label="Input size" value={formatBytes(inputSize)} />
                    <InfoRow label="Output size" value={formatBytes(outputSize)} />
                    <InfoRow label="Size ratio" value={computeSizeRatio(inputSize, outputSize)} />
                    <InfoRow label="Charset" value={ENCODING_CHARSET} />
                </div>

                {/* Base64-specific info */}
                {mode === "base64" && output && (
                    <div className="space-y-1.5 pt-2 border-t border-border">
                        <InfoRow label="Padding chars" value={String(countPaddingChars(output))} />
                    </div>
                )}

                {/* JWT-specific info */}
                {mode === "jwt" && jwtData && (
                    <div className="space-y-3 pt-2 border-t border-border">
                        <div>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Header
                            </span>
                            <pre className="mt-1 p-2 bg-muted/30 rounded text-[10px] font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-all">
                                {JSON.stringify(jwtData.header, null, 2)}
                            </pre>
                        </div>
                        <div>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Payload
                            </span>
                            <pre className="mt-1 p-2 bg-muted/30 rounded text-[10px] font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-all">
                                {JSON.stringify(jwtData.payload, null, 2)}
                            </pre>
                        </div>
                        {jwtData.expiry && (
                            <div className="space-y-1">
                                <InfoRow
                                    label="Expires"
                                    value={jwtData.expiry.date.toLocaleString()}
                                />
                                <InfoRow
                                    label="Status"
                                    value={jwtData.expiry.expired ? "Expired" : "Valid"}
                                    valueClassName={jwtData.expiry.expired ? "text-destructive" : "text-emerald-500"}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Quick actions */}
                <div className="pt-2 border-t border-border space-y-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Quick Actions
                    </span>
                    <div className="flex flex-col gap-1 mt-1">
                        <Button
                            variant="outline"
                            size="xs"
                            onClick={onUrlSafeBase64}
                            className="justify-start text-[10px]"
                        >
                            <ShieldIcon className="h-3 w-3 mr-1.5 flex-shrink-0" />
                            URL-safe Base64
                        </Button>
                        <Button
                            variant="outline"
                            size="xs"
                            onClick={onStripPadding}
                            className="justify-start text-[10px]"
                        >
                            <MinusIcon className="h-3 w-3 mr-1.5 flex-shrink-0" />
                            Strip padding
                        </Button>
                        <Button
                            variant="outline"
                            size="xs"
                            onClick={onHexView}
                            className="justify-start text-[10px]"
                        >
                            <HashIcon className="h-3 w-3 mr-1.5 flex-shrink-0" />
                            Hex view
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function InfoRow({
    label,
    value,
    valueClassName,
}: {
    label: string
    value: string
    valueClassName?: string
}) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span className={`font-mono ${valueClassName ?? "text-foreground"}`}>{value}</span>
        </div>
    )
}
