import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon, AlertCircleIcon } from "lucide-react"
import cronstrue from "cronstrue"
import { CronExpressionParser } from "cron-parser"

const PRESETS: { label: string; value: string }[] = [
  { label: "Every minute", value: "* * * * *" },
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every 15 minutes", value: "*/15 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every day at midnight", value: "0 0 * * *" },
  { label: "Every day at noon", value: "0 12 * * *" },
  { label: "Every Monday at 9 AM", value: "0 9 * * 1" },
  { label: "Weekdays at 9 AM", value: "0 9 * * 1-5" },
  { label: "First of month at midnight", value: "0 0 1 * *" },
  { label: "Every Sunday at 3 AM", value: "0 3 * * 0" },
]

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function CronBuilder() {
  const [expression, setExpression] = useState("*/15 * * * *")
  const [copied, setCopied] = useState(false)

  const fields = useMemo(() => {
    const parts = expression.trim().split(/\s+/)
    return {
      minute: parts[0] ?? "*",
      hour: parts[1] ?? "*",
      dayOfMonth: parts[2] ?? "*",
      month: parts[3] ?? "*",
      dayOfWeek: parts[4] ?? "*",
    }
  }, [expression])

  const setField = useCallback(
    (index: number, value: string) => {
      const parts = expression.trim().split(/\s+/)
      while (parts.length < 5) parts.push("*")
      parts[index] = value
      setExpression(parts.join(" "))
    },
    [expression],
  )

  const { description, error } = useMemo(() => {
    try {
      const desc = cronstrue.toString(expression, { use24HourTimeFormat: true })
      return { description: desc, error: null }
    } catch {
      return { description: null, error: "Invalid cron expression" }
    }
  }, [expression])

  const nextRuns = useMemo(() => {
    try {
      const interval = CronExpressionParser.parse(expression)
      const runs: string[] = []
      for (let i = 0; i < 5; i++) {
        const next = interval.next()
        runs.push(next.toDate().toLocaleString())
      }
      return runs
    } catch {
      return []
    }
  }, [expression])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(expression)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-y-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Cron Builder
        </span>
        <div className="flex items-center gap-1">
          <select
            onChange={(e) => {
              if (e.target.value) setExpression(e.target.value)
              e.target.value = ""
            }}
            defaultValue=""
            className="h-6 text-xs bg-transparent border border-border rounded px-1.5 text-foreground outline-none"
          >
            <option value="" disabled>
              Presets…
            </option>
            {PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <div className="w-px h-4 bg-border mx-0.5" />
          <Button variant="ghost" size="xs" onClick={handleCopy} title="Copy expression">
            {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto w-full">
        {/* Expression input */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            Expression
          </label>
          <input
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            className="w-full h-10 text-lg font-mono bg-transparent border border-border rounded-md px-3 text-foreground outline-none text-center tracking-widest"
            placeholder="* * * * *"
            spellCheck={false}
          />
        </div>

        {/* Visual builder */}
        <div className="grid grid-cols-5 gap-3">
          <FieldEditor label="Minute" hint="0-59" value={fields.minute} onChange={(v) => setField(0, v)} />
          <FieldEditor label="Hour" hint="0-23" value={fields.hour} onChange={(v) => setField(1, v)} />
          <FieldEditor label="Day" hint="1-31" value={fields.dayOfMonth} onChange={(v) => setField(2, v)} />
          <FieldEditor
            label="Month"
            hint="1-12"
            value={fields.month}
            onChange={(v) => setField(3, v)}
            options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
          />
          <FieldEditor
            label="Weekday"
            hint="0-6"
            value={fields.dayOfWeek}
            onChange={(v) => setField(4, v)}
            options={WEEKDAYS.map((d, i) => ({ value: String(i), label: d }))}
          />
        </div>

        {/* Description */}
        <div className="rounded-md border border-border p-3">
          {error ? (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircleIcon className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          ) : (
            <p className="text-sm text-foreground">{description}</p>
          )}
        </div>

        {/* Next runs */}
        {nextRuns.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Next 5 runs
            </h3>
            <ul className="space-y-1">
              {nextRuns.map((run, i) => (
                <li key={i} className="text-sm text-muted-foreground font-mono">
                  {run}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function FieldEditor({
  label,
  hint,
  value,
  onChange,
  options,
}: {
  label: string
  hint: string
  value: string
  onChange: (v: string) => void
  options?: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm font-mono bg-transparent border border-border rounded px-2 text-foreground outline-none text-center"
        placeholder="*"
        spellCheck={false}
      />
      {options && (
        <select
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value)
          }}
          defaultValue=""
          className="h-6 text-[10px] bg-transparent border border-border rounded px-1 text-muted-foreground outline-none"
        >
          <option value="">{hint}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
      {!options && (
        <span className="text-[10px] text-muted-foreground text-center">{hint}</span>
      )}
    </div>
  )
}
