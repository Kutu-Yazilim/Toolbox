import { useState, useCallback } from "react"
import { RefreshCwIcon, CopyIcon, CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── Types & constants ──────────────────────────────────────────────────────

type LoremMode = "paragraphs" | "sentences" | "words"

const MODES: { value: LoremMode; label: string }[] = [
  { value: "paragraphs", label: "Paragraphs" },
  { value: "sentences", label: "Sentences" },
  { value: "words", label: "Words" },
]

const MIN_COUNT = 1
const MAX_COUNT = 100

const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
  "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum", "at", "vero", "eos",
  "accusamus", "iusto", "odio", "dignissimos", "ducimus", "blanditiis",
  "praesentium", "voluptatum", "deleniti", "atque", "corrupti", "quos", "dolores",
  "quas", "molestias", "recusandae", "itaque", "earum", "rerum", "hic", "tenetur",
  "sapiente", "delectus", "aut", "reiciendis", "voluptatibus", "maiores", "alias",
  "consequatur", "perferendis", "doloribus", "asperiores", "repellat", "temporibus",
  "quibusdam", "illum", "fugit", "quo", "voluptas", "nemo", "quisquam",
]

const LOREM_START = "Lorem ipsum dolor sit amet, consectetur adipiscing elit."

// ─── Generation helpers ─────────────────────────────────────────────────────

function randomWord(): string {
  return LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function generateSentence(): string {
  const length = 8 + Math.floor(Math.random() * 12)
  const words: string[] = []
  for (let i = 0; i < length; i++) {
    words.push(randomWord())
  }
  return capitalize(words.join(" ")) + "."
}

function generateParagraph(): string {
  const sentenceCount = 4 + Math.floor(Math.random() * 5)
  const sentences: string[] = []
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(generateSentence())
  }
  return sentences.join(" ")
}

function generateLorem(mode: LoremMode, count: number, startWithLorem: boolean): string {
  if (mode === "words") {
    const words: string[] = []
    for (let i = 0; i < count; i++) {
      words.push(randomWord())
    }
    let result = words.join(" ")
    if (startWithLorem) {
      const loremPrefix = "Lorem ipsum dolor sit amet"
      const prefixWords = loremPrefix.split(" ")
      if (count <= prefixWords.length) {
        result = prefixWords.slice(0, count).join(" ")
      } else {
        result = loremPrefix + " " + words.slice(prefixWords.length).join(" ")
      }
    }
    return result
  }

  if (mode === "sentences") {
    const sentences: string[] = []
    for (let i = 0; i < count; i++) {
      sentences.push(generateSentence())
    }
    if (startWithLorem) {
      sentences[0] = LOREM_START
    }
    return sentences.join(" ")
  }

  // paragraphs
  const paragraphs: string[] = []
  for (let i = 0; i < count; i++) {
    paragraphs.push(generateParagraph())
  }
  if (startWithLorem) {
    paragraphs[0] = LOREM_START + " " + paragraphs[0].split(". ").slice(1).join(". ")
  }
  return paragraphs.join("\n\n")
}

// ─── Component ──────────────────────────────────────────────────────────────

export function LoremIpsumGenerator() {
  const [mode, setMode] = useState<LoremMode>("paragraphs")
  const [count, setCount] = useState(3)
  const [startWithLorem, setStartWithLorem] = useState(true)
  const [output, setOutput] = useState("")
  const [copied, setCopied] = useState(false)

  const generate = useCallback(() => {
    setOutput(generateLorem(mode, count, startWithLorem))
    setCopied(false)
  }, [mode, count, startWithLorem])

  const copy = useCallback(() => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [output])

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b bg-muted/20 px-4 py-3">
        {/* Mode toggle */}
        <div className="flex items-center gap-1.5 rounded-lg border bg-muted/40 p-1">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                mode === m.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Count input */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Count</label>
          <input
            type="number"
            min={MIN_COUNT}
            max={MAX_COUNT}
            value={count}
            onChange={(e) => {
              const v = Math.max(MIN_COUNT, Math.min(MAX_COUNT, Number(e.target.value) || MIN_COUNT))
              setCount(v)
            }}
            className="w-16 rounded-md border bg-muted/40 px-2 py-1.5 text-xs text-center font-medium"
          />
        </div>

        {/* Start with Lorem checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={startWithLorem}
            onChange={(e) => setStartWithLorem(e.target.checked)}
            className="rounded"
          />
          <span className="text-xs text-muted-foreground">Start with &quot;Lorem ipsum...&quot;</span>
        </label>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <Button onClick={generate} size="sm">
            <RefreshCwIcon className="size-3.5" />
            Generate
          </Button>
          {output && (
            <Button onClick={copy} variant="outline" size="sm">
              {copied ? (
                <CheckIcon className="size-3.5" />
              ) : (
                <CopyIcon className="size-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
        </div>
      </div>

      {/* Output area */}
      <div className="flex-1 overflow-y-auto p-4">
        {output ? (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {output}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Click Generate to create lorem ipsum text
          </div>
        )}
      </div>
    </div>
  )
}
