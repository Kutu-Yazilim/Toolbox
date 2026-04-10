"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ImageIcon, CodeIcon } from "lucide-react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { useFileImport } from "@/hooks/useFileImport"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { type ExportOption } from "@/components/shared/ExportMenu"
import { CHART_PRESETS } from "./chartPresets"
import { toPng } from "html-to-image"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

type ChartType = "bar" | "line" | "pie" | "scatter" | "area"

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "pie", label: "Pie" },
  { value: "scatter", label: "Scatter" },
  { value: "area", label: "Area" },
]

const DEFAULT_PALETTE = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#0088fe",
  "#00c49f",
]

const EXAMPLE_DATA = `Month,Sales,Revenue,Expenses
Jan,120,200,150
Feb,150,230,160
Mar,180,280,170
Apr,140,220,155
May,200,320,190
Jun,230,350,210
Jul,210,310,200
Aug,190,290,185
Sep,250,380,220
Oct,270,400,240
Nov,300,450,260
Dec,320,480,280`

function tryParseJson(text: string): Record<string, unknown>[] | null {
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object") {
      return parsed as Record<string, unknown>[]
    }
  } catch {
    // not JSON
  }
  return null
}

function parseCsv(text: string): Record<string, unknown>[] | null {
  const lines = text.trim().split("\n")
  if (lines.length < 2) return null

  const headers = lines[0].split(",").map((h) => h.trim())
  if (headers.length < 2) return null

  const rows: Record<string, unknown>[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim())
    if (cells.length !== headers.length) continue
    const row: Record<string, unknown> = {}
    for (let j = 0; j < headers.length; j++) {
      const num = Number(cells[j])
      row[headers[j]] = isNaN(num) || cells[j] === "" ? cells[j] : num
    }
    rows.push(row)
  }
  return rows.length > 0 ? rows : null
}

function parseInput(text: string): {
  data: Record<string, unknown>[]
  columns: string[]
} {
  const trimmed = text.trim()
  if (!trimmed) return { data: [], columns: [] }

  const jsonData = tryParseJson(trimmed)
  if (jsonData) {
    const columns = Object.keys(jsonData[0])
    return { data: jsonData, columns }
  }

  const csvData = parseCsv(trimmed)
  if (csvData) {
    const columns = Object.keys(csvData[0])
    return { data: csvData, columns }
  }

  return { data: [], columns: [] }
}

export function ChartBuilder() {
  const [inputText, setInputText] = useState("")
  const [chartType, setChartType] = useLocalStorage<ChartType>("chart-type", "bar")
  const [xColumn, setXColumn] = useState("")
  const [yColumns, setYColumns] = useState<string[]>([])
  const [title, setTitle] = useState("")
  const [colors, setColors] = useState<Record<string, string>>({})
  const chartRef = useRef<HTMLDivElement>(null)

  const { data: parsedData, columns } = useMemo(
    () => parseInput(inputText),
    [inputText],
  )

  const numericColumns = useMemo(
    () =>
      columns.filter((col) =>
        parsedData.some((row) => typeof row[col] === "number"),
      ),
    [columns, parsedData],
  )

  const handleLoadExample = useCallback(() => {
    setInputText(EXAMPLE_DATA)
    setChartType("bar")
    setXColumn("Month")
    setYColumns(["Sales", "Revenue"])
    setTitle("Monthly Sales Report")
    setColors({ Sales: DEFAULT_PALETTE[0], Revenue: DEFAULT_PALETTE[1] })
  }, [])

  const handleYColumnToggle = useCallback(
    (col: string) => {
      setYColumns((prev) => {
        const next = prev.includes(col)
          ? prev.filter((c) => c !== col)
          : [...prev, col]
        // Assign default color if new
        if (!prev.includes(col)) {
          setColors((pc) => ({
            ...pc,
            [col]: pc[col] ?? DEFAULT_PALETTE[next.length - 1] ?? "#8884d8",
          }))
        }
        return next
      })
    },
    [],
  )

  const handleColorChange = useCallback((col: string, color: string) => {
    setColors((prev) => ({ ...prev, [col]: color }))
  }, [])

  const getColor = useCallback(
    (col: string, idx: number) =>
      colors[col] ?? DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length],
    [colors],
  )

  const handleExportPng = useCallback(async () => {
    if (!chartRef.current) return
    const dataUrl = await toPng(chartRef.current, { backgroundColor: document.documentElement.classList.contains("dark") ? "#09090b" : "#ffffff" })
    const link = document.createElement("a")
    link.download = `${title || "chart"}.png`
    link.href = dataUrl
    link.click()
  }, [title])

  const handleExportSvg = useCallback(() => {
    if (!chartRef.current) return
    const svgEl = chartRef.current.querySelector("svg")
    if (!svgEl) return
    const svgData = svgEl.outerHTML
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.download = `${title || "chart"}.svg`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }, [title])

  const { dropzoneProps, openFilePicker, isDragging } = useFileImport({
    accept: [".csv", ".json"],
    onImport: (content) => setInputText(content),
  })

  const handlePresetSelect = useCallback((preset: Preset) => {
    setInputText(preset.content)
  }, [])

  const exportOptions = useMemo<ExportOption[]>(() => [
    { label: "Export PNG", action: handleExportPng },
    { label: "Export SVG", action: handleExportSvg },
  ], [handleExportPng, handleExportSvg])

  const shortcuts = useMemo<Shortcut[]>(() => [
    { key: "mod+o", label: "Open File", action: openFilePicker },
    { key: "mod+s", label: "Export PNG", action: handleExportPng },
  ], [openFilePicker, handleExportPng])

  useKeyboardShortcuts(shortcuts)

  const chartData = parsedData

  const renderChart = () => {
    if (chartData.length === 0 || !xColumn || yColumns.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>Configure data and axes to see a chart preview</p>
        </div>
      )
    }

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xColumn} />
              <YAxis />
              <Tooltip />
              <Legend />
              {yColumns.map((col, i) => (
                <Bar key={col} dataKey={col} fill={getColor(col, i)} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xColumn} />
              <YAxis />
              <Tooltip />
              <Legend />
              {yColumns.map((col, i) => (
                <Line
                  key={col}
                  type="monotone"
                  dataKey={col}
                  stroke={getColor(col, i)}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xColumn} />
              <YAxis />
              <Tooltip />
              <Legend />
              {yColumns.map((col, i) => (
                <Area
                  key={col}
                  type="monotone"
                  dataKey={col}
                  stroke={getColor(col, i)}
                  fill={getColor(col, i)}
                  fillOpacity={0.3}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )

      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey={yColumns[0]}
                nameKey={xColumn}
                cx="50%"
                cy="50%"
                outerRadius="70%"
                label
              >
                {chartData.map((_, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xColumn} name={xColumn} type="number" />
              <YAxis dataKey={yColumns[0]} name={yColumns[0]} type="number" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Legend />
              <Scatter
                name={`${xColumn} vs ${yColumns[0]}`}
                data={chartData}
                fill={getColor(yColumns[0], 0)}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col min-h-0" {...dropzoneProps}>
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/5 border-2 border-dashed border-primary rounded-lg">
          <p className="text-sm text-primary font-medium">Drop data file</p>
        </div>
      )}
      <ToolToolbar
        title="Chart Builder"
        status={chartData.length > 0 ? { type: "info", label: `${chartData.length} data points` } : null}
        exportOptions={chartData.length > 0 && yColumns.length > 0 ? exportOptions : undefined}
        presets={CHART_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />
      <div className="flex-1 flex min-h-0">
        {/* Left panel */}
        <div className="w-[35%] min-w-[300px] border-r border-border flex flex-col min-h-0 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Data input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Data (CSV or JSON)
                </label>
                <Button variant="outline" size="sm" onClick={handleLoadExample}>
                  Load Example
                </Button>
              </div>
              <textarea
                className="w-full h-40 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                placeholder="Paste CSV or JSON array data here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              {columns.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Detected {columns.length} columns: {columns.join(", ")}
                </p>
              )}
            </div>

            {/* Chart type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Chart Type
              </label>
              <div className="flex gap-1">
                {CHART_TYPES.map((ct) => (
                  <button
                    key={ct.value}
                    onClick={() => setChartType(ct.value)}
                    className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      chartType === ct.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-input hover:bg-accent"
                    }`}
                  >
                    {ct.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Chart Title
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter chart title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* X axis */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                X Axis
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={xColumn}
                onChange={(e) => setXColumn(e.target.value)}
              >
                <option value="">Select column...</option>
                {columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            {/* Y axis */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Y Axis{" "}
                {chartType !== "pie" && chartType !== "scatter" && (
                  <span className="text-muted-foreground font-normal">
                    (multi-select)
                  </span>
                )}
              </label>
              <div className="space-y-1.5">
                {numericColumns.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No numeric columns detected
                  </p>
                ) : (
                  numericColumns.map((col) => (
                    <label
                      key={col}
                      className="flex items-center gap-2 text-sm text-foreground cursor-pointer"
                    >
                      <input
                        type={
                          chartType === "pie" || chartType === "scatter"
                            ? "radio"
                            : "checkbox"
                        }
                        name="y-column"
                        checked={yColumns.includes(col)}
                        onChange={() => {
                          if (
                            chartType === "pie" ||
                            chartType === "scatter"
                          ) {
                            setYColumns([col])
                            setColors((pc) => ({
                              ...pc,
                              [col]:
                                pc[col] ?? DEFAULT_PALETTE[0],
                            }))
                          } else {
                            handleYColumnToggle(col)
                          }
                        }}
                        className="accent-primary"
                      />
                      {col}
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Per-series colors */}
            {yColumns.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Series Colors
                </label>
                <div className="space-y-1.5">
                  {yColumns.map((col, i) => (
                    <div key={col} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={getColor(col, i)}
                        onChange={(e) =>
                          handleColorChange(col, e.target.value)
                        }
                        className="w-8 h-8 rounded border border-input cursor-pointer"
                      />
                      <span className="text-sm text-foreground">{col}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Export
              </label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPng}
                  disabled={chartData.length === 0 || yColumns.length === 0}
                >
                  <ImageIcon className="w-4 h-4 mr-1" />
                  PNG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSvg}
                  disabled={chartData.length === 0 || yColumns.length === 0}
                >
                  <CodeIcon className="w-4 h-4 mr-1" />
                  SVG
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel - Chart preview */}
        <div className="flex-1 flex flex-col min-h-0 p-4">
          {title && (
            <h2 className="text-lg font-semibold text-foreground text-center mb-2">
              {title}
            </h2>
          )}
          <div ref={chartRef} className="flex-1 min-h-0">
            {renderChart()}
          </div>
        </div>
      </div>
    </div>
  )
}
