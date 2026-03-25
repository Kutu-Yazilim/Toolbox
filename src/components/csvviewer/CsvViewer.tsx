"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  PlusIcon,
  PlusCircleIcon,
  DownloadIcon,
  CopyIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  XIcon,
  UploadIcon,
  FileSpreadsheetIcon,
} from "lucide-react"

type Delimiter = "," | "\t" | ";" | "|"
type SortDir = "asc" | "desc" | null

const DELIMITER_OPTIONS: { value: Delimiter; label: string }[] = [
  { value: ",", label: "Comma" },
  { value: "\t", label: "Tab" },
  { value: ";", label: "Semicolon" },
  { value: "|", label: "Pipe" },
]

const EXAMPLE_CSV = `Name,Age,City,Role
Alice,30,New York,Engineer
Bob,25,San Francisco,Designer
Charlie,35,London,Manager
Diana,28,Berlin,Developer
Eve,32,Tokyo,Analyst`

function detectDelimiter(text: string): Delimiter {
  const lines = text.trim().split("\n").slice(0, 5)
  if (lines.length === 0) return ","

  const delimiters: Delimiter[] = [",", "\t", ";", "|"]
  let best: Delimiter = ","
  let bestScore = -1

  for (const d of delimiters) {
    const counts = lines.map((line) => line.split(d).length)
    const allSame = counts.every((c) => c === counts[0])
    const score = allSame ? counts[0] : 0
    if (score > bestScore) {
      bestScore = score
      best = d
    }
  }

  return best
}

function parseCSV(text: string, delimiter: Delimiter): string[][] {
  if (!text.trim()) return []
  return text
    .trim()
    .split("\n")
    .map((line) => line.split(delimiter).map((cell) => cell.trim()))
}

function serializeCSV(data: string[][], delimiter: Delimiter): string {
  return data.map((row) => row.join(delimiter)).join("\n")
}

export function CsvViewer() {
  const [rawInput, setRawInput] = useState("")
  const [data, setData] = useState<string[][]>([])
  const [delimiter, setDelimiter] = useState<Delimiter>(",")
  const [sortCol, setSortCol] = useState<number | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)
  const [editCell, setEditCell] = useState<{ row: number; col: number } | null>(null)
  const [editValue, setEditValue] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const loadData = useCallback(
    (text: string, overrideDelimiter?: Delimiter) => {
      const det = overrideDelimiter ?? detectDelimiter(text)
      setDelimiter(det)
      setRawInput(text)
      setData(parseCSV(text, det))
      setSortCol(null)
      setSortDir(null)
    },
    [],
  )

  const reparseWithDelimiter = useCallback(
    (d: Delimiter) => {
      setDelimiter(d)
      setData(parseCSV(rawInput, d))
      setSortCol(null)
      setSortDir(null)
    },
    [rawInput],
  )

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        loadData(text)
      }
      reader.readAsText(file)
    },
    [loadData],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleSort = useCallback(
    (colIndex: number) => {
      if (sortCol === colIndex) {
        if (sortDir === "asc") setSortDir("desc")
        else if (sortDir === "desc") {
          setSortCol(null)
          setSortDir(null)
          return
        }
      } else {
        setSortCol(colIndex)
        setSortDir("asc")
      }
    },
    [sortCol, sortDir],
  )

  const sortedRows = useMemo(() => {
    if (data.length < 2) return data.slice(1).map((row, i) => ({ row, originalIndex: i + 1 }))
    const indexed = data.slice(1).map((row, i) => ({ row, originalIndex: i + 1 }))
    if (sortCol === null || sortDir === null) return indexed

    return [...indexed].sort((a, b) => {
      const aVal = a.row[sortCol] ?? ""
      const bVal = b.row[sortCol] ?? ""
      const aNum = Number(aVal)
      const bNum = Number(bVal)
      const isNumeric = !isNaN(aNum) && !isNaN(bNum) && aVal !== "" && bVal !== ""

      const cmp = isNumeric ? aNum - bNum : aVal.localeCompare(bVal)
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [data, sortCol, sortDir])

  const headers = data.length > 0 ? data[0] : []

  const startEdit = useCallback((row: number, col: number, value: string) => {
    setEditCell({ row, col })
    setEditValue(value)
  }, [])

  const commitEdit = useCallback(() => {
    if (!editCell) return
    setData((prev) => {
      const next = prev.map((r) => [...r])
      // editCell.row is 0-based for body rows, but data[0] is headers
      next[editCell.row][editCell.col] = editValue
      return next
    })
    setEditCell(null)
  }, [editCell, editValue])

  const addRow = useCallback(() => {
    setData((prev) => {
      if (prev.length === 0) return prev
      const colCount = prev[0].length
      return [...prev, Array(colCount).fill("")]
    })
  }, [])

  const addColumn = useCallback(() => {
    setData((prev) => {
      if (prev.length === 0) return [["New Column"]]
      return prev.map((row, i) => [...row, i === 0 ? "New Column" : ""])
    })
  }, [])

  const deleteRow = useCallback((dataIndex: number) => {
    setData((prev) => prev.filter((_, i) => i !== dataIndex))
  }, [])

  const exportCSV = useCallback(() => {
    const text = serializeCSV(data, delimiter)
    const blob = new Blob([text], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "export.csv"
    a.click()
    URL.revokeObjectURL(url)
  }, [data, delimiter])

  const exportJSON = useCallback(() => {
    if (data.length < 2) return
    const h = data[0]
    const objects = data.slice(1).map((row) => {
      const obj: Record<string, string> = {}
      h.forEach((key, i) => {
        obj[key] = row[i] ?? ""
      })
      return obj
    })
    navigator.clipboard.writeText(JSON.stringify(objects, null, 2))
  }, [data])

  const copyCSV = useCallback(() => {
    navigator.clipboard.writeText(serializeCSV(data, delimiter))
  }, [data, delimiter])

  // Input mode
  if (data.length === 0) {
    return (
      <div className="h-full flex flex-col min-h-0">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/20">
          <FileSpreadsheetIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            CSV Viewer
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 min-h-0">
          <div className="w-full max-w-2xl space-y-4">
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
            >
              <UploadIcon className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-3">
                Drag and drop a CSV/TSV file here, or paste data below
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                }}
              />
            </div>
            <textarea
              className="w-full h-40 rounded-md border border-border bg-background p-3 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Paste CSV or TSV data here..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  const target = e.target as HTMLTextAreaElement
                  if (target.value.trim()) loadData(target.value)
                }
              }}
              onBlur={(e) => {
                if (e.target.value.trim()) loadData(e.target.value)
              }}
            />
            <div className="flex justify-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => loadData(EXAMPLE_CSV)}
              >
                Load Example
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Table mode
  const rowCount = data.length - 1

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-muted/20 flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-muted-foreground">Delimiter:</label>
          <select
            className="h-7 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            value={delimiter}
            onChange={(e) => reparseWithDelimiter(e.target.value as Delimiter)}
          >
            {DELIMITER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-px h-5 bg-border" />

        <Button variant="ghost" size="xs" onClick={addRow} title="Add Row">
          <PlusIcon className="h-3 w-3 mr-1" />
          <span className="text-xs">Row</span>
        </Button>
        <Button variant="ghost" size="xs" onClick={addColumn} title="Add Column">
          <PlusCircleIcon className="h-3 w-3 mr-1" />
          <span className="text-xs">Column</span>
        </Button>

        <div className="w-px h-5 bg-border" />

        <Button variant="ghost" size="xs" onClick={exportCSV} title="Export CSV">
          <DownloadIcon className="h-3 w-3 mr-1" />
          <span className="text-xs">CSV</span>
        </Button>
        <Button variant="ghost" size="xs" onClick={exportJSON} title="Export JSON to clipboard">
          <CopyIcon className="h-3 w-3 mr-1" />
          <span className="text-xs">JSON</span>
        </Button>
        <Button variant="ghost" size="xs" onClick={copyCSV} title="Copy CSV to clipboard">
          <CopyIcon className="h-3 w-3 mr-1" />
          <span className="text-xs">Copy</span>
        </Button>

        <div className="flex-1" />

        <span className="text-xs text-muted-foreground">
          {rowCount} row{rowCount !== 1 ? "s" : ""} x {headers.length} col
          {headers.length !== 1 ? "s" : ""}
        </span>

        <Button
          variant="ghost"
          size="xs"
          onClick={() => {
            setData([])
            setRawInput("")
            setSortCol(null)
            setSortDir(null)
          }}
          title="Clear data"
        >
          <XIcon className="h-3 w-3 mr-1" />
          <span className="text-xs">Clear</span>
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr>
              <th className="px-2 py-1.5 text-xs text-muted-foreground font-medium border-b border-r border-border w-8 text-center">
                #
              </th>
              {headers.map((header, colIdx) => (
                <th
                  key={colIdx}
                  className="px-3 py-1.5 text-xs font-medium text-left border-b border-r border-border cursor-pointer select-none hover:bg-accent/50 transition-colors"
                  onClick={() => handleSort(colIdx)}
                >
                  <span className="flex items-center gap-1">
                    {editCell?.row === 0 && editCell?.col === colIdx ? (
                      <input
                        className="w-full bg-background border border-ring rounded px-1 py-0.5 text-xs focus:outline-none"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit()
                          if (e.key === "Escape") setEditCell(null)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <span
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          startEdit(0, colIdx, header)
                        }}
                      >
                        {header}
                      </span>
                    )}
                    {sortCol === colIdx && sortDir === "asc" && (
                      <ArrowUpIcon className="h-3 w-3 text-primary flex-shrink-0" />
                    )}
                    {sortCol === colIdx && sortDir === "desc" && (
                      <ArrowDownIcon className="h-3 w-3 text-primary flex-shrink-0" />
                    )}
                  </span>
                </th>
              ))}
              <th className="px-2 py-1.5 border-b border-border w-8" />
            </tr>
          </thead>
          <tbody>
            {sortedRows.map(({ row, originalIndex }, displayIdx) => (
                <tr
                  key={originalIndex}
                  className={displayIdx % 2 === 0 ? "bg-background" : "bg-muted/30"}
                >
                  <td className="px-2 py-1 text-xs text-muted-foreground text-center border-r border-border">
                    {displayIdx + 1}
                  </td>
                  {headers.map((_, colIdx) => {
                    const cellValue = row[colIdx] ?? ""
                    const isEditing =
                      editCell?.row === originalIndex && editCell?.col === colIdx

                    return (
                      <td
                        key={colIdx}
                        className="px-3 py-1 border-r border-border"
                        onDoubleClick={() =>
                          startEdit(originalIndex, colIdx, cellValue)
                        }
                      >
                        {isEditing ? (
                          <input
                            className="w-full bg-background border border-ring rounded px-1 py-0.5 text-sm focus:outline-none"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEdit()
                              if (e.key === "Escape") setEditCell(null)
                            }}
                            autoFocus
                          />
                        ) : (
                          cellValue
                        )}
                      </td>
                    )
                  })}
                  <td className="px-1 py-1 text-center">
                    <button
                      className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => deleteRow(originalIndex)}
                      title="Delete row"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
