import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
    CopyIcon,
    CheckIcon,
    AlertCircleIcon,
    ArrowDownIcon,
    ArrowUpIcon,
    TrashIcon,
} from "lucide-react"
import {
    base64Encode,
    base64Decode,
    urlEncode,
    urlDecode,
    decodeJwt,
    formatRelativeTime,
    type JwtDecoded,
} from "@/utils/encoderUtils"

type Mode = "base64" | "url" | "jwt"

const EXAMPLE_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4S3ojyNuxKnD_KJbKGSmMm3gT69LxGGDBYasfU0jLuY"

export function EncoderDecoder() {
    const [mode, setMode] = useState<Mode>("base64")
    const [input, setInput] = useState("")
    const [output, setOutput] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState<"input" | "output" | null>(null)
    const [urlMode, setUrlMode] = useState<"component" | "uri">("component")

    // JWT state
    const [jwtInput, setJwtInput] = useState(EXAMPLE_JWT)
    const [jwtDecoded, setJwtDecoded] = useState<JwtDecoded | null>(null)
    const [jwtError, setJwtError] = useState<string | null>(null)
    const [jwtCopied, setJwtCopied] = useState<string | null>(null)

    const handleEncode = useCallback(() => {
        setError(null)
        try {
            if (mode === "base64") {
                setOutput(base64Encode(input))
            } else {
                setOutput(urlEncode(input, urlMode))
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Encoding failed")
        }
    }, [input, mode, urlMode])

    const handleDecode = useCallback(() => {
        setError(null)
        try {
            if (mode === "base64") {
                setOutput(base64Decode(input))
            } else {
                setOutput(urlDecode(input, urlMode))
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Decoding failed")
        }
    }, [input, mode, urlMode])

    const handleSwap = useCallback(() => {
        setInput(output)
        setOutput(input)
    }, [input, output])

    const handleCopy = async (text: string, which: "input" | "output") => {
        await navigator.clipboard.writeText(text)
        setCopied(which)
        setTimeout(() => setCopied(null), 2000)
    }

    const handleJwtDecode = useCallback(() => {
        setJwtError(null)
        setJwtDecoded(null)
        try {
            const decoded = decodeJwt(jwtInput)
            setJwtDecoded(decoded)
        } catch (e: unknown) {
            setJwtError(e instanceof Error ? e.message : "JWT decode failed")
        }
    }, [jwtInput])

    const handleJwtCopy = async (text: string, label: string) => {
        await navigator.clipboard.writeText(text)
        setJwtCopied(label)
        setTimeout(() => setJwtCopied(null), 2000)
    }

    // Auto-decode JWT on mode switch or initial load
    const handleModeSwitch = (newMode: Mode) => {
        setMode(newMode)
        if (newMode === "jwt" && jwtInput && !jwtDecoded) {
            try {
                setJwtDecoded(decodeJwt(jwtInput))
                setJwtError(null)
            } catch {
                // Let user click decode
            }
        }
    }

    return (
        <div className="h-full flex flex-col min-h-0">
            {/* Mode tabs */}
            <div className="flex items-center gap-1 px-3 h-9 border-b border-border flex-shrink-0">
                {(["base64", "url", "jwt"] as Mode[]).map(m => (
                    <button
                        key={m}
                        onClick={() => handleModeSwitch(m)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            mode === m
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                    >
                        {m === "base64" ? "Base64" : m === "url" ? "URL" : "JWT"}
                    </button>
                ))}

                {mode === "url" && (
                    <>
                        <div className="w-px h-4 bg-border mx-1" />
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
                    </>
                )}
            </div>

            {/* JWT mode */}
            {mode === "jwt" ? (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* JWT Input */}
                    <div className="flex flex-col flex-shrink-0 h-[30%]">
                        <div className="flex items-center justify-between px-3 h-7 border-b border-border">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Token</span>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="xs" onClick={handleJwtDecode}>
                                    <span className="text-[10px]">Decode</span>
                                </Button>
                                <Button variant="ghost" size="xs" onClick={() => { setJwtInput(""); setJwtDecoded(null); setJwtError(null) }}>
                                    <TrashIcon className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                        <textarea
                            value={jwtInput}
                            onChange={e => setJwtInput(e.target.value)}
                            className="flex-1 w-full px-3 py-2 text-xs font-mono bg-transparent text-foreground resize-none outline-none break-all"
                            placeholder="Paste JWT token here..."
                            spellCheck={false}
                        />
                    </div>

                    {/* JWT Error */}
                    {jwtError && (
                        <div className="px-3 py-2 bg-destructive/10 border-y border-destructive/20 flex-shrink-0">
                            <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertCircleIcon className="h-3 w-3 flex-shrink-0" />
                                {jwtError}
                            </p>
                        </div>
                    )}

                    {/* JWT decoded output */}
                    {jwtDecoded && (
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {/* Expiry banner */}
                            {jwtDecoded.expiry && (
                                <div className={`px-3 py-1.5 text-xs border-b flex items-center gap-2 ${
                                    jwtDecoded.expiry.expired
                                        ? "bg-destructive/10 border-destructive/20 text-destructive"
                                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                }`}>
                                    <span className="font-medium">
                                        {jwtDecoded.expiry.expired ? "Expired" : "Valid"}
                                    </span>
                                    <span className="text-[11px] opacity-80">
                                        {jwtDecoded.expiry.expired ? "Expired " : "Expires "}
                                        {formatRelativeTime(jwtDecoded.expiry.date)}
                                        {" — "}
                                        {jwtDecoded.expiry.date.toLocaleString()}
                                    </span>
                                </div>
                            )}

                            {/* Header */}
                            <JwtSection
                                title="Header"
                                data={jwtDecoded.header}
                                onCopy={handleJwtCopy}
                                isCopied={jwtCopied === "header"}
                                copyLabel="header"
                            />

                            {/* Payload */}
                            <JwtSection
                                title="Payload"
                                data={jwtDecoded.payload}
                                onCopy={handleJwtCopy}
                                isCopied={jwtCopied === "payload"}
                                copyLabel="payload"
                            />

                            {/* Signature */}
                            <div className="border-b border-border">
                                <div className="flex items-center justify-between px-3 h-7 bg-muted/30">
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Signature</span>
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        onClick={() => handleJwtCopy(jwtDecoded.signature, "signature")}
                                    >
                                        {jwtCopied === "signature" ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
                                    </Button>
                                </div>
                                <div className="px-3 py-2">
                                    <code className="text-[11px] font-mono text-muted-foreground break-all">
                                        {jwtDecoded.signature}
                                    </code>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Base64 / URL mode */
                <div className="flex-1 flex flex-col min-h-0">
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
                            placeholder={mode === "base64" ? "Enter text to encode/decode..." : "Enter text or URL to encode/decode..."}
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
            )}
        </div>
    )
}

// JWT section sub-component
function JwtSection({
    title,
    data,
    onCopy,
    isCopied,
    copyLabel,
}: {
    title: string
    data: Record<string, unknown>
    onCopy: (text: string, label: string) => Promise<void>
    isCopied: boolean
    copyLabel: string
}) {
    const json = JSON.stringify(data, null, 2)
    return (
        <div className="border-b border-border">
            <div className="flex items-center justify-between px-3 h-7 bg-muted/30">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
                <Button variant="ghost" size="xs" onClick={() => onCopy(json, copyLabel)}>
                    {isCopied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
                </Button>
            </div>
            <pre className="px-3 py-2 text-xs font-mono text-foreground/90 overflow-x-auto">
                {json}
            </pre>
        </div>
    )
}
