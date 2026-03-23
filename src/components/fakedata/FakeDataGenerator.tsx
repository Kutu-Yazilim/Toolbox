import { useState, useCallback } from "react"
import { RefreshCwIcon, CopyIcon, CheckIcon, PlusIcon, TrashIcon } from "lucide-react"
import { faker } from "@faker-js/faker"
import { Button } from "@/components/ui/button"

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

export function FakeDataGenerator() {
  const [schema, setSchema] = useState<SchemaField[]>(DEFAULT_SCHEMA)
  const [rowCount, setRowCount] = useState(10)
  const [output, setOutput] = useState("")
  const [copied, setCopied] = useState(false)

  const addField = useCallback(() => {
    setSchema((prev) => [
      ...prev,
      { id: crypto.randomUUID(), key: "", type: "fullName" },
    ])
  }, [])

  const removeField = useCallback((id: string) => {
    setSchema((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const updateField = useCallback(
    (id: string, updates: Partial<Pick<SchemaField, "key" | "type">>) => {
      setSchema((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      )
    },
    [],
  )

  const generate = useCallback(() => {
    const rows = generateRows(schema, rowCount)
    setOutput(JSON.stringify(rows, null, 2))
    setCopied(false)
  }, [schema, rowCount])

  const copy = useCallback(() => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [output])

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Schema builder */}
      <div className="flex-shrink-0 border-b bg-muted/20 px-4 py-3 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-muted-foreground">Rows</label>
          <input
            type="number"
            min={MIN_ROWS}
            max={MAX_ROWS}
            value={rowCount}
            onChange={(e) => {
              const v = Math.max(
                MIN_ROWS,
                Math.min(MAX_ROWS, Number(e.target.value) || MIN_ROWS),
              )
              setRowCount(v)
            }}
            className="w-20 rounded-md border bg-muted/40 px-2 py-1.5 text-xs text-center font-medium"
          />

          <div className="flex items-center gap-2 ml-auto">
            <Button onClick={generate} size="sm">
              <RefreshCwIcon className="size-3.5" />
              Generate
            </Button>
            {output && (
              <Button onClick={copy} variant="outline" size="sm">
                {copied ? (
                  <CheckIcon className="size-3.5" />
                ) : (
                  <CopyIcon className="size-3.5" />
                )}
                {copied ? "Copied" : "Copy JSON"}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {schema.map((field) => (
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
