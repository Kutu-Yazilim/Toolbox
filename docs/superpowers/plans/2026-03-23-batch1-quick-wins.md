# Batch 1: Quick Wins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 10 simple, stateless tools to kutu-tree — deepening Generators, Converters, and Dev Tools categories, and introducing the Security category.

**Architecture:** Each tool follows the existing pattern: component in `src/components/<name>/`, entry in `toolRegistry.ts`, lazy-loaded route in `router.tsx`. No new layouts needed except for the new Security category which uses the existing `CategoryLayout`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide icons, Web Crypto API (for Hash Generator), shadcn UI components. One new dependency: `@faker-js/faker` for Fake Data Generator.

**Spec:** `docs/superpowers/specs/2026-03-23-tool-expansion-design.md`

---

## File Structure Overview

Each tool creates 1-2 files and modifies 2 shared files:

**New files per tool:**
- `src/components/<name>/<ComponentName>.tsx` — main component

**Modified shared files (touched by every task):**
- `src/config/toolRegistry.ts` — add tool entry + category type (Security only) + icon import
- `src/router.tsx` — add lazy import + route

**New dependency (Task 3 only):**
- `@faker-js/faker` — installed via npm

---

## Task 1: UUID Generator

**Files:**
- Create: `src/components/uuid/UuidGenerator.tsx`
- Modify: `src/config/toolRegistry.ts`
- Modify: `src/router.tsx`

- [ ] **Step 1: Create the UUID Generator component**

Create `src/components/uuid/UuidGenerator.tsx`:

```tsx
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon, RefreshCwIcon, TrashIcon } from "lucide-react"

type UuidVersion = "v4" | "v1" | "v7"

function generateUuidV4(): string {
  return crypto.randomUUID()
}

function generateUuidV1(): string {
  // Time-based UUID v1 approximation using crypto
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  const now = Date.now()
  const ts = BigInt(now) * 10000n + 0x01B21DD213814000n
  bytes[0] = Number((ts >> 24n) & 0xFFn)
  bytes[1] = Number((ts >> 16n) & 0xFFn)
  bytes[2] = Number((ts >> 8n) & 0xFFn)
  bytes[3] = Number(ts & 0xFFn)
  bytes[4] = Number((ts >> 40n) & 0xFFn)
  bytes[5] = Number((ts >> 32n) & 0xFFn)
  bytes[6] = (Number((ts >> 56n) & 0x0Fn)) | 0x10
  bytes[7] = Number((ts >> 48n) & 0xFFn)
  bytes[8] = (bytes[8] & 0x3F) | 0x80
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
}

function generateUuidV7(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  const now = Date.now()
  bytes[0] = (now >> 40) & 0xFF
  bytes[1] = (now >> 32) & 0xFF
  bytes[2] = (now >> 24) & 0xFF
  bytes[3] = (now >> 16) & 0xFF
  bytes[4] = (now >> 8) & 0xFF
  bytes[5] = now & 0xFF
  bytes[6] = (bytes[6] & 0x0F) | 0x70
  bytes[8] = (bytes[8] & 0x3F) | 0x80
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
}

const GENERATORS: Record<UuidVersion, () => string> = {
  v4: generateUuidV4,
  v1: generateUuidV1,
  v7: generateUuidV7,
}

export function UuidGenerator() {
  const [version, setVersion] = useState<UuidVersion>("v4")
  const [count, setCount] = useState(1)
  const [uppercase, setUppercase] = useState(false)
  const [hyphens, setHyphens] = useState(true)
  const [uuids, setUuids] = useState<string[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const generate = useCallback(() => {
    const gen = GENERATORS[version]
    const results = Array.from({ length: count }, () => {
      let uuid = gen()
      if (!hyphens) uuid = uuid.replaceAll("-", "")
      if (uppercase) uuid = uuid.toUpperCase()
      return uuid
    })
    setUuids(results)
    setCopiedIndex(null)
  }, [version, count, uppercase, hyphens])

  const copyOne = async (uuid: string, index: number) => {
    await navigator.clipboard.writeText(uuid)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const copyAll = async () => {
    await navigator.clipboard.writeText(uuids.join("\n"))
    setCopiedIndex(-1)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-b border-border flex-shrink-0 bg-muted/20">
        {/* Version selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Version</span>
          <div className="flex rounded-md border border-border overflow-hidden">
            {(["v4", "v1", "v7"] as UuidVersion[]).map((v) => (
              <button
                key={v}
                onClick={() => setVersion(v)}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  version === v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Count</span>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-16 h-7 px-2 text-xs rounded-md border border-border bg-background text-foreground"
          />
        </div>

        {/* Toggles */}
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} className="rounded" />
          Uppercase
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={hyphens} onChange={(e) => setHyphens(e.target.checked)} className="rounded" />
          Hyphens
        </label>

        <Button size="sm" onClick={generate}>
          <RefreshCwIcon className="size-3.5 mr-1.5" />
          Generate
        </Button>

        {uuids.length > 1 && (
          <Button size="sm" variant="outline" onClick={copyAll}>
            {copiedIndex === -1 ? <CheckIcon className="size-3.5 mr-1.5" /> : <CopyIcon className="size-3.5 mr-1.5" />}
            {copiedIndex === -1 ? "Copied All" : "Copy All"}
          </Button>
        )}

        {uuids.length > 0 && (
          <Button size="sm" variant="ghost" onClick={() => setUuids([])}>
            <TrashIcon className="size-3.5 mr-1.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        {uuids.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Click Generate to create UUIDs
          </div>
        ) : (
          <div className="space-y-1.5">
            {uuids.map((uuid, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/10 font-mono text-sm group"
              >
                <span className="flex-1 select-all">{uuid}</span>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => copyOne(uuid, i)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {copiedIndex === i ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Register in toolRegistry.ts**

Add to icon imports in `toolRegistry.ts`:
```
FingerprintIcon
```

Add to `CategoryId` type: no change needed (goes in "generators").

Add to `TOOLS` array after the JWT entry:
```typescript
{
  id: "uuid",
  label: "UUID",
  description: "Generate UUID v1, v4, and v7 with bulk generation and format options",
  icon: FingerprintIcon,
  categoryId: "generators",
  path: "/generators/uuid",
},
```

- [ ] **Step 3: Add route in router.tsx**

Add lazy import:
```typescript
const UuidGenerator = React.lazy(() =>
  import("@/components/uuid/UuidGenerator").then((m) => ({
    default: m.UuidGenerator,
  })),
)
```

Add route under `generators` children (after `qr-code`):
```typescript
{ path: "uuid", element: lazy_(UuidGenerator) },
```

- [ ] **Step 4: Verify it works**

Run: `npm run dev`
Navigate to `/generators/uuid`. Verify:
- Version toggle switches between v4/v1/v7
- Count input works (1-100)
- Generate button produces UUIDs
- Copy individual and copy all work
- Uppercase/hyphens toggles format output

- [ ] **Step 5: Commit**

```bash
git add src/components/uuid/UuidGenerator.tsx src/config/toolRegistry.ts src/router.tsx
git commit -m "feat: add UUID Generator tool (v1/v4/v7, bulk, format options)"
```

---

## Task 2: Lorem Ipsum Generator

**Files:**
- Create: `src/components/lorem/LoremIpsumGenerator.tsx`
- Modify: `src/config/toolRegistry.ts`
- Modify: `src/router.tsx`

- [ ] **Step 1: Create the Lorem Ipsum Generator component**

Create `src/components/lorem/LoremIpsumGenerator.tsx`:

```tsx
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon, RefreshCwIcon } from "lucide-react"

const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
  "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum", "at", "vero", "eos",
  "accusamus", "iusto", "odio", "dignissimos", "ducimus", "blanditiis",
  "praesentium", "voluptatum", "deleniti", "atque", "corrupti", "quos", "dolores",
  "quas", "molestias", "excepturi", "obcaecati", "cupiditate", "provident",
  "similique", "mollitia", "animi", "perspiciatis", "unde", "omnis", "iste",
  "natus", "error", "voluptatem", "accusantium", "doloremque", "laudantium",
  "totam", "rem", "aperiam", "eaque", "ipsa", "quae", "ab", "illo", "inventore",
  "veritatis", "quasi", "architecto", "beatae", "vitae", "dicta", "explicabo",
]

type Mode = "paragraphs" | "sentences" | "words"

function randomWord(): string {
  return LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]
}

function generateSentence(minWords: number, maxWords: number): string {
  const count = minWords + Math.floor(Math.random() * (maxWords - minWords + 1))
  const words = Array.from({ length: count }, randomWord)
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1)
  return words.join(" ") + "."
}

function generateParagraph(): string {
  const sentenceCount = 4 + Math.floor(Math.random() * 4)
  return Array.from({ length: sentenceCount }, () => generateSentence(6, 14)).join(" ")
}

function generate(mode: Mode, count: number, startWithLorem: boolean): string {
  if (mode === "words") {
    const words = Array.from({ length: count }, randomWord)
    if (startWithLorem && count >= 2) {
      words[0] = "lorem"
      words[1] = "ipsum"
    }
    return words.join(" ")
  }

  if (mode === "sentences") {
    const sentences = Array.from({ length: count }, () => generateSentence(6, 14))
    if (startWithLorem) {
      sentences[0] = "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
    }
    return sentences.join(" ")
  }

  const paragraphs = Array.from({ length: count }, generateParagraph)
  if (startWithLorem) {
    paragraphs[0] = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " + paragraphs[0]
  }
  return paragraphs.join("\n\n")
}

export function LoremIpsumGenerator() {
  const [mode, setMode] = useState<Mode>("paragraphs")
  const [count, setCount] = useState(3)
  const [startWithLorem, setStartWithLorem] = useState(true)
  const [output, setOutput] = useState("")
  const [copied, setCopied] = useState(false)

  const handleGenerate = useCallback(() => {
    setOutput(generate(mode, count, startWithLorem))
    setCopied(false)
  }, [mode, count, startWithLorem])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-b border-border flex-shrink-0 bg-muted/20">
        {/* Mode selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Mode</span>
          <div className="flex rounded-md border border-border overflow-hidden">
            {(["paragraphs", "sentences", "words"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Count</span>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-16 h-7 px-2 text-xs rounded-md border border-border bg-background text-foreground"
          />
        </div>

        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={startWithLorem} onChange={(e) => setStartWithLorem(e.target.checked)} className="rounded" />
          Start with "Lorem ipsum..."
        </label>

        <Button size="sm" onClick={handleGenerate}>
          <RefreshCwIcon className="size-3.5 mr-1.5" />
          Generate
        </Button>

        {output && (
          <Button size="sm" variant="outline" onClick={handleCopy}>
            {copied ? <CheckIcon className="size-3.5 mr-1.5" /> : <CopyIcon className="size-3.5 mr-1.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        {output ? (
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{output}</div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Click Generate to create lorem ipsum text
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Register in toolRegistry.ts**

Add `TextIcon` is already imported. Add to `TOOLS` array in Generators section:
```typescript
{
  id: "lorem-ipsum",
  label: "Lorem Ipsum",
  description: "Generate placeholder text as paragraphs, sentences, or words",
  icon: TextIcon,
  categoryId: "generators",
  path: "/generators/lorem-ipsum",
},
```

- [ ] **Step 3: Add route in router.tsx**

Add lazy import:
```typescript
const LoremIpsumGenerator = React.lazy(() =>
  import("@/components/lorem/LoremIpsumGenerator").then((m) => ({
    default: m.LoremIpsumGenerator,
  })),
)
```

Add route under `generators` children:
```typescript
{ path: "lorem-ipsum", element: lazy_(LoremIpsumGenerator) },
```

- [ ] **Step 4: Verify it works**

Run: `npm run dev`
Navigate to `/generators/lorem-ipsum`. Verify mode toggle, count, start-with-lorem checkbox, generate, and copy work.

- [ ] **Step 5: Commit**

```bash
git add src/components/lorem/LoremIpsumGenerator.tsx src/config/toolRegistry.ts src/router.tsx
git commit -m "feat: add Lorem Ipsum Generator tool"
```

---

## Task 3: Fake Data Generator

**Files:**
- Create: `src/components/fakedata/FakeDataGenerator.tsx`
- Modify: `src/config/toolRegistry.ts`
- Modify: `src/router.tsx`
- Modify: `package.json` (new dependency)

- [ ] **Step 1: Install @faker-js/faker**

```bash
npm install @faker-js/faker
```

- [ ] **Step 2: Create the Fake Data Generator component**

Create `src/components/fakedata/FakeDataGenerator.tsx`:

```tsx
import { useState, useCallback } from "react"
import { faker } from "@faker-js/faker"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon, RefreshCwIcon, PlusIcon, TrashIcon } from "lucide-react"

type FieldType =
  | "fullName" | "firstName" | "lastName" | "email" | "phone"
  | "address" | "city" | "country" | "zipCode"
  | "company" | "jobTitle"
  | "uuid" | "url" | "ip" | "date" | "number" | "boolean" | "word" | "sentence"

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
  { value: "ip", label: "IP Address" },
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "word", label: "Word" },
  { value: "sentence", label: "Sentence" },
]

function generateValue(type: FieldType): string | number | boolean {
  switch (type) {
    case "fullName": return faker.person.fullName()
    case "firstName": return faker.person.firstName()
    case "lastName": return faker.person.lastName()
    case "email": return faker.internet.email()
    case "phone": return faker.phone.number()
    case "address": return faker.location.streetAddress()
    case "city": return faker.location.city()
    case "country": return faker.location.country()
    case "zipCode": return faker.location.zipCode()
    case "company": return faker.company.name()
    case "jobTitle": return faker.person.jobTitle()
    case "uuid": return faker.string.uuid()
    case "url": return faker.internet.url()
    case "ip": return faker.internet.ip()
    case "date": return faker.date.recent().toISOString().split("T")[0]
    case "number": return faker.number.int({ min: 0, max: 10000 })
    case "boolean": return faker.datatype.boolean()
    case "word": return faker.lorem.word()
    case "sentence": return faker.lorem.sentence()
  }
}

type SchemaField = { key: string; type: FieldType }

export function FakeDataGenerator() {
  const [fields, setFields] = useState<SchemaField[]>([
    { key: "name", type: "fullName" },
    { key: "email", type: "email" },
    { key: "phone", type: "phone" },
  ])
  const [rowCount, setRowCount] = useState(5)
  const [output, setOutput] = useState("")
  const [copied, setCopied] = useState(false)

  const addField = () => setFields((f) => [...f, { key: "field", type: "word" }])

  const removeField = (index: number) => setFields((f) => f.filter((_, i) => i !== index))

  const updateFieldKey = (index: number, key: string) =>
    setFields((f) => f.map((field, i) => (i === index ? { ...field, key } : field)))

  const updateFieldType = (index: number, type: FieldType) =>
    setFields((f) => f.map((field, i) => (i === index ? { ...field, type } : field)))

  const generate = useCallback(() => {
    const rows = Array.from({ length: rowCount }, () => {
      const obj: Record<string, string | number | boolean> = {}
      for (const field of fields) {
        obj[field.key] = generateValue(field.type)
      }
      return obj
    })
    setOutput(JSON.stringify(rows, null, 2))
    setCopied(false)
  }, [fields, rowCount])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Schema builder */}
      <div className="flex-shrink-0 border-b border-border bg-muted/20 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Schema</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Rows</span>
              <input
                type="number"
                min={1}
                max={1000}
                value={rowCount}
                onChange={(e) => setRowCount(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-20 h-7 px-2 text-xs rounded-md border border-border bg-background text-foreground"
              />
            </div>
            <Button size="sm" variant="outline" onClick={addField}>
              <PlusIcon className="size-3.5 mr-1" />
              Field
            </Button>
            <Button size="sm" onClick={generate}>
              <RefreshCwIcon className="size-3.5 mr-1.5" />
              Generate
            </Button>
            {output && (
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? <CheckIcon className="size-3.5 mr-1.5" /> : <CopyIcon className="size-3.5 mr-1.5" />}
                {copied ? "Copied" : "Copy JSON"}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {fields.map((field, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={field.key}
                onChange={(e) => updateFieldKey(i, e.target.value)}
                className="w-36 h-7 px-2 text-xs rounded-md border border-border bg-background text-foreground font-mono"
                placeholder="field name"
              />
              <select
                value={field.type}
                onChange={(e) => updateFieldType(i, e.target.value as FieldType)}
                className="h-7 px-2 text-xs rounded-md border border-border bg-background text-foreground flex-1"
              >
                {FIELD_TYPES.map((ft) => (
                  <option key={ft.value} value={ft.value}>{ft.label}</option>
                ))}
              </select>
              <Button size="icon-xs" variant="ghost" onClick={() => removeField(i)} disabled={fields.length <= 1}>
                <TrashIcon className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        {output ? (
          <pre className="text-xs font-mono whitespace-pre-wrap text-foreground">{output}</pre>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Define your schema and click Generate
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Register in toolRegistry.ts**

Add `DatabaseIcon` is already imported. Add `UsersIcon` to icon imports. Add to `TOOLS` array in Generators:
```typescript
{
  id: "fake-data",
  label: "Fake Data",
  description: "Generate fake names, emails, addresses, and custom JSON datasets",
  icon: UsersIcon,
  categoryId: "generators",
  path: "/generators/fake-data",
},
```

- [ ] **Step 4: Add route in router.tsx**

```typescript
const FakeDataGenerator = React.lazy(() =>
  import("@/components/fakedata/FakeDataGenerator").then((m) => ({
    default: m.FakeDataGenerator,
  })),
)
```

Route under `generators`:
```typescript
{ path: "fake-data", element: lazy_(FakeDataGenerator) },
```

- [ ] **Step 5: Verify and commit**

Navigate to `/generators/fake-data`. Test schema builder, generate, copy. Commit:
```bash
git add src/components/fakedata/FakeDataGenerator.tsx src/config/toolRegistry.ts src/router.tsx package.json package-lock.json
git commit -m "feat: add Fake Data Generator with custom JSON schema builder"
```

---

## Task 4: Hash Generator

**Files:**
- Create: `src/components/hash/HashGenerator.tsx`
- Modify: `src/config/toolRegistry.ts`
- Modify: `src/router.tsx`

- [ ] **Step 1: Create the Hash Generator component**

Create `src/components/hash/HashGenerator.tsx`:

```tsx
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon, FileUpIcon } from "lucide-react"

const ALGORITHMS = ["SHA-256", "SHA-384", "SHA-512", "SHA-1"] as const
type Algorithm = typeof ALGORITHMS[number]

async function hashText(text: string, algorithm: Algorithm): Promise<string> {
  const encoded = new TextEncoder().encode(text)
  const buffer = await crypto.subtle.digest(algorithm, encoded)
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function hashFile(file: File, algorithm: Algorithm): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hash = await crypto.subtle.digest(algorithm, buffer)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function md5(data: Uint8Array): Promise<string> {
  // MD5 is not in Web Crypto API — lightweight implementation
  // Using a well-known public domain MD5 implementation
  function md5cycle(x: number[], k: number[]) {
    let a = x[0], b = x[1], c = x[2], d = x[3]
    const ff = (a: number, b: number, c: number, d: number, k: number, s: number, t: number) => {
      a = (a + ((b & c) | (~b & d)) + k + t) | 0
      return (((a << s) | (a >>> (32 - s))) + b) | 0
    }
    const gg = (a: number, b: number, c: number, d: number, k: number, s: number, t: number) => {
      a = (a + ((b & d) | (c & ~d)) + k + t) | 0
      return (((a << s) | (a >>> (32 - s))) + b) | 0
    }
    const hh = (a: number, b: number, c: number, d: number, k: number, s: number, t: number) => {
      a = (a + (b ^ c ^ d) + k + t) | 0
      return (((a << s) | (a >>> (32 - s))) + b) | 0
    }
    const ii = (a: number, b: number, c: number, d: number, k: number, s: number, t: number) => {
      a = (a + (c ^ (b | ~d)) + k + t) | 0
      return (((a << s) | (a >>> (32 - s))) + b) | 0
    }
    a=ff(a,b,c,d,k[0],7,-680876936);d=ff(d,a,b,c,k[1],12,-389564586);c=ff(c,d,a,b,k[2],17,606105819);b=ff(b,c,d,a,k[3],22,-1044525330)
    a=ff(a,b,c,d,k[4],7,-176418897);d=ff(d,a,b,c,k[5],12,1200080426);c=ff(c,d,a,b,k[6],17,-1473231341);b=ff(b,c,d,a,k[7],22,-45705983)
    a=ff(a,b,c,d,k[8],7,1770035416);d=ff(d,a,b,c,k[9],12,-1958414417);c=ff(c,d,a,b,k[10],17,-42063);b=ff(b,c,d,a,k[11],22,-1990404162)
    a=ff(a,b,c,d,k[12],7,1804603682);d=ff(d,a,b,c,k[13],12,-40341101);c=ff(c,d,a,b,k[14],17,-1502002290);b=ff(b,c,d,a,k[15],22,1236535329)
    a=gg(a,b,c,d,k[1],5,-165796510);d=gg(d,a,b,c,k[6],9,-1069501632);c=gg(c,d,a,b,k[11],14,643717713);b=gg(b,c,d,a,k[0],20,-373897302)
    a=gg(a,b,c,d,k[5],5,-701558691);d=gg(d,a,b,c,k[10],9,38016083);c=gg(c,d,a,b,k[15],14,-660478335);b=gg(b,c,d,a,k[4],20,-405537848)
    a=gg(a,b,c,d,k[9],5,568446438);d=gg(d,a,b,c,k[14],9,-1019803690);c=gg(c,d,a,b,k[3],14,-187363961);b=gg(b,c,d,a,k[8],20,1163531501)
    a=gg(a,b,c,d,k[13],5,-1444681467);d=gg(d,a,b,c,k[2],9,-51403784);c=gg(c,d,a,b,k[7],14,1735328473);b=gg(b,c,d,a,k[12],20,-1926607734)
    a=hh(a,b,c,d,k[5],4,-378558);d=hh(d,a,b,c,k[8],11,-2022574463);c=hh(c,d,a,b,k[11],16,1839030562);b=hh(b,c,d,a,k[14],23,-35309556)
    a=hh(a,b,c,d,k[1],4,-1530992060);d=hh(d,a,b,c,k[4],11,1272893353);c=hh(c,d,a,b,k[7],16,-155497632);b=hh(b,c,d,a,k[10],23,-1094730640)
    a=hh(a,b,c,d,k[13],4,681279174);d=hh(d,a,b,c,k[0],11,-358537222);c=hh(c,d,a,b,k[3],16,-722521979);b=hh(b,c,d,a,k[6],23,76029189)
    a=hh(a,b,c,d,k[9],4,-640364487);d=hh(d,a,b,c,k[12],11,-421815835);c=hh(c,d,a,b,k[15],16,530742520);b=hh(b,c,d,a,k[2],23,-995338651)
    a=ii(a,b,c,d,k[0],6,-198630844);d=ii(d,a,b,c,k[7],10,1126891415);c=ii(c,d,a,b,k[14],15,-1416354905);b=ii(b,c,d,a,k[5],21,-57434055)
    a=ii(a,b,c,d,k[12],6,1700485571);d=ii(d,a,b,c,k[3],10,-1894986606);c=ii(c,d,a,b,k[10],15,-1051523);b=ii(b,c,d,a,k[1],21,-2054922799)
    a=ii(a,b,c,d,k[8],6,1873313359);d=ii(d,a,b,c,k[15],10,-30611744);c=ii(c,d,a,b,k[6],15,-1560198380);b=ii(b,c,d,a,k[13],21,1309151649)
    a=ii(a,b,c,d,k[4],6,-145523070);d=ii(d,a,b,c,k[11],10,-1120210379);c=ii(c,d,a,b,k[2],15,718787259);b=ii(b,c,d,a,k[9],21,-343485551)
    x[0]=(a+x[0])|0;x[1]=(b+x[1])|0;x[2]=(c+x[2])|0;x[3]=(d+x[3])|0
  }

  const n = data.length
  const state = [1732584193, -271733879, -1732584194, 271733878]
  let i: number

  for (i = 64; i <= n; i += 64) {
    const k = new Array(16)
    for (let j = 0; j < 64; j += 4) {
      k[j >> 2] = data[i - 64 + j] | (data[i - 64 + j + 1] << 8) | (data[i - 64 + j + 2] << 16) | (data[i - 64 + j + 3] << 24)
    }
    md5cycle(state, k)
  }

  const tail = new Array(16).fill(0)
  for (let j = 0; j < n - i + 64; j++) {
    tail[j >> 2] |= data[i - 64 + j] << ((j % 4) << 3)
  }
  tail[(n - i + 64) >> 2] |= 0x80 << (((n - i + 64) % 4) << 3)
  if ((n - i + 64) > 55) {
    md5cycle(state, tail)
    tail.fill(0)
  }
  tail[14] = (n * 8) | 0
  tail[15] = (n * 8) / 4294967296 | 0
  md5cycle(state, tail)

  const hex = (n: number) =>
    Array.from({ length: 4 }, (_, i) => ((n >> (i * 8)) & 0xFF).toString(16).padStart(2, "0")).join("")
  return state.map(hex).join("")
}

export function HashGenerator() {
  const [input, setInput] = useState("")
  const [hashes, setHashes] = useState<Record<string, string>>({})
  const [fileName, setFileName] = useState("")
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const computeHashes = useCallback(async (data: string | ArrayBuffer) => {
    const isText = typeof data === "string"
    const encoded = isText ? new TextEncoder().encode(data) : new Uint8Array(data)

    const results: Record<string, string> = {}
    results["MD5"] = await md5(new Uint8Array(encoded))
    for (const algo of ALGORITHMS) {
      const buffer = await crypto.subtle.digest(algo, encoded)
      results[algo] = Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    }
    setHashes(results)
  }, [])

  const handleTextChange = (text: string) => {
    setInput(text)
    setFileName("")
    if (text) computeHashes(text)
    else setHashes({})
  }

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    setFileName(file.name)
    setInput("")
    const buffer = await file.arrayBuffer()
    computeHashes(buffer)
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setInput("")
    const buffer = await file.arrayBuffer()
    computeHashes(buffer)
  }

  const copyHash = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedField(key)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Input area */}
      <div className="flex-shrink-0 border-b border-border p-4 space-y-2">
        <textarea
          value={input}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Enter text to hash..."
          className="w-full h-24 px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground resize-none font-mono"
        />
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <FileUpIcon className="size-3.5" />
          <span>Drag a file here or</span>
          <label className="text-primary cursor-pointer hover:underline">
            browse
            <input type="file" className="hidden" onChange={handleFileInput} />
          </label>
          {fileName && <span className="font-mono text-foreground">({fileName})</span>}
        </div>
      </div>

      {/* Hash results */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        {Object.keys(hashes).length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Enter text or drop a file to see hashes
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(hashes).map(([algo, hash]) => (
              <div key={algo} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{algo}</span>
                  <Button size="icon-xs" variant="ghost" onClick={() => copyHash(algo, hash)}>
                    {copiedField === algo ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
                  </Button>
                </div>
                <div className="px-3 py-2 rounded-md border border-border bg-muted/10 font-mono text-xs select-all break-all">
                  {hash}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Register in toolRegistry.ts**

Add `HashIcon` to imports. Add to `TOOLS` in Generators:
```typescript
{
  id: "hash",
  label: "Hash Generator",
  description: "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from text or files",
  icon: HashIcon,
  categoryId: "generators",
  path: "/generators/hash",
},
```

- [ ] **Step 3: Add route in router.tsx**

```typescript
const HashGenerator = React.lazy(() =>
  import("@/components/hash/HashGenerator").then((m) => ({
    default: m.HashGenerator,
  })),
)
```

Route: `{ path: "hash", element: lazy_(HashGenerator) }`

- [ ] **Step 4: Verify and commit**

Navigate to `/generators/hash`. Test text hashing (live as-you-type), file drag-and-drop, copy buttons. Commit:
```bash
git add src/components/hash/HashGenerator.tsx src/config/toolRegistry.ts src/router.tsx
git commit -m "feat: add Hash Generator (MD5/SHA-1/SHA-256/SHA-512) for text and files"
```

---

## Task 5: Slug Generator

**Files:**
- Create: `src/components/slug/SlugGenerator.tsx`
- Modify: `src/config/toolRegistry.ts`
- Modify: `src/router.tsx`

- [ ] **Step 1: Create the Slug Generator component**

Create `src/components/slug/SlugGenerator.tsx`:

```tsx
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon } from "lucide-react"

const TRANSLITERATIONS: Record<string, string> = {
  "ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss",
  "ç": "c", "ğ": "g", "ı": "i", "İ": "I", "ş": "s", "ü": "u", "ö": "o",
  "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u",
  "à": "a", "è": "e", "ì": "i", "ò": "o", "ù": "u",
  "â": "a", "ê": "e", "î": "i", "ô": "o", "û": "u",
  "ã": "a", "ñ": "n", "õ": "o",
  "ą": "a", "ć": "c", "ę": "e", "ł": "l", "ń": "n", "ś": "s", "ź": "z", "ż": "z",
  "č": "c", "ď": "d", "ě": "e", "ň": "n", "ř": "r", "š": "s", "ť": "t", "ž": "z",
  "å": "a", "æ": "ae", "ø": "o",
}

type Separator = "-" | "_"

function transliterate(str: string): string {
  return str.split("").map((ch) => TRANSLITERATIONS[ch] || TRANSLITERATIONS[ch.toLowerCase()] || ch).join("")
}

function toSlug(input: string, separator: Separator): string {
  return transliterate(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, "")
    .replace(/[\s-_]+/g, separator)
    .replace(new RegExp(`^${separator === "-" ? "\\-" : "_"}+|${separator === "-" ? "\\-" : "_"}+$`, "g"), "")
}

export function SlugGenerator() {
  const [input, setInput] = useState("")
  const [separator, setSeparator] = useState<Separator>("-")
  const [copied, setCopied] = useState(false)

  const slug = useMemo(() => toSlug(input, separator), [input, separator])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(slug)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-b border-border flex-shrink-0 bg-muted/20">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Separator</span>
          <div className="flex rounded-md border border-border overflow-hidden">
            {(["-", "_"] as Separator[]).map((s) => (
              <button
                key={s}
                onClick={() => setSeparator(s)}
                className={`px-3 py-1 text-xs font-mono font-medium transition-colors ${
                  separator === s
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {s === "-" ? "hyphen (-)" : "underscore (_)"}
              </button>
            ))}
          </div>
        </div>
        {slug && (
          <Button size="sm" variant="outline" onClick={handleCopy}>
            {copied ? <CheckIcon className="size-3.5 mr-1.5" /> : <CopyIcon className="size-3.5 mr-1.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 grid grid-rows-2 divide-y divide-border">
        <div className="p-4">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text to slugify..."
            className="w-full h-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground resize-none"
            style={{ maxHeight: "calc(100% - 24px)" }}
          />
        </div>
        <div className="p-4">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Slug</label>
          <div className="px-3 py-2 rounded-md border border-border bg-muted/10 font-mono text-sm select-all min-h-[40px]">
            {slug || <span className="text-muted-foreground">slug-will-appear-here</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Register in toolRegistry.ts**

Add `LinkIcon` to imports. Add to `TOOLS` in Generators:
```typescript
{
  id: "slug",
  label: "Slug Generator",
  description: "Convert text to URL-friendly slugs with transliteration support",
  icon: LinkIcon,
  categoryId: "generators",
  path: "/generators/slug",
},
```

- [ ] **Step 3: Add route in router.tsx**

```typescript
const SlugGenerator = React.lazy(() =>
  import("@/components/slug/SlugGenerator").then((m) => ({
    default: m.SlugGenerator,
  })),
)
```

Route: `{ path: "slug", element: lazy_(SlugGenerator) }`

- [ ] **Step 4: Verify and commit**

Navigate to `/generators/slug`. Test with Turkish chars ("Türkçe Başlık"), German ("Ärger mit Übungen"), normal text. Verify separator toggle and copy. Commit:
```bash
git add src/components/slug/SlugGenerator.tsx src/config/toolRegistry.ts src/router.tsx
git commit -m "feat: add Slug Generator with non-Latin transliteration"
```

---

## Task 6: Number Base Converter

**Files:**
- Create: `src/components/baseconverter/NumberBaseConverter.tsx`
- Modify: `src/config/toolRegistry.ts`
- Modify: `src/router.tsx`

- [ ] **Step 1: Create the Number Base Converter component**

Create `src/components/baseconverter/NumberBaseConverter.tsx`:

```tsx
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon } from "lucide-react"

type Base = { label: string; radix: number; prefix: string; placeholder: string }

const BASES: Base[] = [
  { label: "Binary", radix: 2, prefix: "0b", placeholder: "10110100" },
  { label: "Octal", radix: 8, prefix: "0o", placeholder: "264" },
  { label: "Decimal", radix: 10, prefix: "", placeholder: "180" },
  { label: "Hexadecimal", radix: 16, prefix: "0x", placeholder: "B4" },
]

function isValidForBase(value: string, radix: number): boolean {
  if (!value) return true
  const chars = "0123456789abcdef".slice(0, radix)
  return value.toLowerCase().split("").every((c) => chars.includes(c))
}

function convertAll(value: string, fromRadix: number): Record<number, string> {
  if (!value) return { 2: "", 8: "", 10: "", 16: "" }
  try {
    const n = BigInt(fromRadix === 10 ? value : `0x${BigInt("0x0").constructor(parseInt(value, fromRadix)).toString(16)}`)
    // Simpler: just parse from base then convert
    const parsed = fromRadix === 10 ? BigInt(value) : BigInt(value.split("").reduce((acc, ch) => {
      const digit = parseInt(ch, fromRadix)
      return acc * BigInt(fromRadix) + BigInt(digit)
    }, 0n))
    return {
      2: parsed.toString(2),
      8: parsed.toString(8),
      10: parsed.toString(10),
      16: parsed.toString(16).toUpperCase(),
    }
  } catch {
    return { 2: "", 8: "", 10: "", 16: "" }
  }
}

export function NumberBaseConverter() {
  const [activeBase, setActiveBase] = useState(10)
  const [inputValue, setInputValue] = useState("")
  const [copiedField, setCopiedField] = useState<number | null>(null)

  const results = useMemo(() => convertAll(inputValue, activeBase), [inputValue, activeBase])

  const handleInputChange = (value: string, radix: number) => {
    const clean = value.replace(/\s/g, "")
    if (isValidForBase(clean, radix)) {
      setActiveBase(radix)
      setInputValue(clean)
    }
  }

  const copyValue = async (radix: number, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedField(radix)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Format binary with spaces every 8 bits
  const formatBinary = (bin: string): string => {
    if (!bin) return ""
    const padded = bin.padStart(Math.ceil(bin.length / 8) * 8, "0")
    return padded.match(/.{1,8}/g)?.join(" ") ?? padded
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border flex-shrink-0 bg-muted/20">
        <span className="text-xs text-muted-foreground">Type in any field to convert between number bases. Supports large numbers via BigInt.</span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
        {BASES.map((base) => {
          const value = activeBase === base.radix ? inputValue : (results[base.radix] ?? "")
          const displayValue = base.radix === 2 && activeBase !== 2 ? formatBinary(value) : value
          return (
            <div key={base.radix} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{base.label}</span>
                  {base.prefix && (
                    <span className="text-[10px] font-mono text-muted-foreground/60">{base.prefix}</span>
                  )}
                </div>
                {value && (
                  <Button size="icon-xs" variant="ghost" onClick={() => copyValue(base.radix, value)}>
                    {copiedField === base.radix ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
                  </Button>
                )}
              </div>
              <input
                value={activeBase === base.radix ? inputValue : displayValue}
                onChange={(e) => handleInputChange(e.target.value, base.radix)}
                placeholder={base.placeholder}
                className="w-full h-9 px-3 text-sm rounded-md border border-border bg-background text-foreground font-mono"
              />
            </div>
          )
        })}

        {/* Bit visualization */}
        {results[2] && (
          <div className="space-y-1.5 pt-2 border-t border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bit Visualization</span>
            <div className="flex flex-wrap gap-0.5">
              {formatBinary(results[2]).split("").map((ch, i) =>
                ch === " " ? (
                  <div key={i} className="w-2" />
                ) : (
                  <div
                    key={i}
                    className={`w-7 h-7 flex items-center justify-center rounded text-xs font-mono font-medium ${
                      ch === "1"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    {ch}
                  </div>
                ),
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Register in toolRegistry.ts**

Add `BinaryIcon` to imports. Add to `TOOLS` in Converters:
```typescript
{
  id: "number-base",
  label: "Number Base",
  description: "Convert between binary, octal, decimal, and hexadecimal with bit visualization",
  icon: BinaryIcon,
  categoryId: "converters",
  path: "/converters/number-base",
},
```

- [ ] **Step 3: Add route in router.tsx**

```typescript
const NumberBaseConverter = React.lazy(() =>
  import("@/components/baseconverter/NumberBaseConverter").then((m) => ({
    default: m.NumberBaseConverter,
  })),
)
```

Route under `converters`: `{ path: "number-base", element: lazy_(NumberBaseConverter) }`

- [ ] **Step 4: Verify and commit**

Navigate to `/converters/number-base`. Test entering in each field, verify live conversion, bit visualization, copy. Commit:
```bash
git add src/components/baseconverter/NumberBaseConverter.tsx src/config/toolRegistry.ts src/router.tsx
git commit -m "feat: add Number Base Converter (bin/oct/dec/hex) with bit visualization"
```

---

## Task 7: Unit Converter

**Files:**
- Create: `src/components/unitconverter/UnitConverter.tsx`
- Modify: `src/config/toolRegistry.ts`
- Modify: `src/router.tsx`

- [ ] **Step 1: Create the Unit Converter component**

Create `src/components/unitconverter/UnitConverter.tsx`:

```tsx
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRightLeftIcon, CopyIcon, CheckIcon } from "lucide-react"

type UnitDef = { id: string; label: string; toBase: (v: number) => number; fromBase: (v: number) => number }
type UnitCategory = { id: string; label: string; units: UnitDef[] }

const linear = (factor: number): Pick<UnitDef, "toBase" | "fromBase"> => ({
  toBase: (v) => v * factor,
  fromBase: (v) => v / factor,
})

const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: "length", label: "Length", units: [
      { id: "m", label: "Meters (m)", ...linear(1) },
      { id: "km", label: "Kilometers (km)", ...linear(1000) },
      { id: "cm", label: "Centimeters (cm)", ...linear(0.01) },
      { id: "mm", label: "Millimeters (mm)", ...linear(0.001) },
      { id: "mi", label: "Miles (mi)", ...linear(1609.344) },
      { id: "yd", label: "Yards (yd)", ...linear(0.9144) },
      { id: "ft", label: "Feet (ft)", ...linear(0.3048) },
      { id: "in", label: "Inches (in)", ...linear(0.0254) },
    ],
  },
  {
    id: "weight", label: "Weight", units: [
      { id: "kg", label: "Kilograms (kg)", ...linear(1) },
      { id: "g", label: "Grams (g)", ...linear(0.001) },
      { id: "mg", label: "Milligrams (mg)", ...linear(0.000001) },
      { id: "lb", label: "Pounds (lb)", ...linear(0.453592) },
      { id: "oz", label: "Ounces (oz)", ...linear(0.0283495) },
      { id: "t", label: "Metric Ton (t)", ...linear(1000) },
    ],
  },
  {
    id: "temperature", label: "Temperature", units: [
      { id: "c", label: "Celsius (°C)", toBase: (v) => v, fromBase: (v) => v },
      { id: "f", label: "Fahrenheit (°F)", toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
      { id: "k", label: "Kelvin (K)", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  {
    id: "data", label: "Data Size", units: [
      { id: "b", label: "Bytes (B)", ...linear(1) },
      { id: "kb", label: "Kilobytes (KB)", ...linear(1024) },
      { id: "mb", label: "Megabytes (MB)", ...linear(1048576) },
      { id: "gb", label: "Gigabytes (GB)", ...linear(1073741824) },
      { id: "tb", label: "Terabytes (TB)", ...linear(1099511627776) },
    ],
  },
  {
    id: "time", label: "Time", units: [
      { id: "ms", label: "Milliseconds (ms)", ...linear(0.001) },
      { id: "s", label: "Seconds (s)", ...linear(1) },
      { id: "min", label: "Minutes (min)", ...linear(60) },
      { id: "h", label: "Hours (h)", ...linear(3600) },
      { id: "d", label: "Days (d)", ...linear(86400) },
      { id: "w", label: "Weeks (w)", ...linear(604800) },
    ],
  },
  {
    id: "speed", label: "Speed", units: [
      { id: "ms", label: "m/s", ...linear(1) },
      { id: "kmh", label: "km/h", ...linear(1 / 3.6) },
      { id: "mph", label: "mph", ...linear(0.44704) },
      { id: "kn", label: "Knots (kn)", ...linear(0.514444) },
    ],
  },
]

function formatResult(n: number): string {
  if (n === 0) return "0"
  if (Math.abs(n) < 0.000001 || Math.abs(n) > 999999999) return n.toExponential(6)
  const str = n.toPrecision(10)
  return parseFloat(str).toString()
}

export function UnitConverter() {
  const [categoryId, setCategoryId] = useState("length")
  const [fromUnit, setFromUnit] = useState("m")
  const [toUnit, setToUnit] = useState("km")
  const [inputValue, setInputValue] = useState("")
  const [copied, setCopied] = useState(false)

  const category = UNIT_CATEGORIES.find((c) => c.id === categoryId)!
  const units = category.units

  const result = useMemo(() => {
    const num = parseFloat(inputValue)
    if (isNaN(num)) return ""
    const from = units.find((u) => u.id === fromUnit)
    const to = units.find((u) => u.id === toUnit)
    if (!from || !to) return ""
    const base = from.toBase(num)
    return formatResult(to.fromBase(base))
  }, [inputValue, fromUnit, toUnit, units])

  const swap = () => {
    setFromUnit(toUnit)
    setToUnit(fromUnit)
  }

  const handleCategoryChange = (id: string) => {
    setCategoryId(id)
    const cat = UNIT_CATEGORIES.find((c) => c.id === id)!
    setFromUnit(cat.units[0].id)
    setToUnit(cat.units[1]?.id ?? cat.units[0].id)
    setInputValue("")
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Category tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border flex-shrink-0 bg-muted/20 overflow-x-auto">
        {UNIT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
              categoryId === cat.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Converter */}
      <div className="flex-1 min-h-0 p-4">
        <div className="flex items-end gap-3 max-w-2xl">
          {/* From */}
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">From</label>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-md border border-border bg-background text-foreground"
            >
              {units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="0"
              className="w-full h-10 px-3 text-base rounded-md border border-border bg-background text-foreground font-mono"
            />
          </div>

          {/* Swap */}
          <Button size="icon" variant="outline" onClick={swap} className="mb-0.5 flex-shrink-0">
            <ArrowRightLeftIcon className="size-4" />
          </Button>

          {/* To */}
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">To</label>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-md border border-border bg-background text-foreground"
            >
              {units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-10 px-3 flex items-center rounded-md border border-border bg-muted/10 font-mono text-base select-all">
                {result || <span className="text-muted-foreground">0</span>}
              </div>
              {result && (
                <Button size="icon" variant="ghost" onClick={handleCopy}>
                  {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Register in toolRegistry.ts**

Add `RulerIcon` to imports. Add to `TOOLS` in Converters:
```typescript
{
  id: "unit-converter",
  label: "Unit Converter",
  description: "Convert between length, weight, temperature, data size, time, and speed units",
  icon: RulerIcon,
  categoryId: "converters",
  path: "/converters/unit-converter",
},
```

- [ ] **Step 3: Add route in router.tsx**

```typescript
const UnitConverter = React.lazy(() =>
  import("@/components/unitconverter/UnitConverter").then((m) => ({
    default: m.UnitConverter,
  })),
)
```

Route: `{ path: "unit-converter", element: lazy_(UnitConverter) }`

- [ ] **Step 4: Verify and commit**

Navigate to `/converters/unit-converter`. Test each category, swap button, copy, edge cases (0, very large numbers, temperature negative). Commit:
```bash
git add src/components/unitconverter/UnitConverter.tsx src/config/toolRegistry.ts src/router.tsx
git commit -m "feat: add Unit Converter (length, weight, temp, data, time, speed)"
```

---

## Task 8: Color Format Converter

**Files:**
- Create: `src/components/colorformat/ColorFormatConverter.tsx`
- Modify: `src/config/toolRegistry.ts`
- Modify: `src/router.tsx`

- [ ] **Step 1: Create the Color Format Converter component**

Create `src/components/colorformat/ColorFormatConverter.tsx`:

```tsx
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon } from "lucide-react"

type RGB = { r: number; g: number; b: number }
type HSL = { h: number; s: number; l: number }
type HSB = { h: number; s: number; b: number }
type CMYK = { c: number; m: number; y: number; k: number }

function hexToRgb(hex: string): RGB | null {
  const match = hex.replace("#", "").match(/^([0-9a-f]{6}|[0-9a-f]{3})$/i)
  if (!match) return null
  let h = match[1]
  if (h.length === 3) h = h.split("").map((c) => c + c).join("")
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }
}

function rgbToHex(rgb: RGB): string {
  return `#${[rgb.r, rgb.g, rgb.b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`
}

function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360, s = hsl.s / 100, l = hsl.l / 100
  if (s === 0) { const v = Math.round(l * 255); return { r: v, g: v, b: v } }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return {
    r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1/3) * 255),
  }
}

function rgbToHsb(rgb: RGB): HSB {
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const d = max - min
  const bri = max
  const s = max === 0 ? 0 : d / max
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), b: Math.round(bri * 100) }
}

function rgbToCmyk(rgb: RGB): CMYK {
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255
  const k = 1 - Math.max(r, g, b)
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 }
  return {
    c: Math.round(((1 - r - k) / (1 - k)) * 100),
    m: Math.round(((1 - g - k) / (1 - k)) * 100),
    y: Math.round(((1 - b - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  }
}

type FormatEntry = { label: string; value: string }

function allFormats(rgb: RGB): FormatEntry[] {
  const hex = rgbToHex(rgb)
  const hsl = rgbToHsl(rgb)
  const hsb = rgbToHsb(rgb)
  const cmyk = rgbToCmyk(rgb)
  return [
    { label: "HEX", value: hex.toUpperCase() },
    { label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
    { label: "HSL", value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
    { label: "HSB", value: `hsb(${hsb.h}, ${hsb.s}%, ${hsb.b}%)` },
    { label: "CMYK", value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)` },
  ]
}

function parseColor(input: string): RGB | null {
  const trimmed = input.trim()
  // HEX
  if (trimmed.startsWith("#") || /^[0-9a-f]{3,6}$/i.test(trimmed)) {
    return hexToRgb(trimmed.startsWith("#") ? trimmed : `#${trimmed}`)
  }
  // rgb(r, g, b)
  const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (rgbMatch) return { r: +rgbMatch[1], g: +rgbMatch[2], b: +rgbMatch[3] }
  // hsl(h, s%, l%)
  const hslMatch = trimmed.match(/^hsla?\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/)
  if (hslMatch) return hslToRgb({ h: +hslMatch[1], s: +hslMatch[2], l: +hslMatch[3] })
  return null
}

export function ColorFormatConverter() {
  const [input, setInput] = useState("#3B82F6")
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const rgb = useMemo(() => parseColor(input), [input])
  const formats = useMemo(() => (rgb ? allFormats(rgb) : []), [rgb])

  const copyValue = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedField(label)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex-shrink-0 border-b border-border p-4 space-y-3">
        <div className="flex items-center gap-3">
          {/* Color swatch */}
          <div
            className="w-12 h-12 rounded-lg border border-border flex-shrink-0"
            style={{ backgroundColor: rgb ? rgbToHex(rgb) : "transparent" }}
          />
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">
              Enter any color format
            </label>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="#3B82F6 or rgb(59,130,246) or hsl(217,91%,60%)"
              className="w-full h-9 px-3 text-sm rounded-md border border-border bg-background text-foreground font-mono"
            />
          </div>
        </div>
        {!rgb && input.trim() && (
          <p className="text-xs text-destructive">Could not parse color. Try HEX (#ff0000), RGB (rgb(255,0,0)), or HSL (hsl(0,100%,50%)).</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        {formats.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Enter a color to see all formats
          </div>
        ) : (
          <div className="space-y-3">
            {formats.map((f) => (
              <div key={f.label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{f.label}</span>
                  <Button size="icon-xs" variant="ghost" onClick={() => copyValue(f.label, f.value)}>
                    {copiedField === f.label ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
                  </Button>
                </div>
                <div className="px-3 py-2 rounded-md border border-border bg-muted/10 font-mono text-sm select-all">
                  {f.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Register in toolRegistry.ts**

Add `SwatchBookIcon` to imports (or reuse `PaletteIcon`). Add to `TOOLS` in Converters:
```typescript
{
  id: "color-format",
  label: "Color Format",
  description: "Convert colors between HEX, RGB, HSL, HSB, and CMYK with live preview",
  icon: PaletteIcon,
  categoryId: "converters",
  path: "/converters/color-format",
},
```

- [ ] **Step 3: Add route in router.tsx**

```typescript
const ColorFormatConverter = React.lazy(() =>
  import("@/components/colorformat/ColorFormatConverter").then((m) => ({
    default: m.ColorFormatConverter,
  })),
)
```

Route: `{ path: "color-format", element: lazy_(ColorFormatConverter) }`

- [ ] **Step 4: Verify and commit**

Navigate to `/converters/color-format`. Test HEX, RGB, HSL input, verify swatch updates live, copy each format. Commit:
```bash
git add src/components/colorformat/ColorFormatConverter.tsx src/config/toolRegistry.ts src/router.tsx
git commit -m "feat: add Color Format Converter (HEX/RGB/HSL/HSB/CMYK)"
```

---

## Task 9: Password Generator (+ Security Category)

**Files:**
- Create: `src/components/password/PasswordGenerator.tsx`
- Modify: `src/config/toolRegistry.ts` (add Security category + tool)
- Modify: `src/router.tsx` (add security route group)

- [ ] **Step 1: Create the Password Generator component**

Create `src/components/password/PasswordGenerator.tsx`:

```tsx
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon, RefreshCwIcon, TrashIcon } from "lucide-react"

const CHAR_SETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
}

const AMBIGUOUS = "0Oo1lI"

const WORD_LIST = [
  "correct", "horse", "battery", "staple", "apple", "banana", "cherry", "dragon",
  "eagle", "falcon", "garden", "harbor", "island", "jungle", "kitten", "lemon",
  "mango", "nature", "ocean", "planet", "quartz", "river", "sunset", "temple",
  "umbrella", "valley", "window", "yellow", "zenith", "bridge", "castle", "desert",
  "forest", "glacier", "hollow", "ivory", "jewel", "kingdom", "lantern", "meadow",
  "nebula", "orchid", "palace", "quarter", "rainbow", "silver", "thunder", "velvet",
  "winter", "crystal", "diamond", "emerald", "fortune", "golden", "horizon",
]

function generatePassword(
  length: number,
  options: { lowercase: boolean; uppercase: boolean; numbers: boolean; symbols: boolean; excludeAmbiguous: boolean },
): string {
  let chars = ""
  if (options.lowercase) chars += CHAR_SETS.lowercase
  if (options.uppercase) chars += CHAR_SETS.uppercase
  if (options.numbers) chars += CHAR_SETS.numbers
  if (options.symbols) chars += CHAR_SETS.symbols
  if (!chars) chars = CHAR_SETS.lowercase
  if (options.excludeAmbiguous) chars = chars.split("").filter((c) => !AMBIGUOUS.includes(c)).join("")
  const array = new Uint32Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (n) => chars[n % chars.length]).join("")
}

function generatePassphrase(wordCount: number, separator: string): string {
  const array = new Uint32Array(wordCount)
  crypto.getRandomValues(array)
  return Array.from(array, (n) => WORD_LIST[n % WORD_LIST.length]).join(separator)
}

function calculateStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1
  if (password.length >= 20) score += 1

  if (score <= 2) return { score, label: "Weak", color: "bg-destructive" }
  if (score <= 4) return { score, label: "Moderate", color: "bg-yellow-500" }
  if (score <= 5) return { score, label: "Strong", color: "bg-green-500" }
  return { score, label: "Very Strong", color: "bg-green-600" }
}

type Mode = "password" | "passphrase"

export function PasswordGenerator() {
  const [mode, setMode] = useState<Mode>("password")
  const [length, setLength] = useState(16)
  const [wordCount, setWordCount] = useState(4)
  const [separator, setSeparator] = useState("-")
  const [options, setOptions] = useState({
    lowercase: true, uppercase: true, numbers: true, symbols: true, excludeAmbiguous: false,
  })
  const [passwords, setPasswords] = useState<string[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const generate = useCallback(() => {
    const count = 1
    const results = Array.from({ length: count }, () =>
      mode === "password"
        ? generatePassword(length, options)
        : generatePassphrase(wordCount, separator),
    )
    setPasswords(results)
    setCopiedIndex(null)
  }, [mode, length, wordCount, separator, options])

  const bulkGenerate = useCallback(() => {
    const results = Array.from({ length: 10 }, () =>
      mode === "password"
        ? generatePassword(length, options)
        : generatePassphrase(wordCount, separator),
    )
    setPasswords(results)
    setCopiedIndex(null)
  }, [mode, length, wordCount, separator, options])

  const copyOne = async (pw: string, index: number) => {
    await navigator.clipboard.writeText(pw)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const toggleOption = (key: keyof typeof options) =>
    setOptions((o) => ({ ...o, [key]: !o[key] }))

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-b border-border flex-shrink-0 bg-muted/20">
        {/* Mode */}
        <div className="flex rounded-md border border-border overflow-hidden">
          {(["password", "passphrase"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 text-xs font-medium capitalize transition-colors ${
                mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {mode === "password" ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Length</span>
              <input
                type="range" min={4} max={128} value={length}
                onChange={(e) => setLength(+e.target.value)}
                className="w-24"
              />
              <span className="text-xs font-mono w-8 text-center">{length}</span>
            </div>
            {(Object.keys(CHAR_SETS) as (keyof typeof CHAR_SETS)[]).map((key) => (
              <label key={key} className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer capitalize">
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={() => toggleOption(key)}
                  className="rounded"
                />
                {key}
              </label>
            ))}
            <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={options.excludeAmbiguous}
                onChange={() => toggleOption("excludeAmbiguous")}
                className="rounded"
              />
              Exclude 0Oo1lI
            </label>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Words</span>
              <input
                type="number" min={3} max={10} value={wordCount}
                onChange={(e) => setWordCount(Math.min(10, Math.max(3, +e.target.value)))}
                className="w-14 h-7 px-2 text-xs rounded-md border border-border bg-background"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Separator</span>
              <input
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
                className="w-10 h-7 px-2 text-xs text-center rounded-md border border-border bg-background font-mono"
                maxLength={2}
              />
            </div>
          </>
        )}

        <Button size="sm" onClick={generate}>
          <RefreshCwIcon className="size-3.5 mr-1.5" /> Generate
        </Button>
        <Button size="sm" variant="outline" onClick={bulkGenerate}>
          Bulk (10)
        </Button>
        {passwords.length > 0 && (
          <Button size="sm" variant="ghost" onClick={() => setPasswords([])}>
            <TrashIcon className="size-3.5 mr-1.5" /> Clear
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        {passwords.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Click Generate to create passwords
          </div>
        ) : (
          <div className="space-y-2">
            {passwords.map((pw, i) => {
              const strength = calculateStrength(pw)
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/10 font-mono text-sm group">
                    <span className="flex-1 select-all break-all">{pw}</span>
                    <Button size="icon-xs" variant="ghost" onClick={() => copyOne(pw, i)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {copiedIndex === i ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
                    </Button>
                  </div>
                  {/* Strength meter */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${strength.color}`}
                        style={{ width: `${(strength.score / 7) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{strength.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add Security category and tool to toolRegistry.ts**

Update `CategoryId` type to include `"security"`.

Add to `CATEGORIES` array:
```typescript
{ id: "security", label: "Security", path: "/security", icon: ShieldIcon },
```

Add `ShieldIcon` and `LockIcon` to lucide-react imports.

Add to `TOOLS` array:
```typescript
{
  id: "password-generator",
  label: "Password Generator",
  description: "Generate secure passwords and passphrases with strength analysis",
  icon: LockIcon,
  categoryId: "security",
  path: "/security/password-generator",
},
```

- [ ] **Step 3: Add security route group in router.tsx**

Add lazy import:
```typescript
const PasswordGenerator = React.lazy(() =>
  import("@/components/password/PasswordGenerator").then((m) => ({
    default: m.PasswordGenerator,
  })),
)
```

Add route group (after `fun`, before the catch-all):
```typescript
{
  path: "security",
  element: <CategoryLayout />,
  errorElement: <RouteErrorBoundary />,
  children: [
    { index: true, element: <CategoryLandingPage /> },
    { path: "password-generator", element: lazy_(PasswordGenerator) },
  ],
},
```

- [ ] **Step 4: Verify and commit**

Navigate to `/security/password-generator`. Test:
- Password mode with various options
- Passphrase mode
- Bulk generate
- Strength meter accuracy
- Copy buttons

Verify Security shows in sidebar.

```bash
git add src/components/password/PasswordGenerator.tsx src/config/toolRegistry.ts src/router.tsx
git commit -m "feat: add Password Generator and Security category"
```

---

## Task 10: Chmod Calculator

**Files:**
- Create: `src/components/chmod/ChmodCalculator.tsx`
- Modify: `src/config/toolRegistry.ts`
- Modify: `src/router.tsx`

- [ ] **Step 1: Create the Chmod Calculator component**

Create `src/components/chmod/ChmodCalculator.tsx`:

```tsx
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon } from "lucide-react"

const ROLES = ["Owner", "Group", "Other"] as const
const PERMS = ["Read", "Write", "Execute"] as const
const PERM_CHARS = { Read: "r", Write: "w", Execute: "x" } as const
const PERM_VALUES = { Read: 4, Write: 2, Execute: 1 } as const

type Permissions = boolean[][]

const PRESETS = [
  { label: "644", desc: "Owner rw, Group r, Other r", perms: [[true,true,false],[true,false,false],[true,false,false]] },
  { label: "755", desc: "Owner rwx, Group rx, Other rx", perms: [[true,true,true],[true,false,true],[true,false,true]] },
  { label: "700", desc: "Owner rwx only", perms: [[true,true,true],[false,false,false],[false,false,false]] },
  { label: "777", desc: "All permissions", perms: [[true,true,true],[true,true,true],[true,true,true]] },
  { label: "600", desc: "Owner rw only", perms: [[true,true,false],[false,false,false],[false,false,false]] },
  { label: "750", desc: "Owner rwx, Group rx", perms: [[true,true,true],[true,false,true],[false,false,false]] },
  { label: "444", desc: "Read-only all", perms: [[true,false,false],[true,false,false],[true,false,false]] },
]

function toNumeric(perms: Permissions): string {
  return perms.map((role) =>
    role.reduce((sum, on, i) => sum + (on ? [4, 2, 1][i] : 0), 0),
  ).join("")
}

function toSymbolic(perms: Permissions): string {
  return perms.map((role) =>
    role.map((on, i) => (on ? ["r", "w", "x"][i] : "-")).join(""),
  ).join("")
}

export function ChmodCalculator() {
  const [perms, setPerms] = useState<Permissions>([
    [true, true, true],
    [true, false, true],
    [true, false, true],
  ])
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const numeric = useMemo(() => toNumeric(perms), [perms])
  const symbolic = useMemo(() => toSymbolic(perms), [perms])

  const toggle = (role: number, perm: number) => {
    setPerms((p) => p.map((r, ri) =>
      ri === role ? r.map((v, pi) => (pi === perm ? !v : v)) : r,
    ))
  }

  const applyPreset = (preset: boolean[][]) => setPerms(preset.map((r) => [...r]))

  const copyValue = async (field: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border flex-shrink-0 bg-muted/20">
        <span className="text-xs text-muted-foreground">Toggle permissions below or pick a preset</span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-6">
        {/* Permission grid */}
        <div>
          <table className="w-full max-w-md">
            <thead>
              <tr>
                <th className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-left pb-2 pr-4" />
                {PERMS.map((p) => (
                  <th key={p} className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center pb-2 px-4">{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLES.map((role, ri) => (
                <tr key={role}>
                  <td className="text-sm font-medium py-2 pr-4">{role}</td>
                  {PERMS.map((_, pi) => (
                    <td key={pi} className="text-center py-2 px-4">
                      <button
                        onClick={() => toggle(ri, pi)}
                        className={`w-8 h-8 rounded-md border text-xs font-mono font-bold transition-colors ${
                          perms[ri][pi]
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/20 text-muted-foreground border-border hover:bg-muted/40"
                        }`}
                      >
                        {perms[ri][pi] ? ["r", "w", "x"][pi] : "-"}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Results */}
        <div className="space-y-3 max-w-md">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Numeric</span>
              <Button size="icon-xs" variant="ghost" onClick={() => copyValue("numeric", numeric)}>
                {copiedField === "numeric" ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
              </Button>
            </div>
            <div className="px-3 py-2 rounded-md border border-border bg-muted/10 font-mono text-lg select-all">
              {numeric}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Symbolic</span>
              <Button size="icon-xs" variant="ghost" onClick={() => copyValue("symbolic", symbolic)}>
                {copiedField === "symbolic" ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
              </Button>
            </div>
            <div className="px-3 py-2 rounded-md border border-border bg-muted/10 font-mono text-lg select-all">
              {symbolic}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Command</span>
              <Button size="icon-xs" variant="ghost" onClick={() => copyValue("cmd", `chmod ${numeric}`)}>
                {copiedField === "cmd" ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
              </Button>
            </div>
            <div className="px-3 py-2 rounded-md border border-border bg-muted/10 font-mono text-sm select-all">
              chmod {numeric} <span className="text-muted-foreground">filename</span>
            </div>
          </div>
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Common Presets</span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset.perms)}
                className={`px-3 py-1.5 rounded-md border text-xs font-mono transition-colors ${
                  numeric === preset.label
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className="font-bold">{preset.label}</span>
                <span className="ml-1.5 font-sans text-muted-foreground">{preset.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Register in toolRegistry.ts**

Add `TerminalIcon` to imports. Add to `TOOLS` in Dev Tools:
```typescript
{
  id: "chmod",
  label: "Chmod Calculator",
  description: "Calculate Unix file permissions with numeric and symbolic notation",
  icon: TerminalIcon,
  categoryId: "dev-tools",
  path: "/dev-tools/chmod",
},
```

- [ ] **Step 3: Add route in router.tsx**

```typescript
const ChmodCalculator = React.lazy(() =>
  import("@/components/chmod/ChmodCalculator").then((m) => ({
    default: m.ChmodCalculator,
  })),
)
```

Route under `dev-tools`: `{ path: "chmod", element: lazy_(ChmodCalculator) }`

- [ ] **Step 4: Verify and commit**

Navigate to `/dev-tools/chmod`. Test toggling permissions, presets, copy buttons. Commit:
```bash
git add src/components/chmod/ChmodCalculator.tsx src/config/toolRegistry.ts src/router.tsx
git commit -m "feat: add Chmod Calculator with presets and symbolic/numeric output"
```

---

## Final Verification

- [ ] **Step 1: Full build check**

```bash
npm run build
```

Ensure zero errors.

- [ ] **Step 2: Navigation check**

Start dev server and verify all 10 new tools appear in sidebar under correct categories:
- Generators: UUID, Lorem Ipsum, Fake Data, Hash, Slug (5 new)
- Converters: Number Base, Unit Converter, Color Format (3 new)
- Security: Password Generator (new category, 1 tool)
- Dev Tools: Chmod Calculator (1 new)
