import { useState, useEffect, useRef, useCallback } from "react"
import QRCodeStyling from "qr-code-styling"
import { CopyIcon, CheckIcon, RefreshCwIcon, ShuffleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── Constants ──────────────────────────────────────────────────────────────

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

type Algorithm = "SHA-1" | "SHA-256"
type Period = 30 | 60
type Digits = 6 | 8

const PERIOD_OPTIONS: Period[] = [30, 60]
const DIGIT_OPTIONS: Digits[] = [6, 8]
const ALGORITHM_OPTIONS: Algorithm[] = ["SHA-1", "SHA-256"]

// ─── Base32 helpers ─────────────────────────────────────────────────────────

function base32Decode(input: string): Uint8Array {
  const cleaned = input.replace(/[\s=-]/g, "").toUpperCase()
  let bits = ""
  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char)
    if (idx === -1) continue
    bits += idx.toString(2).padStart(5, "0")
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return new Uint8Array(bytes)
}

function base32Encode(bytes: Uint8Array): string {
  let bits = ""
  for (const b of bytes) {
    bits += b.toString(2).padStart(8, "0")
  }
  let result = ""
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0")
    result += BASE32_ALPHABET[parseInt(chunk, 2)]
  }
  return result
}

function generateRandomSecret(): string {
  const bytes = new Uint8Array(20)
  crypto.getRandomValues(bytes)
  return base32Encode(bytes)
}

// ─── TOTP algorithm ─────────────────────────────────────────────────────────

async function computeTotp(
  secret: string,
  period: Period,
  digits: Digits,
  algorithm: Algorithm,
): Promise<string> {
  const keyBytes = base32Decode(secret)
  if (keyBytes.length === 0) return "".padStart(digits, "-")

  const time = Math.floor(Date.now() / 1000)
  const counter = Math.floor(time / period)

  const counterBuf = new ArrayBuffer(8)
  const view = new DataView(counterBuf)
  view.setUint32(0, Math.floor(counter / 0x100000000))
  view.setUint32(4, counter & 0xffffffff)

  const hashName = algorithm === "SHA-256" ? "SHA-256" : "SHA-1"

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes.buffer as ArrayBuffer,
    { name: "HMAC", hash: hashName },
    false,
    ["sign"],
  )

  const sig = await crypto.subtle.sign("HMAC", key, counterBuf)
  const hmac = new Uint8Array(sig)

  const offset = hmac[hmac.length - 1] & 0x0f
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  const mod = Math.pow(10, digits)
  return (code % mod).toString().padStart(digits, "0")
}

function formatCode(code: string, digits: Digits): string {
  const half = Math.floor(digits / 2)
  return `${code.slice(0, half)} ${code.slice(half)}`
}

function buildOtpauthUri(
  secret: string,
  issuer: string,
  account: string,
  algorithm: Algorithm,
  digits: Digits,
  period: Period,
): string {
  const label = issuer
    ? `${encodeURIComponent(issuer)}:${encodeURIComponent(account || "user")}`
    : encodeURIComponent(account || "user")
  const params = new URLSearchParams({
    secret,
    issuer: issuer || "App",
    algorithm: algorithm === "SHA-256" ? "SHA256" : "SHA1",
    digits: String(digits),
    period: String(period),
  })
  return `otpauth://totp/${label}?${params.toString()}`
}

// ─── Component ──────────────────────────────────────────────────────────────

export function TotpGenerator() {
  const qrRef = useRef<HTMLDivElement>(null)
  const qrInstance = useRef<QRCodeStyling | null>(null)

  const [secret, setSecret] = useState("JBSWY3DPEHPK3PXP")
  const [account, setAccount] = useState("")
  const [issuer, setIssuer] = useState("")
  const [period, setPeriod] = useState<Period>(30)
  const [digits, setDigits] = useState<Digits>(6)
  const [algorithm, setAlgorithm] = useState<Algorithm>("SHA-1")

  const [code, setCode] = useState("")
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  // Compute TOTP code
  const refreshCode = useCallback(async () => {
    if (!secret.trim()) {
      setCode("".padStart(digits, "-"))
      setError("")
      return
    }
    try {
      const result = await computeTotp(secret, period, digits, algorithm)
      setCode(result)
      setError("")
    } catch {
      setCode("".padStart(digits, "-"))
      setError("Invalid secret key")
    }
  }, [secret, period, digits, algorithm])

  // Timer: update seconds remaining + refresh code on period boundary
  useEffect(() => {
    const tick = () => {
      const now = Math.floor(Date.now() / 1000)
      const remaining = period - (now % period)
      setSecondsLeft(remaining)
    }
    tick()
    refreshCode()

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000)
      const remaining = period - (now % period)
      setSecondsLeft(remaining)
      if (remaining === period) {
        refreshCode()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [period, refreshCode])

  // Also refresh when config changes
  useEffect(() => {
    refreshCode()
  }, [refreshCode])

  // QR code
  useEffect(() => {
    const uri = buildOtpauthUri(secret, issuer, account, algorithm, digits, period)
    if (!qrInstance.current) {
      qrInstance.current = new QRCodeStyling({
        width: 200,
        height: 200,
        data: uri,
        margin: 8,
        dotsOptions: { type: "rounded", color: "#000000" },
        backgroundOptions: { color: "#ffffff" },
        cornersSquareOptions: { type: "extra-rounded", color: "#000000" },
      })
      if (qrRef.current) {
        qrRef.current.innerHTML = ""
        qrInstance.current.append(qrRef.current)
      }
    } else {
      qrInstance.current.update({ data: uri })
    }
  }, [secret, issuer, account, algorithm, digits, period])

  const handleCopy = useCallback(() => {
    if (!code || code.includes("-")) return
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [code])

  const handleGenerateSecret = useCallback(() => {
    setSecret(generateRandomSecret())
  }, [])

  // Countdown ring
  const progress = secondsLeft / period
  const circumference = 2 * Math.PI * 40
  const dashOffset = circumference * (1 - progress)

  return (
    <div className="h-full flex flex-col-reverse md:flex-row min-h-0 overflow-hidden">
      {/* ── Left panel: inputs & config ── */}
      <div className="w-full md:w-80 md:flex-shrink-0 flex flex-col border-t md:border-t-0 md:border-r border-border max-h-[50vh] md:max-h-none overflow-y-auto">
        {/* Secret key */}
        <div className="p-4 border-b border-border">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
            Secret Key (Base32)
          </label>
          <input
            type="text"
            value={secret}
            onChange={(e) => setSecret(e.target.value.toUpperCase().replace(/[^A-Z2-7=]/g, ""))}
            className="w-full px-3 py-2 text-sm bg-muted/30 border border-border rounded-lg text-foreground font-mono outline-none focus:ring-1 focus:ring-ring"
            placeholder="JBSWY3DPEHPK3PXP"
            spellCheck={false}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSecret}
            className="mt-2 gap-1.5 w-full"
          >
            <ShuffleIcon className="h-3.5 w-3.5" />
            Generate Random Secret
          </Button>
        </div>

        {/* Account & Issuer */}
        <div className="p-4 border-b border-border space-y-3">
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
              Account Name
            </label>
            <input
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-muted/30 border border-border rounded-lg text-foreground outline-none focus:ring-1 focus:ring-ring"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
              Issuer
            </label>
            <input
              type="text"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-muted/30 border border-border rounded-lg text-foreground outline-none focus:ring-1 focus:ring-ring"
              placeholder="MyApp"
            />
          </div>
        </div>

        {/* Period */}
        <div className="p-4 border-b border-border">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-2">
            Period
          </label>
          <div className="flex gap-1.5">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "flex-1 py-1.5 rounded-lg border text-xs transition-all",
                  period === p
                    ? "border-primary bg-primary/10 text-foreground font-medium"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {p}s
              </button>
            ))}
          </div>
        </div>

        {/* Digits */}
        <div className="p-4 border-b border-border">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-2">
            Digits
          </label>
          <div className="flex gap-1.5">
            {DIGIT_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDigits(d)}
                className={cn(
                  "flex-1 py-1.5 rounded-lg border text-xs transition-all",
                  digits === d
                    ? "border-primary bg-primary/10 text-foreground font-medium"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {d} digits
              </button>
            ))}
          </div>
        </div>

        {/* Algorithm */}
        <div className="p-4">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-2">
            Algorithm
          </label>
          <div className="flex gap-1.5">
            {ALGORITHM_OPTIONS.map((a) => (
              <button
                key={a}
                onClick={() => setAlgorithm(a)}
                className={cn(
                  "flex-1 py-1.5 rounded-lg border text-xs transition-all",
                  algorithm === a
                    ? "border-primary bg-primary/10 text-foreground font-medium"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel: TOTP display + QR ── */}
      <div className="flex-shrink-0 md:flex-1 flex flex-col items-center justify-center gap-6 p-4 md:p-8">
        {/* Countdown ring + code */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <svg width="100" height="100" className="transform -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                strokeWidth="4"
                className="stroke-muted"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className={cn(
                  "transition-all duration-1000 linear",
                  secondsLeft <= 5 ? "stroke-destructive" : "stroke-primary",
                )}
              />
            </svg>
            <span
              className={cn(
                "absolute text-2xl font-mono font-bold",
                secondsLeft <= 5 ? "text-destructive" : "text-foreground",
              )}
            >
              {secondsLeft}
            </span>
          </div>

          {/* TOTP code */}
          <div className="text-center">
            <p className="text-5xl md:text-6xl font-mono font-bold tracking-widest text-foreground select-all">
              {formatCode(code, digits)}
            </p>
            {error && (
              <p className="text-xs text-destructive mt-2">{error}</p>
            )}
          </div>

          {/* Copy button */}
          <Button
            onClick={handleCopy}
            disabled={!code || code.includes("-")}
            className="gap-2"
          >
            {copied ? (
              <>
                <CheckIcon className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <CopyIcon className="h-4 w-4" />
                Copy Code
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshCode}
            className="gap-1.5"
          >
            <RefreshCwIcon className="h-3.5 w-3.5" />
            Refresh Now
          </Button>
        </div>

        {/* QR code */}
        {secret.trim() && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Scan with Authenticator App
            </p>
            <div className="rounded-2xl shadow-lg overflow-hidden ring-1 ring-border bg-white">
              <div ref={qrRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
