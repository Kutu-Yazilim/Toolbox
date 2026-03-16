import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
    CopyIcon,
    CheckIcon,
    AlertCircleIcon,
    ArrowDownIcon,
    ArrowUpIcon,
} from "lucide-react"
import { urlEncode, urlDecode } from "@/utils/encoderUtils"

export function UrlEncoder() {
    const [input, setInput] = useState("")
    const [output, setOutput] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState<"input" | "output" | null>(null)
    const [urlMode, setUrlMode] = useState<"component" | "uri">("component")

    const handleEncode = useCallback(() => {
        setError(null)
        try {
            setOutput(urlEncode(input, urlMode))
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Encoding failed")
        }
    }, [input, urlMode])

    const handleDecode = useCallback(() => {
        setError(null)
        try {
            setOutput(urlDecode(input, urlMode))
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Decoding failed")
        }
    }, [input, urlMode])

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
            {/* URL sub-mode toggle */}
            <div className="flex items-center gap-1 px-3 h-8 border-b border-border flex-shrink-0 bg-muted/10">
                <button
                    onClick={() => setUrlMode("component")}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                        urlMode === "component"
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    component
                </button>
                <button
                    onClick={() => setUrlMode("uri")}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                        urlMode === "uri"
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    uri
                </button>
            </div>

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
                    placeholder="Enter text or URL to encode/decode..."
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
