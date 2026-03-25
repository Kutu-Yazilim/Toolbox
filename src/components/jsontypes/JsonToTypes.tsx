"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon, AlertCircleIcon } from "lucide-react"
import Editor from "@monaco-editor/react"
import { generateTypeScript } from "@/utils/jsonToTs"
import { generateDart } from "@/utils/jsonToDart"
import { generateCsharp } from "@/utils/jsonToCsharp"
import { generatePython } from "@/utils/jsonToPython"
import { generateJava } from "@/utils/jsonToJava"

const LANGUAGES = [
  { value: "typescript", label: "TypeScript", monacoLang: "typescript" },
  { value: "dart", label: "Dart", monacoLang: "dart" },
  { value: "csharp", label: "C#", monacoLang: "csharp" },
  { value: "python", label: "Python", monacoLang: "python" },
  { value: "java", label: "Java", monacoLang: "java" },
] as const

type Language = (typeof LANGUAGES)[number]["value"]

const GENERATORS: Record<Language, (json: unknown, rootName: string) => string> = {
  typescript: generateTypeScript,
  dart: generateDart,
  csharp: generateCsharp,
  python: generatePython,
  java: generateJava,
}

const EXAMPLE_JSON = `{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com",
  "active": true,
  "score": 95.5,
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "zip": "62704"
  },
  "roles": ["admin", "editor"],
  "metadata": null
}`

export function JsonToTypes() {
  const [json, setJson] = useState(EXAMPLE_JSON)
  const [language, setLanguage] = useState<Language>("typescript")
  const [rootName, setRootName] = useState("Root")
  const [copied, setCopied] = useState(false)

  const { output, error } = useMemo(() => {
    if (!json.trim()) return { output: "", error: null }
    try {
      const parsed = JSON.parse(json)
      const result = GENERATORS[language](parsed, rootName || "Root")
      return { output: result, error: null }
    } catch (e) {
      return {
        output: "",
        error: e instanceof Error ? e.message : "Invalid JSON",
      }
    }
  }, [json, language, rootName])

  const handleChange = useCallback((value: string | undefined) => {
    setJson(value ?? "")
  }, [])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const monacoLang =
    LANGUAGES.find((l) => l.value === language)?.monacoLang ?? "plaintext"

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 13,
    lineNumbers: "on" as const,
    scrollBeyondLastLine: false,
    wordWrap: "on" as const,
    automaticLayout: true,
    padding: { top: 8 },
    renderLineHighlight: "none" as const,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          JSON → Types
        </span>
        <div className="flex items-center gap-2">
          <input
            value={rootName}
            onChange={(e) => setRootName(e.target.value)}
            placeholder="Root"
            className="h-6 w-20 text-xs bg-transparent border border-border rounded px-1.5 text-foreground outline-none font-mono"
            title="Root type name"
          />
        </div>
      </div>

      {/* Panels */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-px bg-border">
        {/* Input pane */}
        <div className="flex-1 min-h-0 flex flex-col bg-background">
          <div className="flex items-center justify-between px-3 h-7 border-b border-border flex-shrink-0">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              JSON Input
            </span>
            {error && (
              <span className="text-destructive text-[10px] flex items-center gap-0.5">
                <AlertCircleIcon className="h-2.5 w-2.5" />
                Invalid
              </span>
            )}
          </div>
          <div className="flex-1 min-h-0 relative">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={json}
              onChange={handleChange}
              theme="vs-dark"
              options={editorOptions}
            />
            {error && (
              <div className="absolute bottom-0 left-0 right-0 max-h-20 overflow-y-auto bg-destructive/15 backdrop-blur-sm border-t border-destructive/30 px-3 py-2">
                <p className="text-xs text-destructive font-mono leading-relaxed break-words">
                  {error}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Output pane */}
        <div className="flex-1 min-h-0 flex flex-col bg-background">
          <div className="flex items-center justify-between px-3 h-7 border-b border-border flex-shrink-0">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="h-5 text-[10px] bg-transparent border border-border rounded px-1 text-foreground outline-none uppercase tracking-wider font-medium"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="xs"
              onClick={handleCopy}
              disabled={!output}
              title="Copy"
            >
              {copied ? (
                <CheckIcon className="h-3 w-3" />
              ) : (
                <CopyIcon className="h-3 w-3" />
              )}
            </Button>
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={monacoLang}
              value={output}
              theme="vs-dark"
              options={{
                ...editorOptions,
                readOnly: true,
                domReadOnly: true,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
