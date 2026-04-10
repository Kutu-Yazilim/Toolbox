"use client"

import { useState, useCallback, useMemo } from "react"
import {
  CopyIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  UnlockIcon,
  InfoIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { type ExportOption } from "@/components/shared/ExportMenu"
import { useFileImport } from "@/hooks/useFileImport"
import { ENCRYPTION_PRESETS } from "./encryptionPresets"

// ─── Types & constants ──────────────────────────────────────────────────────

type Mode = "encrypt" | "decrypt"

const SALT_LENGTH = 16
const IV_LENGTH = 12
const PBKDF2_ITERATIONS = 100000

// ─── Crypto helpers (Web Crypto API) ────────────────────────────────────────

async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  )
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  )
}

async function encryptText(
  plaintext: string,
  passphrase: string,
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(passphrase, salt)

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  )

  // Concatenate salt(16) + iv(12) + ciphertext, then base64 encode
  const combined = new Uint8Array(
    SALT_LENGTH + IV_LENGTH + ciphertext.byteLength,
  )
  combined.set(salt, 0)
  combined.set(iv, SALT_LENGTH)
  combined.set(new Uint8Array(ciphertext), SALT_LENGTH + IV_LENGTH)

  return btoa(String.fromCharCode(...combined))
}

async function decryptText(
  base64: string,
  passphrase: string,
): Promise<string> {
  const raw = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))

  if (raw.length < SALT_LENGTH + IV_LENGTH + 1) {
    throw new Error("Invalid encrypted data")
  }

  const salt = raw.slice(0, SALT_LENGTH)
  const iv = raw.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const ciphertext = raw.slice(SALT_LENGTH + IV_LENGTH)
  const key = await deriveKey(passphrase, salt)

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  )

  return new TextDecoder().decode(decrypted)
}

// ─── Component ──────────────────────────────────────────────────────────────

export function EncryptionTool() {
  const [mode, setMode] = useState<Mode>("encrypt")
  const [passphrase, setPassphrase] = useState("")
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [processing, setProcessing] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleAction = useCallback(async () => {
    if (!passphrase.trim() || !input.trim()) return

    setProcessing(true)
    setError("")
    setOutput("")

    try {
      if (mode === "encrypt") {
        const result = await encryptText(input, passphrase)
        setOutput(result)
      } else {
        const result = await decryptText(input.trim(), passphrase)
        setOutput(result)
      }
    } catch {
      setError(
        mode === "decrypt"
          ? "Decryption failed. Wrong passphrase or corrupted data."
          : "Encryption failed. Please try again.",
      )
    } finally {
      setProcessing(false)
    }
  }, [mode, passphrase, input])

  const handleCopy = useCallback(() => {
    if (!output) return
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [output])

  const handleModeSwitch = useCallback(
    (newMode: Mode) => {
      if (newMode === mode) return
      setMode(newMode)
      setInput("")
      setOutput("")
      setError("")
    },
    [mode],
  )

  const handlePresetSelect = useCallback((preset: Preset) => {
    setInput(preset.content)
    setMode("encrypt")
    setOutput("")
    setError("")
  }, [])

  const { dropzoneProps, isDragging } = useFileImport({
    accept: [".txt", ".pem", ".key"],
    onImport: (content) => {
      setInput(content)
      setOutput("")
      setError("")
    },
  })

  const exportOptions = useMemo<ExportOption[]>(() => [
    { label: "Copy Output", action: () => output && navigator.clipboard.writeText(output) },
    { label: "Download Output", action: () => {
      if (!output) return
      const blob = new Blob([output], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = mode === "encrypt" ? "encrypted.txt" : "decrypted.txt"; a.click()
      URL.revokeObjectURL(url)
    }},
  ], [output, mode])

  const shortcuts = useMemo<Shortcut[]>(() => [
    { key: "mod+enter", label: "Encrypt / Decrypt", action: handleAction },
    { key: "mod+shift+c", label: "Copy Output", action: handleCopy },
  ], [handleAction, handleCopy])

  useKeyboardShortcuts(shortcuts)

  return (
    <div className="h-full flex flex-col min-h-0" {...dropzoneProps}>
      <ToolToolbar
        title="Encryption Tool"
        status={output ? { type: "success", label: mode === "encrypt" ? "Encrypted" : "Decrypted" } : error ? { type: "error", label: "Failed" } : null}
        copyValue={output || undefined}
        exportOptions={output ? exportOptions : undefined}
        presets={ENCRYPTION_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/5 border-2 border-dashed border-primary rounded-lg">
          <p className="text-sm text-primary font-medium">Drop file to import</p>
        </div>
      )}
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        {/* Mode toggle */}
        <div className="flex items-center gap-1.5 rounded-lg border bg-muted/40 p-1">
          {(["encrypt", "decrypt"] as const).map((m) => (
            <button
              key={m}
              onClick={() => handleModeSwitch(m)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                mode === m
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Disclaimer */}
        <div className="flex items-start gap-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3.5 py-2.5 text-xs text-blue-400/80">
          <InfoIcon className="size-3.5 mt-0.5 shrink-0" />
          <span>
            This tool uses AES-256-GCM encryption for educational and
            convenience purposes. For production security, use established
            cryptography libraries.
          </span>
        </div>

        {/* Passphrase input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Passphrase
          </label>
          <div className="relative">
            <input
              type={showPassphrase ? "text" : "password"}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter your passphrase..."
              className="w-full rounded-lg border bg-muted/30 px-3 py-2.5 pr-10 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <button
              onClick={() => setShowPassphrase((p) => !p)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassphrase ? (
                <EyeOffIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </button>
          </div>
        </div>

        {/* Input textarea */}
        <div className="flex flex-col gap-1.5 flex-1 min-h-0">
          <label className="text-xs font-medium text-muted-foreground">
            {mode === "encrypt" ? "Plaintext" : "Encrypted Text (Base64)"}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "encrypt"
                ? "Enter text to encrypt..."
                : "Paste base64 encrypted text..."
            }
            className="flex-1 min-h-[120px] resize-none rounded-lg border bg-muted/30 px-3 py-2.5 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        {/* Action button */}
        <Button
          onClick={handleAction}
          disabled={processing || !passphrase.trim() || !input.trim()}
          className="w-full"
        >
          {mode === "encrypt" ? (
            <LockIcon className="size-4" />
          ) : (
            <UnlockIcon className="size-4" />
          )}
          {processing
            ? "Processing..."
            : mode === "encrypt"
              ? "Encrypt"
              : "Decrypt"}
        </Button>

        {/* Error message */}
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3.5 py-2.5 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {mode === "encrypt" ? "Encrypted Output" : "Decrypted Output"}
            </label>
            <div className="rounded-lg border bg-muted/30 px-3 py-2.5 text-sm font-mono break-all select-all whitespace-pre-wrap min-h-[80px]">
              {output}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
