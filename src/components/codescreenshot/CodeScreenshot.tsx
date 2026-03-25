"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { loader } from "@monaco-editor/react"
import {
  CopyIcon,
  CheckIcon,
  ClipboardPasteIcon,
  ImageIcon,
  FileCodeIcon,
} from "lucide-react"
import { toPng, toSvg, toBlob } from "html-to-image"
import Editor from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── Types & Constants ──────────────────────────────────────────────────────

type LanguageId =
  | "javascript"
  | "typescript"
  | "dart"
  | "python"
  | "go"
  | "rust"
  | "java"
  | "csharp"
  | "html"
  | "css"
  | "sql"
  | "json"
  | "yaml"
  | "shell"
  | "markdown"
  | "plaintext"

type BackgroundPresetId =
  | "sunset"
  | "ocean"
  | "night"
  | "forest"
  | "lavender"
  | "snow"
  | "ember"
  | "custom"

type CopiedState = "png" | "svg" | "clipboard" | null

type BackgroundPreset = {
  id: BackgroundPresetId
  label: string
  style: string
}

const LANGUAGES: { id: LanguageId; label: string }[] = [
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "dart", label: "Dart" },
  { id: "python", label: "Python" },
  { id: "go", label: "Go" },
  { id: "rust", label: "Rust" },
  { id: "java", label: "Java" },
  { id: "csharp", label: "C#" },
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "sql", label: "SQL" },
  { id: "json", label: "JSON" },
  { id: "yaml", label: "YAML" },
  { id: "shell", label: "Bash" },
  { id: "markdown", label: "Markdown" },
  { id: "plaintext", label: "Plain Text" },
]

const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: "sunset",
    label: "Sunset",
    style: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  {
    id: "ocean",
    label: "Ocean",
    style: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  },
  {
    id: "night",
    label: "Night",
    style: "#0c0c0c",
  },
  {
    id: "forest",
    label: "Forest",
    style: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  },
  {
    id: "lavender",
    label: "Lavender",
    style: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  },
  {
    id: "snow",
    label: "Snow",
    style: "#ffffff",
  },
  {
    id: "ember",
    label: "Ember",
    style: "linear-gradient(135deg, #f83600 0%, #f9d423 100%)",
  },
  {
    id: "custom",
    label: "Custom",
    style: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
]

const DEFAULT_CODE = `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Calculate the first 10 Fibonacci numbers
const results = Array.from({ length: 10 }, (_, i) =>
  fibonacci(i)
);

console.log(results);`

const DEFAULT_PADDING = 48
const DEFAULT_BORDER_RADIUS = 12
const DEFAULT_FONT_SIZE = 14

// ─── Helpers ────────────────────────────────────────────────────────────────

function getBackgroundStyle(preset: BackgroundPreset, customColor: string) {
  if (preset.id === "custom") {
    return { background: customColor }
  }
  return { background: preset.style }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CodeScreenshot() {
  const previewRef = useRef<HTMLDivElement>(null)

  // Code state
  const [code, setCode] = useState(DEFAULT_CODE)
  const [language, setLanguage] = useState<LanguageId>("javascript")

  // Style state
  const [selectedBg, setSelectedBg] = useState<BackgroundPresetId>("sunset")
  const [customColor, setCustomColor] = useState("#667eea")
  const [padding, setPadding] = useState(DEFAULT_PADDING)
  const [borderRadius, setBorderRadius] = useState(DEFAULT_BORDER_RADIUS)
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE)
  const [showChrome, setShowChrome] = useState(true)
  const [windowTitle, setWindowTitle] = useState("untitled")

  // Syntax highlighting state
  const [colorizedHtml, setColorizedHtml] = useState("")

  // Export state
  const [copied, setCopied] = useState<CopiedState>(null)
  const [exporting, setExporting] = useState(false)

  const bgPreset = BACKGROUND_PRESETS.find((p) => p.id === selectedBg)!

  // Colorize code using Monaco's tokenizer for syntax highlighting
  useEffect(() => {
    if (!code.trim()) {
      setColorizedHtml("")
      return
    }
    let cancelled = false
    loader.init().then((monaco) => {
      return monaco.editor.colorize(code, language, { tabSize: 2 })
    }).then((html) => {
      if (!cancelled) setColorizedHtml(html)
    }).catch(() => {
      if (!cancelled) setColorizedHtml("")
    })
    return () => { cancelled = true }
  }, [code, language])

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      setCode(text)
    } catch {
      // clipboard access denied
    }
  }, [])

  const exportAs = useCallback(
    async (format: "png" | "svg" | "clipboard") => {
      if (!previewRef.current || exporting) return
      setExporting(true)
      try {
        const opts = { pixelRatio: 2 }
        if (format === "png") {
          const dataUrl = await toPng(previewRef.current, opts)
          const link = document.createElement("a")
          link.download = "code-screenshot.png"
          link.href = dataUrl
          link.click()
        } else if (format === "svg") {
          const dataUrl = await toSvg(previewRef.current, opts)
          const link = document.createElement("a")
          link.download = "code-screenshot.svg"
          link.href = dataUrl
          link.click()
        } else {
          const blob = await toBlob(previewRef.current, opts)
          if (blob) {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob }),
            ])
          }
        }
        setCopied(format)
        setTimeout(() => setCopied(null), 2000)
      } catch {
        // export failed
      } finally {
        setExporting(false)
      }
    },
    [exporting],
  )

  return (
    <div className="flex h-full flex-col gap-0 lg:flex-row">
      {/* ── Left Panel: Code Input & Controls ──────────────────────── */}
      <div className="flex w-full flex-col gap-4 overflow-y-auto border-b border-border p-4 lg:w-[35%] lg:border-b-0 lg:border-r">
        {/* Language selector + paste */}
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageId)}
            className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={handlePaste} className="gap-1.5">
            <ClipboardPasteIcon className="h-3.5 w-3.5" />
            Paste
          </Button>
        </div>

        {/* Monaco editor for code input */}
        <div className="min-h-[200px] flex-1 overflow-hidden rounded-md border border-border">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={(val) => setCode(val ?? "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              wordWrap: "on",
              padding: { top: 8 },
            }}
          />
        </div>

        {/* ── Styling Controls ─────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Background
          </span>
          <div className="flex flex-wrap gap-2">
            {BACKGROUND_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedBg(preset.id)}
                title={preset.label}
                className={cn(
                  "h-8 w-8 rounded-md border-2 transition-all",
                  selectedBg === preset.id
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-muted-foreground",
                )}
                style={
                  preset.id === "custom"
                    ? { background: customColor }
                    : { background: preset.style }
                }
              />
            ))}
          </div>
          {selectedBg === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-border"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="h-9 flex-1 rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}

          {/* Padding slider */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Padding</span>
              <span className="font-mono text-xs text-muted-foreground">{padding}px</span>
            </div>
            <input
              type="range"
              min={16}
              max={96}
              value={padding}
              onChange={(e) => setPadding(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer accent-primary"
            />
          </div>

          {/* Border radius slider */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Border Radius</span>
              <span className="font-mono text-xs text-muted-foreground">{borderRadius}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={32}
              value={borderRadius}
              onChange={(e) => setBorderRadius(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer accent-primary"
            />
          </div>

          {/* Font size slider */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Font Size</span>
              <span className="font-mono text-xs text-muted-foreground">{fontSize}px</span>
            </div>
            <input
              type="range"
              min={12}
              max={24}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer accent-primary"
            />
          </div>

          {/* Window chrome toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Window Chrome</span>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={showChrome}
                onChange={(e) => setShowChrome(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-5 w-9 rounded-full border border-border bg-muted transition-colors peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-ring after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>

          {/* Window title */}
          {showChrome && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Window Title</span>
              <input
                type="text"
                value={windowTitle}
                onChange={(e) => setWindowTitle(e.target.value)}
                placeholder="untitled"
                className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}
        </div>

        {/* ── Export Buttons ────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Export
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportAs("png")}
              disabled={exporting}
              className="gap-1.5"
            >
              {copied === "png" ? (
                <CheckIcon className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5" />
              )}
              PNG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportAs("svg")}
              disabled={exporting}
              className="gap-1.5"
            >
              {copied === "svg" ? (
                <CheckIcon className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <FileCodeIcon className="h-3.5 w-3.5" />
              )}
              SVG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportAs("clipboard")}
              disabled={exporting}
              className="gap-1.5"
            >
              {copied === "clipboard" ? (
                <CheckIcon className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <CopyIcon className="h-3.5 w-3.5" />
              )}
              Copy
            </Button>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Live Preview ──────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center overflow-auto bg-muted/20 p-8">
        <div
          ref={previewRef}
          style={{
            ...getBackgroundStyle(bgPreset, customColor),
            padding: `${padding}px`,
          }}
        >
          {/* Code container */}
          <div
            style={{ borderRadius: `${borderRadius}px` }}
            className="overflow-hidden shadow-2xl"
          >
            {/* Window chrome bar */}
            {showChrome && (
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ backgroundColor: "#2d2d2d" }}
              >
                <div className="flex gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: "#ff5f57" }}
                  />
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: "#febc2e" }}
                  />
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: "#28c840" }}
                  />
                </div>
                {windowTitle && (
                  <span
                    className="flex-1 text-center text-xs"
                    style={{ color: "#9ca3af" }}
                  >
                    {windowTitle}
                  </span>
                )}
                {/* Spacer to balance dots when title is present */}
                {windowTitle && <div className="w-[52px]" />}
              </div>
            )}

            {/* Code block with syntax highlighting */}
            <div
              style={{
                backgroundColor: "#1e1e1e",
                fontSize: `${fontSize}px`,
                lineHeight: 1.6,
                padding: "16px 20px",
                margin: 0,
                borderRadius: showChrome
                  ? `0 0 ${borderRadius}px ${borderRadius}px`
                  : `${borderRadius}px`,
                overflowX: "auto",
                fontFamily:
                  "'Fira Code', 'JetBrains Mono', 'SF Mono', 'Cascadia Code', Menlo, Monaco, 'Courier New', monospace",
                color: "#d4d4d4",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
              dangerouslySetInnerHTML={{
                __html: colorizedHtml || (code || " ").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
