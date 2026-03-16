import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
    CopyIcon,
    CheckIcon,
    AlertCircleIcon,
    ArrowDownIcon,
    ArrowUpIcon,
} from "lucide-react"
import { base64Encode, base64Decode } from "@/utils/encoderUtils"

export function Base64Encoder() {
    const [input, setInput] = useState("")
    const [output, setOutput] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState<"input" | "output" | null>(null)

    const handleEncode = useCallback(() => {
        setError(null)
        try {
            setOutput(base64Encode(input))
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Encoding failed")
        }
    }, [input])

    const handleDecode = useCallback(() => {
        setError(null)
        try {
            setOutput(base64Decode(input))
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Decoding failed")
        }
    }, [input])

    const handleSwap = useCallback(() => {
        setInput(output)
        setOutput(input)
    }, [input, output])

    const handleCopy = async (text: string, which: "input" | "output") => {
        await navigator.clipboard.writeText(text)
        setCopied(which)
        setTimeout(() => setCopied(null), 2000)
    }

    return (
        <div className="h-full flex flex-col min-h-0">
            {/* Input */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between px-3 h-7 border-b border-border flex-shrink-0">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Input</span>
                    <Button variant="ghost" size="xs" onClick={() => handleCopy(input, "input")}>
                        {copied === "input" ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
                    </Button>
                </div>
                <textarea
                    value={input}
                    onChange={e => { setInput(e.target.value); setError(null) }}
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
                <div className="flex items-center justify-between px-3 h-7 border-b border-border flex-shrink-0">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Output</span>
                    <Button variant="ghost" size="xs" onClick={() => handleCopy(output, "output")} disabled={!output}>
                        {copied === "output" ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
                    </Button>
                </div>
                <textarea
                    value={output}
                    readOnly
                    className="flex-1 w-full px-3 py-2 text-sm font-mono bg-muted/10 text-foreground resize-none outline-none"
                    placeholder="Result will appear here..."
                />
            </div>
        </div>
    )
}
