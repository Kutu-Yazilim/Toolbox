// ─── Types ──────────────────────────────────────────────────────────────────

export type FilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "greater_than"
  | "less_than"
  | "exists"
  | "not_exists"

export type FilterStep = {
  type: "filter"
  field: string
  operator: FilterOperator
  value: string
}

export type SortStep = {
  type: "sort"
  field: string
  direction: "asc" | "desc"
}

export type SelectFieldsStep = {
  type: "select_fields"
  fields: string[]
}

export type RenameFieldStep = {
  type: "rename_field"
  from: string
  to: string
}

export type DeduplicateStep = {
  type: "deduplicate"
  field: string
}

export type LimitStep = {
  type: "limit"
  count: number
}

export type TransformStep =
  | FilterStep
  | SortStep
  | SelectFieldsStep
  | RenameFieldStep
  | DeduplicateStep
  | LimitStep

export type StepType = TransformStep["type"]

export const STEP_LABELS: Record<StepType, string> = {
  filter: "Filter",
  sort: "Sort",
  select_fields: "Select Fields",
  rename_field: "Rename Field",
  deduplicate: "Deduplicate",
  limit: "Limit",
}

export const FILTER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "exists", label: "Exists" },
  { value: "not_exists", label: "Not Exists" },
]

// ─── Default step creators ──────────────────────────────────────────────────

export function createDefaultStep(type: StepType, columns: string[]): TransformStep {
  const firstCol = columns[0] ?? ""
  switch (type) {
    case "filter":
      return { type: "filter", field: firstCol, operator: "equals", value: "" }
    case "sort":
      return { type: "sort", field: firstCol, direction: "asc" }
    case "select_fields":
      return { type: "select_fields", fields: [...columns] }
    case "rename_field":
      return { type: "rename_field", from: firstCol, to: "" }
    case "deduplicate":
      return { type: "deduplicate", field: firstCol }
    case "limit":
      return { type: "limit", count: 10 }
  }
}

// ─── Step execution ─────────────────────────────────────────────────────────

type Row = Record<string, unknown>

function applyFilter(data: Row[], step: FilterStep): Row[] {
  return data.filter((row) => {
    const val = row[step.field]
    const strVal = String(val ?? "")
    const numVal = Number(val)

    switch (step.operator) {
      case "equals":
        return strVal === step.value
      case "not_equals":
        return strVal !== step.value
      case "contains":
        return strVal.toLowerCase().includes(step.value.toLowerCase())
      case "greater_than":
        return !isNaN(numVal) && numVal > Number(step.value)
      case "less_than":
        return !isNaN(numVal) && numVal < Number(step.value)
      case "exists":
        return val !== undefined && val !== null && strVal !== ""
      case "not_exists":
        return val === undefined || val === null || strVal === ""
    }
  })
}

function applySort(data: Row[], step: SortStep): Row[] {
  const sorted = [...data]
  sorted.sort((a, b) => {
    const aVal = a[step.field]
    const bVal = b[step.field]
    const aNum = Number(aVal)
    const bNum = Number(bVal)

    let cmp: number
    if (!isNaN(aNum) && !isNaN(bNum)) {
      cmp = aNum - bNum
    } else {
      cmp = String(aVal ?? "").localeCompare(String(bVal ?? ""))
    }

    return step.direction === "desc" ? -cmp : cmp
  })
  return sorted
}

function applySelectFields(data: Row[], step: SelectFieldsStep): Row[] {
  return data.map((row) => {
    const newRow: Row = {}
    for (const field of step.fields) {
      if (field in row) {
        newRow[field] = row[field]
      }
    }
    return newRow
  })
}

function applyRenameField(data: Row[], step: RenameFieldStep): Row[] {
  if (!step.from || !step.to) return data
  return data.map((row) => {
    const newRow: Row = {}
    for (const [key, value] of Object.entries(row)) {
      newRow[key === step.from ? step.to : key] = value
    }
    return newRow
  })
}

function applyDeduplicate(data: Row[], step: DeduplicateStep): Row[] {
  const seen = new Set<string>()
  return data.filter((row) => {
    const key = String(row[step.field] ?? "")
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function applyLimit(data: Row[], step: LimitStep): Row[] {
  return data.slice(0, Math.max(0, step.count))
}

function applyStep(data: Row[], step: TransformStep): Row[] {
  switch (step.type) {
    case "filter":
      return applyFilter(data, step)
    case "sort":
      return applySort(data, step)
    case "select_fields":
      return applySelectFields(data, step)
    case "rename_field":
      return applyRenameField(data, step)
    case "deduplicate":
      return applyDeduplicate(data, step)
    case "limit":
      return applyLimit(data, step)
  }
}

export function applyPipeline(
  data: Row[],
  steps: TransformStep[],
): { data: Row[]; error: string | null } {
  try {
    const result = steps.reduce((acc, step) => applyStep(acc, step), data)
    return { data: result, error: null }
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : "Unknown error" }
  }
}

// ─── Parsing ────────────────────────────────────────────────────────────────

export function parseInput(text: string): { data: Row[]; columns: string[]; error: string | null } {
  const trimmed = text.trim()
  if (!trimmed) return { data: [], columns: [], error: null }

  if (trimmed.startsWith("[")) {
    return parseJson(trimmed)
  }
  return parseCsv(trimmed)
}

function parseJson(text: string): { data: Row[]; columns: string[]; error: string | null } {
  try {
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed)) {
      return { data: [], columns: [], error: "JSON must be an array" }
    }
    if (parsed.length === 0) {
      return { data: [], columns: [], error: null }
    }
    const columns = Array.from(
      new Set(parsed.flatMap((item: unknown) => (typeof item === "object" && item ? Object.keys(item) : []))),
    ) as string[]
    return { data: parsed as Row[], columns, error: null }
  } catch {
    return { data: [], columns: [], error: "Invalid JSON" }
  }
}

function parseCsv(text: string): { data: Row[]; columns: string[]; error: string | null } {
  try {
    const lines = text.split("\n").filter((l) => l.trim())
    if (lines.length < 2) {
      return { data: [], columns: [], error: "CSV must have a header row and at least one data row" }
    }

    const delimiter = detectCsvDelimiter(lines[0])
    const headers = lines[0].split(delimiter).map((h) => h.trim())
    const data: Row[] = []

    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(delimiter).map((c) => c.trim())
      const row: Row = {}
      for (let j = 0; j < headers.length; j++) {
        const raw = cells[j] ?? ""
        const num = Number(raw)
        row[headers[j]] = raw !== "" && !isNaN(num) ? num : raw
      }
      data.push(row)
    }

    return { data, columns: headers, error: null }
  } catch {
    return { data: [], columns: [], error: "Failed to parse CSV" }
  }
}

function detectCsvDelimiter(headerLine: string): string {
  const delimiters = [",", "\t", ";", "|"]
  let best = ","
  let bestCount = 0
  for (const d of delimiters) {
    const count = headerLine.split(d).length
    if (count > bestCount) {
      bestCount = count
      best = d
    }
  }
  return best
}

// ─── Export helpers ──────────────────────────────────────────────────────────

export function toJsonString(data: Row[]): string {
  return JSON.stringify(data, null, 2)
}

export function toCsvString(data: Row[]): string {
  if (data.length === 0) return ""
  const columns = Object.keys(data[0])
  const header = columns.join(",")
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const val = String(row[col] ?? "")
        return val.includes(",") || val.includes('"') || val.includes("\n")
          ? `"${val.replace(/"/g, '""')}"`
          : val
      })
      .join(","),
  )
  return [header, ...rows].join("\n")
}
