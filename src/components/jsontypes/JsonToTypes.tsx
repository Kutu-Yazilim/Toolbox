"use client"

import { useState, useCallback, useMemo } from "react"
import { AlertCircleIcon } from "lucide-react"
import Editor from "@monaco-editor/react"
import { generateTypeScript } from "@/utils/jsonToTs"
import { generateDart } from "@/utils/jsonToDart"
import { generateCsharp } from "@/utils/jsonToCsharp"
import { generatePython } from "@/utils/jsonToPython"
import { generateJava } from "@/utils/jsonToJava"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useFileImport } from "@/hooks/useFileImport"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { useTheme } from "@/hooks/useTheme"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { type ExportOption } from "@/components/shared/ExportMenu"
import { JSON_TO_TYPES_PRESETS } from "./jsonToTypesPresets"

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

interface JsonToTypesState {
  json: string
  language: Language
  rootName: string
}

export function JsonToTypes() {
  const [stored, setStored] = useLocalStorage<JsonToTypesState>("json-to-types", {
    json: EXAMPLE_JSON,
    language: "typescript",
    rootName: "Root",
  })

  const [json, setJson] = useState(stored.json)
  const [language, setLanguage] = useState<Language>(stored.language)
  const [rootName, setRootName] = useState(stored.rootName)
  const { isDark } = useTheme()

  const persist = useCallback((j: string, l: Language, r: string) => {
    setStored({ json: j, language: l, rootName: r })
  }, [setStored])

  const { shareUrl } = useShareableUrl("json-to-types", { json, language, rootName }, (restored) => {
    setJson(restored.json)
    setLanguage(restored.language)
    setRootName(restored.rootName)
    setStored(restored)
  })

  const { dropzoneProps, isDragging } = useFileImport({
    accept: [".json"],
    onImport: (content) => {
      setJson(content)
      persist(content, language, rootName)
    },
  })

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
    const v = value ?? ""
    setJson(v)
    persist(v, language, rootName)
  }, [language, rootName, persist])

  const handleLanguageChange = useCallback((l: Language) => {
    setLanguage(l)
    persist(json, l, rootName)
  }, [json, rootName, persist])

  const handleRootNameChange = useCallback((r: string) => {
    setRootName(r)
    persist(json, language, r)
  }, [json, language, persist])

  const handlePresetSelect = useCallback((preset: Preset) => {
    setJson(preset.content)
    persist(preset.content, language, rootName)
  }, [language, rootName, persist])

  const handleDownload = useCallback(() => {
    const ext = language === "typescript" ? "ts" : language === "csharp" ? "cs" : language === "python" ? "py" : language
    const blob = new Blob([output], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${rootName || "Root"}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }, [output, language, rootName])

  const exportOptions: ExportOption[] = useMemo(() => [
    { label: "Download types", action: handleDownload },
  ], [handleDownload])

  const shortcuts: Shortcut[] = useMemo(() => [
    { key: "mod+shift+d", label: "Download types", action: handleDownload },
  ], [handleDownload])

  useKeyboardShortcuts(shortcuts)

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
    <div className="h-full flex flex-col min-h-0" {...dropzoneProps}>
      {/* Toolbar */}
      <ToolToolbar
        title="JSON -> Types"
        status={error ? { type: "error", label: "Invalid JSON" } : output ? { type: "success", label: `${output.split("\n").length} lines` } : null}
        copyValue={output}
        onShare={shareUrl}
        exportOptions={exportOptions}
        presets={JSON_TO_TYPES_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
        actions={
          <input
            value={rootName}
            onChange={(e) => handleRootNameChange(e.target.value)}
            placeholder="Root"
            className="h-6 w-20 text-xs bg-transparent border border-border rounded px-1.5 text-foreground outline-none font-mono"
            title="Root type name"
          />
        }
      />

      {/* Panels */}
      <div className={`flex-1 min-h-0 flex flex-col md:flex-row gap-px bg-border ${isDragging ? "ring-2 ring-primary ring-inset" : ""}`}>
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
              theme={isDark ? "vs-dark" : "light"}
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
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
              className="h-5 text-[10px] bg-transparent border border-border rounded px-1 text-foreground outline-none uppercase tracking-wider font-medium"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={monacoLang}
              value={output}
              theme={isDark ? "vs-dark" : "light"}
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
