"use client"

import { useState, useCallback, useMemo } from "react"
import { RefreshCwIcon, PlusIcon, TrashIcon } from "lucide-react"
import { faker } from "@faker-js/faker"
import { Button } from "@/components/ui/button"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { type ExportOption } from "@/components/shared/ExportMenu"
import { FAKE_DATA_PRESETS } from "./presets"

// ─── Types & constants ──────────────────────────────────────────────────────

type FieldType =
  | "fullName"
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "address"
  | "city"
  | "country"
  | "zipCode"
  | "company"
  | "jobTitle"
  | "uuid"
  | "url"
  | "ip"
  | "date"
  | "number"
  | "boolean"
  | "word"
  | "sentence"

type SchemaField = {
  id: string
  key: string
  type: FieldType
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "fullName", label: "Full Name" },
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "address", label: "Address" },
  { value: "city", label: "City" },
  { value: "country", label: "Country" },
  { value: "zipCode", label: "Zip Code" },
  { value: "company", label: "Company" },
  { value: "jobTitle", label: "Job Title" },
  { value: "uuid", label: "UUID" },
  { value: "url", label: "URL" },
  { value: "ip", label: "IP" },
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "word", label: "Word" },
  { value: "sentence", label: "Sentence" },
] as const

const MIN_ROWS = 1
const MAX_ROWS = 1000

const DEFAULT_SCHEMA: SchemaField[] = [
  { id: crypto.randomUUID(), key: "name", type: "fullName" },
  { id: crypto.randomUUID(), key: "email", type: "email" },
  { id: crypto.randomUUID(), key: "phone", type: "phone" },
]

// ─── Generation logic ───────────────────────────────────────────────────────

function generateValue(type: FieldType): unknown {
  switch (type) {
    case "fullName":
      return faker.person.fullName()
    case "firstName":
      return faker.person.firstName()
    case "lastName":
      return faker.person.lastName()
    case "email":
      return faker.internet.email()
    case "phone":
      return faker.phone.number()
    case "address":
      return faker.location.streetAddress()
    case "city":
      return faker.location.city()
    case "country":
      return faker.location.country()
    case "zipCode":
      return faker.location.zipCode()
    case "company":
      return faker.company.name()
    case "jobTitle":
      return faker.person.jobTitle()
    case "uuid":
      return faker.string.uuid()
    case "url":
      return faker.internet.url()
    case "ip":
      return faker.internet.ip()
    case "date":
      return faker.date.recent().toISOString()
    case "number":
      return faker.number.int({ min: 0, max: 10000 })
    case "boolean":
      return faker.datatype.boolean()
    case "word":
      return faker.lorem.word()
    case "sentence":
      return faker.lorem.sentence()
  }
}

function generateRows(schema: SchemaField[], count: number): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = []
  for (let i = 0; i < count; i++) {
    const row: Record<string, unknown> = {}
    for (const field of schema) {
      row[field.key || field.type] = generateValue(field.type)
    }
    rows.push(row)
  }
  return rows
}

// ─── Component ──────────────────────────────────────────────────────────────

interface FakeDataState {
  schema: SchemaField[]
  rowCount: number
}

const DEFAULT_STATE: FakeDataState = {
  schema: DEFAULT_SCHEMA,
  rowCount: 10,
}

export function FakeDataGenerator() {
  const [settings, setSettings] = useLocalStorage<FakeDataState>("fake-data-generator", DEFAULT_STATE)
  const [output, setOutput] = useState("")

  const { shareUrl } = useShareableUrl("fake-data", settings, (restored) => {
    setSettings(restored)
    setOutput("")
  })

  const addField = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      schema: [...prev.schema, { id: crypto.randomUUID(), key: "", type: "fullName" }],
    }))
  }, [setSettings])

  const removeField = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      schema: prev.schema.filter((f) => f.id !== id),
    }))
  }, [setSettings])

  const updateField = useCallback(
    (id: string, updates: Partial<Pick<SchemaField, "key" | "type">>) => {
      setSettings(prev => ({
        ...prev,
        schema: prev.schema.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      }))
    },
    [setSettings],
  )

  const generate = useCallback(() => {
    const rows = generateRows(settings.schema, settings.rowCount)
    setOutput(JSON.stringify(rows, null, 2))
  }, [settings.schema, settings.rowCount])

  const handlePresetSelect = useCallback((preset: Preset) => {
    const fields = JSON.parse(preset.content) as { key: string; type: FieldType }[]
    setSettings(prev => ({
      ...prev,
      schema: fields.map(f => ({ id: crypto.randomUUID(), key: f.key, type: f.type })),
    }))
    setOutput("")
  }, [setSettings])

  const shortcuts: Shortcut[] = useMemo(() => [
    { key: "mod+shift+g", label: "Generate", action: generate },
    { key: "mod+shift+a", label: "Add field", action: addField },
  ], [generate, addField])

  useKeyboardShortcuts(shortcuts)

  const exportOptions: ExportOption[] = useMemo(() => [
    {
      label: "Download as JSON",
      action: () => {
        const blob = new Blob([output], { type: "application/json" })
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob)
        a.download = "fake-data.json"
        a.click()
        URL.revokeObjectURL(a.href)
      },
    },
    {
      label: "Download as CSV",
      action: () => {
        try {
          const rows = JSON.parse(output) as Record<string, unknown>[]
          if (!rows.length) return
          const keys = Object.keys(rows[0])
          const csv = [keys.join(","), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? "")).join(","))].join("\n")
          const blob = new Blob([csv], { type: "text/csv" })
          const a = document.createElement("a")
          a.href = URL.createObjectURL(blob)
          a.download = "fake-data.csv"
          a.click()
          URL.revokeObjectURL(a.href)
        } catch {
          // ignore
        }
      },
    },
  ], [output])

  return (
    <div className="h-full flex flex-col min-h-0">
      <ToolToolbar
        title="Fake Data"
        copyValue={output || undefined}
        onShare={shareUrl}
        exportOptions={exportOptions}
        presets={FAKE_DATA_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
      />

      {/* Schema builder */}
      <div className="flex-shrink-0 border-b bg-muted/20 px-4 py-3 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-muted-foreground">Rows</label>
          <input
            type="number"
            min={MIN_ROWS}
            max={MAX_ROWS}
            value={settings.rowCount}
            onChange={(e) => {
              const v = Math.max(
                MIN_ROWS,
                Math.min(MAX_ROWS, Number(e.target.value) || MIN_ROWS),
              )
              setSettings(prev => ({ ...prev, rowCount: v }))
            }}
            className="w-20 rounded-md border bg-muted/40 px-2 py-1.5 text-xs text-center font-medium"
          />

          <div className="flex items-center gap-2 ml-auto">
            <Button onClick={generate} size="sm">
              <RefreshCwIcon className="size-3.5" />
              Generate
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {settings.schema.map((field) => (
            <div key={field.id} className="flex items-center gap-2">
              <input
                type="text"
                value={field.key}
                onChange={(e) =>
                  updateField(field.id, { key: e.target.value })
                }
                placeholder="key"
                className="w-40 rounded-md border bg-muted/40 px-2 py-1.5 text-xs font-medium"
              />
              <select
                value={field.type}
                onChange={(e) =>
                  updateField(field.id, {
                    type: e.target.value as FieldType,
                  })
                }
                className="rounded-md border bg-muted/40 px-2 py-1.5 text-xs font-medium"
              >
                {FIELD_TYPES.map((ft) => (
                  <option key={ft.value} value={ft.value}>
                    {ft.label}
                  </option>
                ))}
              </select>
              <Button
                onClick={() => removeField(field.id)}
                variant="ghost"
                size="sm"
                className="size-7 p-0"
              >
                <TrashIcon className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <Button onClick={addField} variant="outline" size="sm">
          <PlusIcon className="size-3.5" />
          Add Field
        </Button>
      </div>

      {/* Output area */}
      <div className="flex-1 overflow-y-auto p-4">
        {output ? (
          <pre className="text-xs leading-relaxed whitespace-pre-wrap break-all">
            {output}
          </pre>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Define your schema and click Generate
          </div>
        )}
      </div>
    </div>
  )
}
