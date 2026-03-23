import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  PlusIcon,
  XIcon,
  CopyIcon,
  DownloadIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
} from "lucide-react"
import {
  type TransformStep,
  type StepType,
  type FilterOperator,
  STEP_LABELS,
  FILTER_OPERATORS,
  createDefaultStep,
  applyPipeline,
  parseInput,
  toJsonString,
  toCsvString,
} from "./transformPipeline"

// ─── Constants ──────────────────────────────────────────────────────────────

const STEP_TYPES: StepType[] = [
  "filter",
  "sort",
  "select_fields",
  "rename_field",
  "deduplicate",
  "limit",
]

const EXAMPLE_DATA = `[
  { "name": "Alice", "age": 30, "city": "New York", "role": "Engineer", "salary": 95000 },
  { "name": "Bob", "age": 25, "city": "San Francisco", "role": "Designer", "salary": 82000 },
  { "name": "Charlie", "age": 35, "city": "London", "role": "Manager", "salary": 110000 },
  { "name": "Diana", "age": 28, "city": "Berlin", "role": "Developer", "salary": 88000 },
  { "name": "Eve", "age": 32, "city": "Tokyo", "role": "Analyst", "salary": 76000 },
  { "name": "Frank", "age": 30, "city": "New York", "role": "Engineer", "salary": 97000 },
  { "name": "Grace", "age": 27, "city": "Berlin", "role": "Designer", "salary": 79000 },
  { "name": "Hank", "age": 40, "city": "London", "role": "Manager", "salary": 125000 }
]`

const MAX_PREVIEW_ROWS = 100

// ─── Component ──────────────────────────────────────────────────────────────

export function DataTransformer() {
  const [inputText, setInputText] = useState("")
  const [steps, setSteps] = useState<TransformStep[]>([])
  const [inputCollapsed, setInputCollapsed] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)
  const [showStepMenu, setShowStepMenu] = useState(false)

  const { data: parsedData, columns, error: parseError } = useMemo(
    () => parseInput(inputText),
    [inputText],
  )

  const { data: outputData, error: pipelineError } = useMemo(
    () => applyPipeline(parsedData, steps),
    [parsedData, steps],
  )

  const outputColumns = useMemo(() => {
    if (outputData.length === 0) return columns
    return Object.keys(outputData[0])
  }, [outputData, columns])

  const updateStep = useCallback((index: number, updated: TransformStep) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? updated : s)))
  }, [])

  const removeStep = useCallback((index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const addStep = useCallback(
    (type: StepType) => {
      setSteps((prev) => [...prev, createDefaultStep(type, columns)])
      setShowStepMenu(false)
    },
    [columns],
  )

  const handleLoadExample = useCallback(() => {
    setInputText(EXAMPLE_DATA)
    setInputCollapsed(false)
  }, [])

  const handleCopyJson = useCallback(() => {
    navigator.clipboard.writeText(toJsonString(outputData))
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 1500)
  }, [outputData])

  const handleDownloadCsv = useCallback(() => {
    const csv = toCsvString(outputData)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "transformed-data.csv"
    a.click()
    URL.revokeObjectURL(url)
  }, [outputData])

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* ── Input Section ── */}
      <div className="border-b border-border">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          onClick={() => setInputCollapsed((v) => !v)}
        >
          <span className="flex items-center gap-2">
            Input Data
            {parsedData.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({parsedData.length} rows, {columns.length} columns)
              </span>
            )}
          </span>
          {inputCollapsed ? (
            <ChevronDownIcon className="size-4" />
          ) : (
            <ChevronUpIcon className="size-4" />
          )}
        </button>

        {!inputCollapsed && (
          <div className="px-4 pb-3 space-y-2">
            <textarea
              className="w-full h-36 rounded-md border border-border bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Paste JSON array or CSV data here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={handleLoadExample}>
                Load Example
              </Button>
              {parseError && (
                <span className="text-sm text-destructive">{parseError}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Pipeline Section ── */}
      <div className="flex-1 overflow-auto min-h-0 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Pipeline</h3>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              disabled={columns.length === 0}
              onClick={() => setShowStepMenu((v) => !v)}
            >
              <PlusIcon className="size-4" />
              Add Step
            </Button>
            {showStepMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowStepMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-md border border-border bg-popover shadow-md py-1">
                  {STEP_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted/60 text-popover-foreground"
                      onClick={() => addStep(type)}
                    >
                      {STEP_LABELS[type]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {steps.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No transform steps yet. Add a step to start transforming your data.
          </p>
        )}

        {steps.map((step, index) => (
          <StepCard
            key={index}
            index={index}
            step={step}
            columns={columns}
            onUpdate={(s) => updateStep(index, s)}
            onRemove={() => removeStep(index)}
          />
        ))}
      </div>

      {/* ── Output Section ── */}
      <div className="border-t border-border flex flex-col min-h-0" style={{ maxHeight: "45%" }}>
        <div className="flex items-center justify-between px-4 py-2 shrink-0">
          <span className="text-sm font-medium text-foreground flex items-center gap-2">
            Output
            {parsedData.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {parsedData.length} → {outputData.length} rows
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={outputData.length === 0}
              onClick={handleCopyJson}
            >
              {copiedJson ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
              {copiedJson ? "Copied" : "JSON"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={outputData.length === 0}
              onClick={handleDownloadCsv}
            >
              <DownloadIcon className="size-4" />
              CSV
            </Button>
          </div>
        </div>

        {pipelineError ? (
          <div className="px-4 pb-3">
            <p className="text-sm text-destructive">{pipelineError}</p>
          </div>
        ) : outputData.length > 0 ? (
          <div className="overflow-auto min-h-0 px-4 pb-3">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr>
                  {outputColumns.map((col) => (
                    <th
                      key={col}
                      className="text-left px-3 py-1.5 border border-border bg-muted font-medium text-foreground whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {outputData.slice(0, MAX_PREVIEW_ROWS).map((row, ri) => (
                  <tr key={ri} className="hover:bg-muted/30">
                    {outputColumns.map((col) => (
                      <td
                        key={col}
                        className="px-3 py-1 border border-border text-foreground whitespace-nowrap"
                      >
                        {String(row[col] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {outputData.length > MAX_PREVIEW_ROWS && (
              <p className="text-xs text-muted-foreground mt-1">
                Showing first {MAX_PREVIEW_ROWS} of {outputData.length} rows
              </p>
            )}
          </div>
        ) : parsedData.length > 0 ? (
          <p className="text-sm text-muted-foreground px-4 pb-3">
            Pipeline produced no results.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground px-4 pb-3">
            Paste data above and add transform steps.
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Step Card ──────────────────────────────────────────────────────────────

function StepCard({
  index,
  step,
  columns,
  onUpdate,
  onRemove,
}: {
  index: number
  step: TransformStep
  columns: string[]
  onUpdate: (step: TransformStep) => void
  onRemove: () => void
}) {
  return (
    <div className="border border-border rounded-lg p-3 bg-muted/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
            {index + 1}
          </span>
          <span className="text-sm font-medium text-foreground">
            {STEP_LABELS[step.type]}
          </span>
        </div>
        <Button variant="ghost" size="icon-xs" onClick={onRemove}>
          <XIcon className="size-3" />
        </Button>
      </div>

      <StepConfig step={step} columns={columns} onUpdate={onUpdate} />
    </div>
  )
}

// ─── Step Configuration Fields ──────────────────────────────────────────────

function StepConfig({
  step,
  columns,
  onUpdate,
}: {
  step: TransformStep
  columns: string[]
  onUpdate: (step: TransformStep) => void
}) {
  switch (step.type) {
    case "filter":
      return (
        <div className="flex flex-wrap items-center gap-2">
          <FieldSelect
            value={step.field}
            columns={columns}
            onChange={(field) => onUpdate({ ...step, field })}
          />
          <select
            className="h-8 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={step.operator}
            onChange={(e) =>
              onUpdate({ ...step, operator: e.target.value as FilterOperator })
            }
          >
            {FILTER_OPERATORS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
          {step.operator !== "exists" && step.operator !== "not_exists" && (
            <input
              type="text"
              className="h-8 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-32"
              placeholder="Value"
              value={step.value}
              onChange={(e) => onUpdate({ ...step, value: e.target.value })}
            />
          )}
        </div>
      )

    case "sort":
      return (
        <div className="flex items-center gap-2">
          <FieldSelect
            value={step.field}
            columns={columns}
            onChange={(field) => onUpdate({ ...step, field })}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onUpdate({
                ...step,
                direction: step.direction === "asc" ? "desc" : "asc",
              })
            }
          >
            {step.direction === "asc" ? "Ascending" : "Descending"}
          </Button>
        </div>
      )

    case "select_fields":
      return (
        <div className="flex flex-wrap gap-2">
          {columns.map((col) => (
            <label key={col} className="flex items-center gap-1 text-sm text-foreground">
              <input
                type="checkbox"
                className="rounded border-border"
                checked={step.fields.includes(col)}
                onChange={(e) => {
                  const fields = e.target.checked
                    ? [...step.fields, col]
                    : step.fields.filter((f) => f !== col)
                  onUpdate({ ...step, fields })
                }}
              />
              {col}
            </label>
          ))}
        </div>
      )

    case "rename_field":
      return (
        <div className="flex items-center gap-2">
          <FieldSelect
            value={step.from}
            columns={columns}
            onChange={(from) => onUpdate({ ...step, from })}
          />
          <span className="text-sm text-muted-foreground">→</span>
          <input
            type="text"
            className="h-8 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-32"
            placeholder="New name"
            value={step.to}
            onChange={(e) => onUpdate({ ...step, to: e.target.value })}
          />
        </div>
      )

    case "deduplicate":
      return (
        <FieldSelect
          value={step.field}
          columns={columns}
          onChange={(field) => onUpdate({ ...step, field })}
        />
      )

    case "limit":
      return (
        <input
          type="number"
          min={0}
          className="h-8 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-24"
          value={step.count}
          onChange={(e) =>
            onUpdate({ ...step, count: Math.max(0, parseInt(e.target.value) || 0) })
          }
        />
      )
  }
}

// ─── Shared field select ────────────────────────────────────────────────────

function FieldSelect({
  value,
  columns,
  onChange,
}: {
  value: string
  columns: string[]
  onChange: (value: string) => void
}) {
  return (
    <select
      className="h-8 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {columns.map((col) => (
        <option key={col} value={col}>
          {col}
        </option>
      ))}
    </select>
  )
}
