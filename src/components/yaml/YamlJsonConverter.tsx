"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon, AlertCircleIcon, Trash2Icon } from "lucide-react"
import Editor from "@monaco-editor/react"
import { parse as parseYaml, stringify as stringifyYaml } from "yaml"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useFileImport } from "@/hooks/useFileImport"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { useTheme } from "@/hooks/useTheme"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { type ExportOption } from "@/components/shared/ExportMenu"
import { YAML_JSON_PRESETS } from "./presets"

type SourceSide = "yaml" | "json"

interface YamlJsonState {
  yamlValue: string
  jsonValue: string
  indent: 2 | 4
}

const DEFAULT_STATE: YamlJsonState = { yamlValue: "", jsonValue: "", indent: 2 }

export function YamlJsonConverter() {
  const [state, setState] = useLocalStorage<YamlJsonState>("yaml-json-converter", DEFAULT_STATE)
  const [yamlError, setYamlError] = useState<string | null>(null)
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [copiedYaml, setCopiedYaml] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)
  const sourceRef = useRef<SourceSide | null>(null)
  const { isDark } = useTheme()

  const { shareUrl } = useShareableUrl("yaml-json", state, (restored) => {
    setState(restored)
    setYamlError(null)
    setJsonError(null)
  })

  const { dropzoneProps, isDragging } = useFileImport({
    accept: [".yaml", ".yml", ".json"],
    onImport: (content, filename) => {
      if (filename.endsWith(".json")) {
        handleJsonChange(content)
      } else {
        handleYamlChange(content)
      }
    },
  })

  const handleYamlChange = useCallback(
    (value: string | undefined) => {
      const newValue = value ?? ""
      sourceRef.current = "yaml"

      if (!newValue.trim()) {
        setState(prev => ({ ...prev, yamlValue: "", jsonValue: "" }))
        setYamlError(null)
        setJsonError(null)
        return
      }

      try {
        const parsed = parseYaml(newValue)
        setState(prev => ({
          ...prev,
          yamlValue: newValue,
          jsonValue: JSON.stringify(parsed, null, prev.indent),
        }))
        setYamlError(null)
        setJsonError(null)
      } catch (e) {
        setState(prev => ({ ...prev, yamlValue: newValue }))
        setYamlError(e instanceof Error ? e.message : "Invalid YAML")
      }
    },
    [setState],
  )

  const handleJsonChange = useCallback((value: string | undefined) => {
    const newValue = value ?? ""
    sourceRef.current = "json"

    if (!newValue.trim()) {
      setState(prev => ({ ...prev, yamlValue: "", jsonValue: "" }))
      setYamlError(null)
      setJsonError(null)
      return
    }

    try {
      const parsed = JSON.parse(newValue)
      const yaml = stringifyYaml(parsed)
      setState(prev => ({ ...prev, yamlValue: yaml, jsonValue: newValue }))
      setJsonError(null)
      setYamlError(null)
    } catch (e) {
      setState(prev => ({ ...prev, jsonValue: newValue }))
      setJsonError(e instanceof Error ? e.message : "Invalid JSON")
    }
  }, [setState])

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

  const handleClear = useCallback(() => {
    setState(prev => ({ ...prev, yamlValue: "", jsonValue: "" }))
    setYamlError(null)
    setJsonError(null)
  }, [setState])

  const cycleIndent = useCallback(() => {
    setState(prev => {
      const next = prev.indent === 2 ? 4 : 2
      let jsonValue = prev.jsonValue
      if (jsonValue.trim()) {
        try {
          const parsed = JSON.parse(jsonValue)
          jsonValue = JSON.stringify(parsed, null, next)
        } catch {
          // keep as-is
        }
      }
      return { ...prev, indent: next as 2 | 4, jsonValue }
    })
  }, [setState])

  const handlePresetSelect = useCallback((preset: Preset) => {
    handleYamlChange(preset.content)
  }, [handleYamlChange])

  const shortcuts: Shortcut[] = useMemo(() => [
    { key: "mod+shift+c", label: "Clear both", action: handleClear },
    { key: "mod+shift+i", label: "Cycle indent", action: cycleIndent },
  ], [handleClear, cycleIndent])

  useKeyboardShortcuts(shortcuts)

  const exportOptions: ExportOption[] = useMemo(() => [
    {
      label: "Download YAML",
      action: () => {
        const blob = new Blob([state.yamlValue], { type: "text/yaml" })
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob)
        a.download = "output.yaml"
        a.click()
        URL.revokeObjectURL(a.href)
      },
    },
    {
      label: "Download JSON",
      action: () => {
        const blob = new Blob([state.jsonValue], { type: "application/json" })
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob)
        a.download = "output.json"
        a.click()
        URL.revokeObjectURL(a.href)
      },
    },
  ], [state.yamlValue, state.jsonValue])

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

  const monacoTheme = isDark ? "vs-dark" : "light"

  return (
    <div className="h-full flex flex-col min-h-0" {...dropzoneProps}>
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg">
          <span className="text-sm font-medium text-primary">Drop YAML or JSON file</span>
        </div>
      )}

      {/* Toolbar */}
      <ToolToolbar
        title="YAML / JSON"
        onShare={shareUrl}
        exportOptions={exportOptions}
        presets={YAML_JSON_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      >
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="xs"
            onClick={cycleIndent}
            title={`JSON indent: ${state.indent} spaces`}
            className="font-mono text-[10px] w-8"
          >
            {state.indent}sp
          </Button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <Button variant="ghost" size="xs" onClick={handleClear} title="Clear both">
            <Trash2Icon className="h-3 w-3" />
          </Button>
        </div>
      </ToolToolbar>

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
                onClick={() => handleCopy(state.yamlValue, "yaml")}
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
              value={state.yamlValue}
              onChange={handleYamlChange}
              theme={monacoTheme}
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
                onClick={() => handleCopy(state.jsonValue, "json")}
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
              value={state.jsonValue}
              onChange={handleJsonChange}
              theme={monacoTheme}
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
