"use client"

import { useState, useMemo, useCallback } from "react"
import { CopyIcon, CheckIcon, BookOpenIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── Transliteration map ────────────────────────────────────────────────────

const TRANSLITERATION_MAP: Record<string, string> = {
  // Turkish
  ç: "c", Ç: "C", ğ: "g", Ğ: "G", ı: "i", İ: "I",
  ş: "s", Ş: "S", ö: "o", Ö: "O", ü: "u", Ü: "U",
  // German
  ä: "ae", Ä: "Ae", ß: "ss",
  // French / Spanish / Portuguese
  à: "a", â: "a", á: "a", ã: "a", å: "a",
  À: "A", Â: "A", Á: "A", Ã: "A", Å: "A",
  è: "e", é: "e", ê: "e", ë: "e",
  È: "E", É: "E", Ê: "E", Ë: "E",
  ì: "i", í: "i", î: "i", ï: "i",
  Ì: "I", Í: "I", Î: "I", Ï: "I",
  ò: "o", ó: "o", ô: "o", õ: "o",
  Ò: "O", Ó: "O", Ô: "O", Õ: "O",
  ù: "u", ú: "u", û: "u",
  Ù: "U", Ú: "U", Û: "U",
  ñ: "n", Ñ: "N",
  ý: "y", ÿ: "y", Ý: "Y",
  // Polish
  ą: "a", Ą: "A", ć: "c", Ć: "C", ę: "e", Ę: "E",
  ł: "l", Ł: "L", ń: "n", Ń: "N", ś: "s", Ś: "S",
  ź: "z", Ź: "Z", ż: "z", Ż: "Z",
  // Czech
  č: "c", Č: "C", ď: "d", Ď: "D", ě: "e", Ě: "E",
  ň: "n", Ň: "N", ř: "r", Ř: "R", š: "s", Š: "S",
  ť: "t", Ť: "T", ů: "u", Ů: "U", ž: "z", Ž: "Z",
  // Scandinavian
  æ: "ae", Æ: "Ae", ø: "o", Ø: "O",
  // Romanian
  ă: "a", Ă: "A", ț: "t", Ț: "T", ș: "s", Ș: "S",
} as const

type Separator = "-" | "_"

// ─── Slug function ──────────────────────────────────────────────────────────

function toSlug(text: string, separator: Separator): string {
  // 1. Transliterate
  let result = ""
  for (const ch of text) {
    result += TRANSLITERATION_MAP[ch] ?? ch
  }

  // 2. Lowercase
  result = result.toLowerCase()

  // 3. Remove non-alphanumeric (keep spaces, hyphens, underscores)
  result = result.replace(/[^a-z0-9\s\-_]/g, "")

  // 4. Replace whitespace / separators with chosen separator
  result = result.replace(/[\s\-_]+/g, separator)

  // 5. Trim separators from edges
  result = result.replace(new RegExp(`^${separator === "-" ? "\\-" : "_"}+|${separator === "-" ? "\\-" : "_"}+$`, "g"), "")

  return result
}

// ─── Component ──────────────────────────────────────────────────────────────

const EXAMPLE_INPUT = "How to Build a REST API with Express.js & TypeScript (2024 Guide)"

export function SlugGenerator() {
  const [input, setInput] = useState("")
  const [separator, setSeparator] = useState<Separator>("-")
  const [copied, setCopied] = useState(false)

  const slug = useMemo(() => toSlug(input, separator), [input, separator])

  const handleCopy = useCallback(() => {
    if (!slug) return
    navigator.clipboard.writeText(slug)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [slug])

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
          <button
            onClick={() => setSeparator("-")}
            className={cn(
              "rounded px-3 py-1 text-sm font-medium transition-colors",
              separator === "-"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            hyphen (-)
          </button>
          <button
            onClick={() => setSeparator("_")}
            className={cn(
              "rounded px-3 py-1 text-sm font-medium transition-colors",
              separator === "_"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            underscore (_)
          </button>
        </div>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setInput(EXAMPLE_INPUT)}
          title="Load example"
        >
          <BookOpenIcon className="mr-1.5 h-3.5 w-3.5" />
          Example
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          disabled={!slug}
        >
          {copied ? (
            <CheckIcon className="mr-1.5 h-3.5 w-3.5" />
          ) : (
            <CopyIcon className="mr-1.5 h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      {/* ── Two-panel layout ────────────────────────────────────────── */}
      <div className="grid min-h-0 flex-1 grid-rows-2 gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type or paste text here..."
          spellCheck={false}
          className="w-full resize-none rounded-md border border-border bg-background p-3 font-sans text-sm text-foreground placeholder-muted-foreground outline-none focus:border-muted-foreground"
        />

        <div
          onClick={(e) => {
            const sel = window.getSelection()
            const range = document.createRange()
            range.selectNodeContents(e.currentTarget)
            sel?.removeAllRanges()
            sel?.addRange(range)
          }}
          className={cn(
            "cursor-text overflow-auto rounded-md border border-border bg-background p-3 font-mono text-sm break-all select-all",
            slug ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {slug || "slug-will-appear-here"}
        </div>
      </div>
    </div>
  )
}
