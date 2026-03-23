import { useState, useMemo, useCallback } from "react"
import { CopyIcon, CheckIcon, InfoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── Types & Constants ──────────────────────────────────────────────────────

type OperationId =
  | "commit"
  | "branch"
  | "checkout"
  | "merge"
  | "rebase"
  | "reset"
  | "stash"
  | "cherry-pick"
  | "log"
  | "diff"

type FlagType = "toggle" | "text" | "select"

type FlagDef = {
  id: string
  label: string
  type: FlagType
  flag: string
  placeholder?: string
  options?: { label: string; value: string }[]
  excludes?: string[]
}

type OperationDef = {
  id: OperationId
  label: string
  flags: FlagDef[]
}

type FlagState = Record<string, string | boolean>

type Recipe = {
  label: string
  command: string
  operationId: OperationId
  state: FlagState
}

const OPERATIONS: OperationDef[] = [
  {
    id: "commit",
    label: "commit",
    flags: [
      { id: "message", label: "Message (-m)", type: "text", flag: "-m", placeholder: "Commit message" },
      { id: "amend", label: "Amend (--amend)", type: "toggle", flag: "--amend" },
      { id: "no-verify", label: "No verify (--no-verify)", type: "toggle", flag: "--no-verify" },
      { id: "allow-empty", label: "Allow empty (--allow-empty)", type: "toggle", flag: "--allow-empty" },
      { id: "sign", label: "Sign (-S)", type: "toggle", flag: "-S" },
    ],
  },
  {
    id: "branch",
    label: "branch",
    flags: [
      { id: "name", label: "Branch name", type: "text", flag: "", placeholder: "branch-name" },
      {
        id: "delete",
        label: "Delete",
        type: "select",
        flag: "",
        options: [
          { label: "None", value: "" },
          { label: "Safe delete (-d)", value: "-d" },
          { label: "Force delete (-D)", value: "-D" },
        ],
        excludes: ["list", "rename"],
      },
      { id: "list", label: "List (-l)", type: "toggle", flag: "-l", excludes: ["delete", "rename"] },
      { id: "rename", label: "Rename (-m)", type: "text", flag: "-m", placeholder: "new-name", excludes: ["delete", "list"] },
      { id: "remote", label: "Remote (-r)", type: "toggle", flag: "-r" },
    ],
  },
  {
    id: "checkout",
    label: "checkout",
    flags: [
      { id: "target", label: "Branch / file", type: "text", flag: "", placeholder: "branch or file path" },
      { id: "new-branch", label: "Create new (-b)", type: "toggle", flag: "-b" },
      { id: "force", label: "Force (-f)", type: "toggle", flag: "-f" },
    ],
  },
  {
    id: "merge",
    label: "merge",
    flags: [
      { id: "branch", label: "Branch", type: "text", flag: "", placeholder: "branch-name" },
      { id: "no-ff", label: "No fast-forward (--no-ff)", type: "toggle", flag: "--no-ff" },
      { id: "squash", label: "Squash (--squash)", type: "toggle", flag: "--squash" },
      { id: "abort", label: "Abort (--abort)", type: "toggle", flag: "--abort", excludes: ["branch", "no-ff", "squash"] },
    ],
  },
  {
    id: "rebase",
    label: "rebase",
    flags: [
      { id: "branch", label: "Branch", type: "text", flag: "", placeholder: "branch-name", excludes: ["abort", "continue"] },
      { id: "interactive", label: "Interactive (-i)", type: "toggle", flag: "-i", excludes: ["abort", "continue"] },
      { id: "onto", label: "Onto (--onto)", type: "text", flag: "--onto", placeholder: "target-branch", excludes: ["abort", "continue"] },
      { id: "abort", label: "Abort (--abort)", type: "toggle", flag: "--abort", excludes: ["branch", "interactive", "onto", "continue"] },
      { id: "continue", label: "Continue (--continue)", type: "toggle", flag: "--continue", excludes: ["branch", "interactive", "onto", "abort"] },
    ],
  },
  {
    id: "reset",
    label: "reset",
    flags: [
      { id: "ref", label: "Ref", type: "text", flag: "", placeholder: "HEAD~1 or commit hash" },
      {
        id: "mode",
        label: "Mode",
        type: "select",
        flag: "",
        options: [
          { label: "Mixed (--mixed)", value: "--mixed" },
          { label: "Soft (--soft)", value: "--soft" },
          { label: "Hard (--hard)", value: "--hard" },
        ],
      },
    ],
  },
  {
    id: "stash",
    label: "stash",
    flags: [
      {
        id: "action",
        label: "Action",
        type: "select",
        flag: "",
        options: [
          { label: "push", value: "push" },
          { label: "pop", value: "pop" },
          { label: "list", value: "list" },
          { label: "apply", value: "apply" },
          { label: "drop", value: "drop" },
        ],
      },
      { id: "message", label: "Message (-m)", type: "text", flag: "-m", placeholder: "stash message" },
    ],
  },
  {
    id: "cherry-pick",
    label: "cherry-pick",
    flags: [
      { id: "commit", label: "Commit hash", type: "text", flag: "", placeholder: "abc1234" },
      { id: "no-commit", label: "No commit (-n)", type: "toggle", flag: "-n" },
      { id: "edit", label: "Edit (-e)", type: "toggle", flag: "-e" },
    ],
  },
  {
    id: "log",
    label: "log",
    flags: [
      { id: "oneline", label: "One line (--oneline)", type: "toggle", flag: "--oneline" },
      { id: "graph", label: "Graph (--graph)", type: "toggle", flag: "--graph" },
      { id: "count", label: "Count (-n)", type: "text", flag: "-n", placeholder: "10" },
      { id: "author", label: "Author (--author)", type: "text", flag: "--author", placeholder: "name or email" },
      { id: "since", label: "Since (--since)", type: "text", flag: "--since", placeholder: "2024-01-01" },
      { id: "file", label: "File path", type: "text", flag: "--", placeholder: "path/to/file" },
    ],
  },
  {
    id: "diff",
    label: "diff",
    flags: [
      { id: "staged", label: "Staged (--staged)", type: "toggle", flag: "--staged" },
      { id: "stat", label: "Stat (--stat)", type: "toggle", flag: "--stat" },
      { id: "name-only", label: "Name only (--name-only)", type: "toggle", flag: "--name-only" },
      { id: "file", label: "File path", type: "text", flag: "--", placeholder: "path/to/file" },
    ],
  },
]

const RECIPES: Recipe[] = [
  {
    label: "Undo last commit (keep changes)",
    command: "git reset --soft HEAD~1",
    operationId: "reset",
    state: { ref: "HEAD~1", mode: "--soft" },
  },
  {
    label: "Squash last N commits",
    command: "git rebase -i HEAD~N",
    operationId: "rebase",
    state: { branch: "HEAD~N", interactive: true },
  },
  {
    label: "Delete remote branch",
    command: "git push origin --delete branch-name",
    operationId: "branch",
    state: {},
  },
  {
    label: "Stash with message",
    command: 'git stash push -m "message"',
    operationId: "stash",
    state: { action: "push", message: "message" },
  },
  {
    label: "Find commit by message",
    command: 'git log --all --grep="text"',
    operationId: "log",
    state: {},
  },
  {
    label: "Show file at commit",
    command: "git show commit:path/to/file",
    operationId: "log",
    state: {},
  },
]

const OPERATION_MAP = new Map(OPERATIONS.map((op) => [op.id, op]))

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildCommand(opId: OperationId, flags: FlagState): string {
  const op = OPERATION_MAP.get(opId)
  if (!op) return `git ${opId}`

  const parts: string[] = ["git", opId]

  if (opId === "stash") {
    const action = (flags.action as string) || "push"
    parts.push(action)
    if (action === "push" && flags.message && typeof flags.message === "string" && flags.message.trim()) {
      parts.push("-m", `"${flags.message.trim()}"`)
    }
    return parts.join(" ")
  }

  if (opId === "branch") {
    const del = flags.delete as string
    if (flags.list) {
      parts.push("-l")
      if (flags.remote) parts.push("-r")
      return parts.join(" ")
    }
    if (flags.rename && typeof flags.rename === "string" && flags.rename.trim()) {
      parts.push("-m")
      if (flags.name && typeof flags.name === "string" && flags.name.trim()) {
        parts.push(flags.name.trim())
      }
      parts.push(flags.rename.trim())
      return parts.join(" ")
    }
    if (del) {
      parts.push(del)
      if (flags.remote) parts.push("-r")
    } else if (flags.remote) {
      parts.push("-r")
    }
    if (flags.name && typeof flags.name === "string" && flags.name.trim()) {
      parts.push(flags.name.trim())
    }
    return parts.join(" ")
  }

  if (opId === "reset") {
    const mode = (flags.mode as string) || "--mixed"
    parts.push(mode)
    if (flags.ref && typeof flags.ref === "string" && flags.ref.trim()) {
      parts.push(flags.ref.trim())
    }
    return parts.join(" ")
  }

  // Generic assembly for other operations
  const positionalParts: string[] = []
  const fileParts: string[] = []

  for (const flagDef of op.flags) {
    const val = flags[flagDef.id]
    if (!val) continue

    if (flagDef.flag === "--") {
      if (typeof val === "string" && val.trim()) {
        fileParts.push(val.trim())
      }
      continue
    }

    if (flagDef.flag === "") {
      // positional argument
      if (typeof val === "string" && val.trim()) {
        positionalParts.push(val.trim())
      }
      continue
    }

    if (flagDef.type === "toggle" && val === true) {
      parts.push(flagDef.flag)
    } else if (flagDef.type === "text" && typeof val === "string" && val.trim()) {
      if (flagDef.id === "message" && opId === "commit") {
        parts.push(flagDef.flag, `"${val.trim()}"`)
      } else {
        parts.push(flagDef.flag, val.trim())
      }
    } else if (flagDef.type === "select" && typeof val === "string" && val) {
      parts.push(val)
    }
  }

  parts.push(...positionalParts)
  if (fileParts.length > 0) {
    parts.push("--", ...fileParts)
  }

  return parts.join(" ")
}

function getDefaultState(opId: OperationId): FlagState {
  const op = OPERATION_MAP.get(opId)
  if (!op) return {}
  const state: FlagState = {}
  for (const flag of op.flags) {
    if (flag.type === "select" && flag.options?.[0]) {
      state[flag.id] = flag.options[0].value
    }
  }
  return state
}

// ─── Component ──────────────────────────────────────────────────────────────

export function GitCommandBuilder() {
  const [selectedOp, setSelectedOp] = useState<OperationId>("commit")
  const [flagState, setFlagState] = useState<FlagState>(() => getDefaultState("commit"))
  const [copied, setCopied] = useState(false)

  const operation = OPERATION_MAP.get(selectedOp)!

  const command = useMemo(() => buildCommand(selectedOp, flagState), [selectedOp, flagState])

  const switchOperation = useCallback((opId: OperationId) => {
    setSelectedOp(opId)
    setFlagState(getDefaultState(opId))
  }, [])

  const setFlag = useCallback((id: string, value: string | boolean) => {
    setFlagState((prev) => ({ ...prev, [id]: value }))
  }, [])

  const applyRecipe = useCallback((recipe: Recipe) => {
    setSelectedOp(recipe.operationId)
    const base = getDefaultState(recipe.operationId)
    setFlagState({ ...base, ...recipe.state })
  }, [])

  const copyCommand = useCallback(() => {
    navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [command])

  // Determine which flags are disabled due to exclusion rules
  const disabledFlags = useMemo(() => {
    const disabled = new Set<string>()
    for (const flag of operation.flags) {
      if (!flag.excludes) continue
      const val = flagState[flag.id]
      const isActive =
        (flag.type === "toggle" && val === true) ||
        (flag.type === "text" && typeof val === "string" && val.trim() !== "") ||
        (flag.type === "select" && typeof val === "string" && val !== "" && val !== flag.options?.[0]?.value)
      if (isActive) {
        for (const excludedId of flag.excludes) {
          disabled.add(excludedId)
        }
      }
    }
    return disabled
  }, [operation.flags, flagState])

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* ── Info bar ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
        <InfoIcon className="h-4 w-4 shrink-0" />
        Select a git operation and configure flags to build your command
      </div>

      {/* ── Operation selector ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        {OPERATIONS.map((op) => (
          <button
            key={op.id}
            onClick={() => switchOperation(op.id)}
            className={cn(
              "rounded-md border px-3 py-1.5 font-mono text-sm font-medium transition-colors",
              selectedOp === op.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted text-muted-foreground hover:border-muted-foreground hover:text-foreground",
            )}
          >
            {op.label}
          </button>
        ))}
      </div>

      {/* ── Flags form ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/10 p-4">
        {operation.flags.map((flag) => {
          const isDisabled = disabledFlags.has(flag.id)
          return (
            <FlagField
              key={`${selectedOp}-${flag.id}`}
              flag={flag}
              value={flagState[flag.id]}
              disabled={isDisabled}
              onChange={(val) => setFlag(flag.id, val)}
            />
          )
        })}
      </div>

      {/* ── Command preview ────────────────────────────────────────── */}
      <div className="flex items-center gap-3 rounded-md border border-border bg-muted/20 px-4 py-3">
        <code className="flex-1 font-mono text-sm text-foreground break-all">{command}</code>
        <Button variant="ghost" size="sm" onClick={copyCommand} className="h-8 shrink-0 gap-1.5">
          {copied ? (
            <>
              <CheckIcon className="h-3.5 w-3.5 text-green-400" />
              <span className="text-xs text-green-400">Copied</span>
            </>
          ) : (
            <>
              <CopyIcon className="h-3.5 w-3.5" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </Button>
      </div>

      {/* ── Common recipes ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Common Recipes
        </span>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {RECIPES.map((recipe) => (
            <button
              key={recipe.label}
              onClick={() => applyRecipe(recipe)}
              className="flex flex-col gap-1 rounded-md border border-border bg-muted/20 px-3 py-2 text-left transition-colors hover:border-muted-foreground hover:bg-muted/40"
            >
              <span className="text-sm font-medium text-foreground">{recipe.label}</span>
              <code className="font-mono text-xs text-muted-foreground">{recipe.command}</code>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Flag Field ─────────────────────────────────────────────────────────────

function FlagField({
  flag,
  value,
  disabled,
  onChange,
}: {
  flag: FlagDef
  value: string | boolean | undefined
  disabled: boolean
  onChange: (val: string | boolean) => void
}) {
  if (flag.type === "toggle") {
    return (
      <label
        className={cn(
          "flex items-center gap-2.5 cursor-pointer select-none",
          disabled && "opacity-40 pointer-events-none",
        )}
      >
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-primary"
        />
        <span className="text-sm text-foreground">{flag.label}</span>
      </label>
    )
  }

  if (flag.type === "select") {
    return (
      <div
        className={cn(
          "flex flex-col gap-1.5",
          disabled && "opacity-40 pointer-events-none",
        )}
      >
        <span className="text-sm font-medium text-foreground">{flag.label}</span>
        <div className="flex flex-wrap gap-1.5">
          {flag.options?.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                value === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted text-muted-foreground hover:border-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // text input
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        disabled && "opacity-40 pointer-events-none",
      )}
    >
      <span className="text-sm font-medium text-foreground">{flag.label}</span>
      <input
        type="text"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={flag.placeholder}
        className="h-9 rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  )
}
