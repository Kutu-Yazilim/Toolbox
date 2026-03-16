import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon, AlertCircleIcon, Trash2Icon } from "lucide-react"
import Editor from "@monaco-editor/react"
import { parse as parseYaml, stringify as stringifyYaml } from "yaml"

type SourceSide = "yaml" | "json"

export function YamlJsonConverter() {
  const [yamlValue, setYamlValue] = useState("")
  const [jsonValue, setJsonValue] = useState("")
  const [yamlError, setYamlError] = useState<string | null>(null)
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [copiedYaml, setCopiedYaml] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)
  const [indent, setIndent] = useState<2 | 4>(2)
  const sourceRef = useRef<SourceSide | null>(null)

  const handleYamlChange = useCallback(
    (value: string | undefined) => {
      const newValue = value ?? ""
      setYamlValue(newValue)
      sourceRef.current = "yaml"

      if (!newValue.trim()) {
        setJsonValue("")
        setYamlError(null)
        setJsonError(null)
        return
      }

      try {
        const parsed = parseYaml(newValue)
        const json = JSON.stringify(parsed, null, indent)
        setJsonValue(json)
        setYamlError(null)
        setJsonError(null)
      } catch (e) {
        setYamlError(e instanceof Error ? e.message : "Invalid YAML")
      }
    },
    [indent],
  )

  const handleJsonChange = useCallback((value: string | undefined) => {
    const newValue = value ?? ""
    setJsonValue(newValue)
    sourceRef.current = "json"

    if (!newValue.trim()) {
      setYamlValue("")
      setYamlError(null)
      setJsonError(null)
      return
    }

    try {
      const parsed = JSON.parse(newValue)
      const yaml = stringifyYaml(parsed)
      setYamlValue(yaml)
      setJsonError(null)
      setYamlError(null)
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON")
    }
  }, [])

  const handleCopy = async (text: string, side: "yaml" | "json") => {
    await navigator.clipboard.writeText(text)
    if (side === "yaml") {
      setCopiedYaml(true)
      setTimeout(() => setCopiedYaml(false), 2000)
    } else {
      setCopiedJson(true)
      setTimeout(() => setCopiedJson(false), 2000)
    }
  }

  const handleClear = () => {
    setYamlValue("")
    setJsonValue("")
    setYamlError(null)
    setJsonError(null)
  }

  const cycleIndent = () => {
    setIndent((prev) => {
      const next = prev === 2 ? 4 : 2
      // Re-format JSON side if it's valid
      if (jsonValue.trim()) {
        try {
          const parsed = JSON.parse(jsonValue)
          setJsonValue(JSON.stringify(parsed, null, next))
        } catch {
          // keep as-is
        }
      }
      return next
    })
  }

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
          YAML ↔ JSON
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={cycleIndent}
            title={`JSON indent: ${indent} spaces`}
            className="font-mono text-[10px] w-8"
          >
            {indent}sp
          </Button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <Button variant="ghost" size="xs" onClick={handleClear} title="Clear both">
            <Trash2Icon className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Editor panels */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-px bg-border">
        {/* YAML pane */}
        <div className="flex-1 min-h-0 flex flex-col bg-background">
          <div className="flex items-center justify-between px-3 h-7 border-b border-border flex-shrink-0">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              YAML
            </span>
            <div className="flex items-center gap-1">
              {yamlError && (
                <span className="text-destructive text-[10px] flex items-center gap-0.5">
                  <AlertCircleIcon className="h-2.5 w-2.5" />
                  Error
                </span>
              )}
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleCopy(yamlValue, "yaml")}
                title="Copy YAML"
              >
                {copiedYaml ? (
                  <CheckIcon className="h-3 w-3" />
                ) : (
                  <CopyIcon className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex-1 min-h-0 relative">
            <Editor
              height="100%"
              defaultLanguage="yaml"
              value={yamlValue}
              onChange={handleYamlChange}
              theme="vs-dark"
              options={editorOptions}
            />
            {yamlError && (
              <div className="absolute bottom-0 left-0 right-0 max-h-20 overflow-y-auto bg-destructive/15 backdrop-blur-sm border-t border-destructive/30 px-3 py-2">
                <p className="text-xs text-destructive font-mono leading-relaxed break-words">
                  {yamlError}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* JSON pane */}
        <div className="flex-1 min-h-0 flex flex-col bg-background">
          <div className="flex items-center justify-between px-3 h-7 border-b border-border flex-shrink-0">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              JSON
            </span>
            <div className="flex items-center gap-1">
              {jsonError && (
                <span className="text-destructive text-[10px] flex items-center gap-0.5">
                  <AlertCircleIcon className="h-2.5 w-2.5" />
                  Error
                </span>
              )}
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleCopy(jsonValue, "json")}
                title="Copy JSON"
              >
                {copiedJson ? (
                  <CheckIcon className="h-3 w-3" />
                ) : (
                  <CopyIcon className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex-1 min-h-0 relative">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={jsonValue}
              onChange={handleJsonChange}
              theme="vs-dark"
              options={editorOptions}
            />
            {jsonError && (
              <div className="absolute bottom-0 left-0 right-0 max-h-20 overflow-y-auto bg-destructive/15 backdrop-blur-sm border-t border-destructive/30 px-3 py-2">
                <p className="text-xs text-destructive font-mono leading-relaxed break-words">
                  {jsonError}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
