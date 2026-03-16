import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
    CopyIcon,
    CheckIcon,
    AlertCircleIcon,
    KeyRoundIcon,
    LockIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── JWT Signing (Web Crypto API — no external dep) ──────────────────────────

type Alg = "HS256" | "HS384" | "HS512"

function b64urlEncode(bytes: ArrayBuffer | string): string {
    let base64: string
    if (typeof bytes === "string") {
        base64 = btoa(unescape(encodeURIComponent(bytes)))
    } else {
        const arr = new Uint8Array(bytes)
        base64 = btoa(String.fromCharCode(...arr))
    }
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

async function signJwt(
    header: Record<string, unknown>,
    payload: Record<string, unknown>,
    secret: string,
    alg: Alg
): Promise<string> {
    const enc = new TextEncoder()
    const hashMap: Record<Alg, string> = {
        HS256: "SHA-256",
        HS384: "SHA-384",
        HS512: "SHA-512",
    }
    const headerB64 = b64urlEncode(JSON.stringify(header))
    const payloadB64 = b64urlEncode(JSON.stringify(payload))
    const data = `${headerB64}.${payloadB64}`

    const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "HMAC", hash: hashMap[alg] },
        false,
        ["sign"]
    )
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data))
    return `${data}.${b64urlEncode(sig)}`
}

// ─── Coloured JWT display ─────────────────────────────────────────────────────

function ColoredJwt({ token }: { token: string }) {
    const parts = token.split(".")
    if (parts.length !== 3) return <span className="text-muted-foreground">{token}</span>
    return (
        <span className="break-all font-mono text-xs leading-relaxed">
            <span className="text-red-400">{parts[0]}</span>
            <span className="text-foreground/40">.</span>
            <span className="text-violet-400">{parts[1]}</span>
            <span className="text-foreground/40">.</span>
            <span className="text-cyan-400">{parts[2]}</span>
        </span>
    )
}

// ─── Sample data ─────────────────────────────────────────────────────────────

const DEFAULT_HEADER = JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2)
const DEFAULT_PAYLOAD = JSON.stringify(
    {
        sub: "1234567890",
        name: "John Doe",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
    },
    null,
    2
)

// ─── Forge component ──────────────────────────────────────────────────────────

export function JwtForge() {
    const [mobilePanel, setMobilePanel] = useState<"input" | "output">("input")
    const [alg, setAlg] = useState<Alg>("HS256")
    const [headerText, setHeaderText] = useState(DEFAULT_HEADER)
    const [payloadText, setPayloadText] = useState(DEFAULT_PAYLOAD)
    const [secret, setSecret] = useState("your-256-bit-secret")
    const [output, setOutput] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [signing, setSigning] = useState(false)

    const handleSign = useCallback(async () => {
        setError(null)
        setSigning(true)
        try {
            let header: Record<string, unknown>
            let payload: Record<string, unknown>
            try {
                header = JSON.parse(headerText)
            } catch {
                throw new Error("Header is not valid JSON")
            }
            try {
                payload = JSON.parse(payloadText)
            } catch {
                throw new Error("Payload is not valid JSON")
            }
            // Force alg in header
            header.alg = alg
            header.typ = header.typ ?? "JWT"

            const token = await signJwt(header, payload, secret, alg)
            setOutput(token)
            setMobilePanel("output")
        } catch (e) {
            setError(e instanceof Error ? e.message : "Signing failed")
        } finally {
            setSigning(false)
        }
    }, [alg, headerText, payloadText, secret])

    const handleCopy = async () => {
        if (!output) return
        await navigator.clipboard.writeText(output)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="h-full flex flex-col md:flex-row min-h-0 overflow-hidden">
            <div className="md:hidden flex items-center gap-1 px-3 h-8 border-b border-border bg-muted/10 flex-shrink-0">
                <button
                    onClick={() => setMobilePanel("input")}
                    className={cn(
                        "px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-wider transition-colors",
                        mobilePanel === "input"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                >
                    Input
                </button>
                <button
                    onClick={() => setMobilePanel("output")}
                    className={cn(
                        "px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-wider transition-colors",
                        mobilePanel === "output"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                >
                    Output
                </button>
            </div>

            {/* Left: inputs */}
            <div
                className={cn(
                    "flex-1 flex-col min-h-0 border-b md:border-b-0 md:border-r border-border overflow-y-auto",
                    mobilePanel === "input" ? "flex" : "hidden md:flex"
                )}
            >
                {/* Algorithm */}
                <div className="flex items-center gap-2 px-3 h-9 border-b border-border flex-shrink-0 bg-muted/20">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        Algorithm
                    </span>
                    <div className="flex items-center gap-1 ml-1">
                        {(["HS256", "HS384", "HS512"] as Alg[]).map(a => (
                            <button
                                key={a}
                                onClick={() => {
                                    setAlg(a)
                                    setHeaderText(JSON.stringify({ alg: a, typ: "JWT" }, null, 2))
                                }}
                                className={cn(
                                    "px-2.5 py-0.5 rounded text-[10px] font-mono font-medium transition-colors",
                                    alg === a
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                {a}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Header */}
                <div className="flex flex-col flex-shrink-0 border-b border-border" style={{ height: "25%" }}>
                    <div className="flex items-center px-3 h-7 border-b border-border bg-muted/20">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">Header</span>
                    </div>
                    <textarea
                        value={headerText}
                        onChange={e => setHeaderText(e.target.value)}
                        className="flex-1 w-full px-3 py-2 text-xs font-mono bg-transparent text-foreground resize-none outline-none leading-relaxed"
                        spellCheck={false}
                    />
                </div>

                {/* Payload */}
                <div className="flex flex-col flex-1 min-h-0 border-b border-border">
                    <div className="flex items-center px-3 h-7 border-b border-border bg-muted/20 flex-shrink-0">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">Payload</span>
                    </div>
                    <textarea
                        value={payloadText}
                        onChange={e => setPayloadText(e.target.value)}
                        className="flex-1 w-full px-3 py-2 text-xs font-mono bg-transparent text-foreground resize-none outline-none leading-relaxed"
                        spellCheck={false}
                    />
                </div>

                {/* Secret */}
                <div className="flex-shrink-0 border-b border-border">
                    <div className="flex items-center px-3 h-7 border-b border-border bg-muted/20">
                        <LockIcon className="h-3 w-3 mr-1.5 text-muted-foreground" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">Secret</span>
                    </div>
                    <input
                        type="text"
                        value={secret}
                        onChange={e => setSecret(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono bg-transparent text-foreground outline-none"
                        placeholder="Enter HMAC secret..."
                        spellCheck={false}
                    />
                </div>

                {/* Sign button */}
                <div className="px-3 py-2.5 flex-shrink-0">
                    <Button
                        onClick={handleSign}
                        disabled={signing}
                        className="w-full text-xs h-8"
                    >
                        {signing ? "Signing..." : "Sign & Generate Token"}
                    </Button>
                    {error && (
                        <p className="text-xs text-destructive flex items-center gap-1.5 mt-2">
                            <AlertCircleIcon className="h-3.5 w-3.5 flex-shrink-0" />
                            {error}
                        </p>
                    )}
                </div>
            </div>

            {/* Right: output */}
            <div
                className={cn(
                    "flex-1 flex-col min-h-0",
                    mobilePanel === "output" ? "flex" : "hidden md:flex"
                )}
            >
                <div className="flex items-center justify-between px-3 h-8 border-b border-border bg-muted/20 flex-shrink-0">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        Generated Token
                    </span>
                    {output && (
                        <Button variant="ghost" size="xs" onClick={handleCopy}>
                            {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
                        </Button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-3">
                    {output ? (
                        <div className="space-y-4">
                            {/* Colour-coded token */}
                            <div className="p-3 rounded-lg bg-muted/30 border border-border">
                                <ColoredJwt token={output} />
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-3 text-[10px]">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                                    <span className="text-muted-foreground">Header</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
                                    <span className="text-muted-foreground">Payload</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                                    <span className="text-muted-foreground">Signature</span>
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <KeyRoundIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p className="text-xs">Fill in the fields and click Sign</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
