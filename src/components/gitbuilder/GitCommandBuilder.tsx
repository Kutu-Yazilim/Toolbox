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
  description?: string
  type: FlagType
  flag: string
  placeholder?: string
  options?: { label: string; value: string; description?: string }[]
  excludes?: string[]
}

type OperationDef = {
  id: OperationId
  label: string
  description: string
  flags: FlagDef[]
}

type FlagState = Record<string, string | boolean>

type Recipe = {
  label: string
  description: string
  command: string
  operationId: OperationId
  state: FlagState
}

const OPERATIONS: OperationDef[] = [
  {
    id: "commit",
    label: "commit",
    description: "Record changes to the repository. Creates a new commit with staged changes and a descriptive message.",
    flags: [
      { id: "message", label: "Message (-m)", description: "The commit message describing what changed and why", type: "text", flag: "-m", placeholder: "Commit message" },
      { id: "amend", label: "Amend (--amend)", description: "Replace the last commit with a new one, combining staged changes with the previous commit", type: "toggle", flag: "--amend" },
      { id: "no-verify", label: "No verify (--no-verify)", description: "Skip pre-commit and commit-msg hooks. Useful when hooks are slow or broken", type: "toggle", flag: "--no-verify" },
      { id: "allow-empty", label: "Allow empty (--allow-empty)", description: "Create a commit even when there are no staged changes. Useful for triggering CI or marking milestones", type: "toggle", flag: "--allow-empty" },
      { id: "sign", label: "Sign (-S)", description: "GPG-sign the commit to cryptographically verify the author's identity", type: "toggle", flag: "-S" },
    ],
  },
  {
    id: "branch",
    label: "branch",
    description: "List, create, rename, or delete branches. Branches are lightweight pointers to commits.",
    flags: [
      { id: "name", label: "Branch name", description: "Name for the new branch. Use descriptive names like feature/login or fix/header-bug", type: "text", flag: "", placeholder: "branch-name" },
      {
        id: "delete",
        label: "Delete",
        description: "Remove a branch. Safe delete only works if the branch is fully merged",
        type: "select",
        flag: "",
        options: [
          { label: "None", value: "", description: "Don't delete" },
          { label: "Safe delete (-d)", value: "-d", description: "Delete only if fully merged into upstream or HEAD" },
          { label: "Force delete (-D)", value: "-D", description: "Delete regardless of merge status. Use with caution — unmerged work will be lost" },
        ],
        excludes: ["list", "rename"],
      },
      { id: "list", label: "List (-l)", description: "Show all local branches. Combine with -r to see remote branches", type: "toggle", flag: "-l", excludes: ["delete", "rename"] },
      { id: "rename", label: "Rename (-m)", description: "Rename the current branch (or the branch specified by name) to a new name", type: "text", flag: "-m", placeholder: "new-name", excludes: ["delete", "list"] },
      { id: "remote", label: "Remote (-r)", description: "Target remote-tracking branches instead of local ones", type: "toggle", flag: "-r" },
    ],
  },
  {
    id: "checkout",
    label: "checkout",
    description: "Switch branches or restore working tree files. Moves HEAD to the specified branch or commit.",
    flags: [
      { id: "target", label: "Branch / file", description: "The branch to switch to, or a file path to restore from the index", type: "text", flag: "", placeholder: "branch or file path" },
      { id: "new-branch", label: "Create new (-b)", description: "Create a new branch and switch to it in one step", type: "toggle", flag: "-b" },
      { id: "force", label: "Force (-f)", description: "Force checkout even if there are uncommitted changes. Warning: discards local modifications", type: "toggle", flag: "-f" },
    ],
  },
  {
    id: "merge",
    label: "merge",
    description: "Join two or more development histories together. Integrates changes from another branch into the current branch.",
    flags: [
      { id: "branch", label: "Branch", description: "The branch whose changes you want to integrate into your current branch", type: "text", flag: "", placeholder: "branch-name" },
      { id: "no-ff", label: "No fast-forward (--no-ff)", description: "Always create a merge commit, even if a fast-forward is possible. Preserves branch history in the log", type: "toggle", flag: "--no-ff" },
      { id: "squash", label: "Squash (--squash)", description: "Combine all merged commits into a single commit on the current branch. Keeps history clean", type: "toggle", flag: "--squash" },
      { id: "abort", label: "Abort (--abort)", description: "Cancel an in-progress merge and restore the pre-merge state. Use when conflicts are too complex", type: "toggle", flag: "--abort", excludes: ["branch", "no-ff", "squash"] },
    ],
  },
  {
    id: "rebase",
    label: "rebase",
    description: "Reapply commits on top of another base. Creates a linear history by replaying your changes onto the target branch.",
    flags: [
      { id: "branch", label: "Branch", description: "The branch to rebase onto. Your current commits will be replayed on top of it", type: "text", flag: "", placeholder: "branch-name", excludes: ["abort", "continue"] },
      { id: "interactive", label: "Interactive (-i)", description: "Open an editor to reorder, squash, edit, or drop commits. Powerful for cleaning up history", type: "toggle", flag: "-i", excludes: ["abort", "continue"] },
      { id: "onto", label: "Onto (--onto)", description: "Rebase onto a specific branch or commit, useful for moving a chain of commits to a new base", type: "text", flag: "--onto", placeholder: "target-branch", excludes: ["abort", "continue"] },
      { id: "abort", label: "Abort (--abort)", description: "Cancel an in-progress rebase and return to the original state", type: "toggle", flag: "--abort", excludes: ["branch", "interactive", "onto", "continue"] },
      { id: "continue", label: "Continue (--continue)", description: "Resume rebasing after resolving conflicts. Stage your fixes first, then continue", type: "toggle", flag: "--continue", excludes: ["branch", "interactive", "onto", "abort"] },
    ],
  },
  {
    id: "reset",
    label: "reset",
    description: "Reset current HEAD to a specified state. Moves the branch pointer and optionally modifies the index and working tree.",
    flags: [
      { id: "ref", label: "Ref", description: "The commit to reset to. Use HEAD~1 for the previous commit, or a commit hash", type: "text", flag: "", placeholder: "HEAD~1 or commit hash" },
      {
        id: "mode",
        label: "Mode",
        description: "How aggressively to reset. Controls what happens to your staged and unstaged changes",
        type: "select",
        flag: "",
        options: [
          { label: "Mixed (--mixed)", value: "--mixed", description: "Reset index but keep working tree changes. Default mode — unstages files but preserves edits" },
          { label: "Soft (--soft)", value: "--soft", description: "Only move HEAD, keep index and working tree. Your changes stay staged for recommitting" },
          { label: "Hard (--hard)", value: "--hard", description: "Reset index and working tree. All uncommitted changes are permanently lost" },
        ],
      },
    ],
  },
  {
    id: "stash",
    label: "stash",
    description: "Temporarily save uncommitted changes without committing. Useful for switching context without losing work.",
    flags: [
      {
        id: "action",
        label: "Action",
        description: "What to do with the stash",
        type: "select",
        flag: "",
        options: [
          { label: "push", value: "push", description: "Save current changes to a new stash entry" },
          { label: "pop", value: "pop", description: "Apply the most recent stash and remove it from the stash list" },
          { label: "list", value: "list", description: "Show all stashed entries with their descriptions" },
          { label: "apply", value: "apply", description: "Apply a stash without removing it from the list. Useful if you need the same stash again" },
          { label: "drop", value: "drop", description: "Delete a stash entry without applying it" },
        ],
      },
      { id: "message", label: "Message (-m)", description: "A descriptive label for the stash so you can identify it later in the list", type: "text", flag: "-m", placeholder: "stash message" },
    ],
  },
  {
    id: "cherry-pick",
    label: "cherry-pick",
    description: "Apply a specific commit from another branch onto the current branch. Copies the commit without merging the full branch.",
    flags: [
      { id: "commit", label: "Commit hash", description: "The SHA hash of the commit to cherry-pick. Find it with git log", type: "text", flag: "", placeholder: "abc1234" },
      { id: "no-commit", label: "No commit (-n)", description: "Apply the changes but don't create a commit. Useful for combining multiple cherry-picks into one commit", type: "toggle", flag: "-n" },
      { id: "edit", label: "Edit (-e)", description: "Open the editor to modify the commit message before committing", type: "toggle", flag: "-e" },
    ],
  },
  {
    id: "log",
    label: "log",
    description: "Show commit history. View who changed what, when, and why across your repository's timeline.",
    flags: [
      { id: "oneline", label: "One line (--oneline)", description: "Compact format showing each commit on a single line with abbreviated hash and message", type: "toggle", flag: "--oneline" },
      { id: "graph", label: "Graph (--graph)", description: "Draw an ASCII graph of the branch and merge history alongside the log", type: "toggle", flag: "--graph" },
      { id: "count", label: "Count (-n)", description: "Limit the number of commits shown. Useful for seeing only recent history", type: "text", flag: "-n", placeholder: "10" },
      { id: "author", label: "Author (--author)", description: "Filter commits by author name or email. Supports partial matches", type: "text", flag: "--author", placeholder: "name or email" },
      { id: "since", label: "Since (--since)", description: "Show commits after a specific date. Accepts formats like 2024-01-01 or '2 weeks ago'", type: "text", flag: "--since", placeholder: "2024-01-01" },
      { id: "file", label: "File path", description: "Show only commits that modified a specific file or directory", type: "text", flag: "--", placeholder: "path/to/file" },
    ],
  },
  {
    id: "diff",
    label: "diff",
    description: "Show changes between commits, branches, or the working tree. See exactly what was added, removed, or modified.",
    flags: [
      { id: "staged", label: "Staged (--staged)", description: "Show changes between the index (staged files) and the last commit, instead of unstaged changes", type: "toggle", flag: "--staged" },
      { id: "stat", label: "Stat (--stat)", description: "Show a summary of insertions and deletions per file instead of the full diff", type: "toggle", flag: "--stat" },
      { id: "name-only", label: "Name only (--name-only)", description: "Only show the names of changed files, not the actual diff content", type: "toggle", flag: "--name-only" },
      { id: "file", label: "File path", description: "Limit the diff to a specific file or directory", type: "text", flag: "--", placeholder: "path/to/file" },
    ],
  },
]

const RECIPES: Recipe[] = [
  {
    label: "Undo last commit (keep changes)",
    description: "Move HEAD back one commit but keep all changes staged, ready to recommit differently",
    command: "git reset --soft HEAD~1",
    operationId: "reset",
    state: { ref: "HEAD~1", mode: "--soft" },
  },
  {
    label: "Squash last N commits",
    description: "Combine multiple recent commits into a single clean commit using interactive rebase",
    command: "git rebase -i HEAD~N",
    operationId: "rebase",
    state: { branch: "HEAD~N", interactive: true },
  },
  {
    label: "Delete remote branch",
    description: "Remove a branch from the remote repository after it has been merged",
    command: "git push origin --delete branch-name",
    operationId: "branch",
    state: {},
  },
  {
    label: "Stash with message",
    description: "Save uncommitted work with a descriptive label so you can find it later",
    command: 'git stash push -m "message"',
    operationId: "stash",
    state: { action: "push", message: "message" },
  },
  {
    label: "Find commit by message",
    description: "Search the entire history for commits containing specific text in their message",
    command: 'git log --all --grep="text"',
    operationId: "log",
    state: {},
  },
  {
    label: "Show file at commit",
    description: "View the contents of a file as it existed at a specific commit, without checking it out",
    command: "git show commit:path/to/file",
    operationId: "log",
    state: {},
  },
  {
    label: "Discard all local changes",
    description: "Permanently throw away all uncommitted modifications and return to the last commit state",
    command: "git reset --hard HEAD",
    operationId: "reset",
    state: { ref: "HEAD", mode: "--hard" },
  },
  {
    label: "Create branch from specific commit",
    description: "Start a new branch from any point in history, not just the current HEAD",
    command: "git checkout -b new-branch abc1234",
    operationId: "checkout",
    state: { target: "abc1234", "new-branch": true },
  },
  {
    label: "View pretty log with graph",
    description: "See a compact, visual commit history with branch and merge lines",
    command: "git log --oneline --graph -20",
    operationId: "log",
    state: { oneline: true, graph: true, count: "20" },
  },
  {
    label: "Merge without fast-forward",
    description: "Always create a merge commit to preserve the fact that a feature branch existed",
    command: "git merge --no-ff feature-branch",
    operationId: "merge",
    state: { branch: "feature-branch", "no-ff": true },
  },
  {
    label: "Cherry-pick without committing",
    description: "Apply changes from a specific commit but stage them instead of auto-committing, for review or combining",
    command: "git cherry-pick -n abc1234",
    operationId: "cherry-pick",
    state: { commit: "abc1234", "no-commit": true },
  },
  {
    label: "See what changed in staged files",
    description: "Review exactly what will be included in the next commit before you commit it",
    command: "git diff --staged",
    operationId: "diff",
    state: { staged: true },
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
      <div>
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
        <p className="mt-2 text-xs text-muted-foreground">{operation.description}</p>
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
              className="flex flex-col gap-1.5 rounded-md border border-border bg-muted/20 px-3 py-2.5 text-left transition-colors hover:border-muted-foreground hover:bg-muted/40"
            >
              <span className="text-sm font-medium text-foreground">{recipe.label}</span>
              <span className="text-xs text-muted-foreground leading-relaxed">{recipe.description}</span>
              <code className="font-mono text-[11px] text-muted-foreground/70">{recipe.command}</code>
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
      <div className={cn(disabled && "opacity-40 pointer-events-none")}>
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <span className="text-sm text-foreground">{flag.label}</span>
        </label>
        {flag.description && (
          <p className="mt-0.5 ml-[26px] text-[11px] text-muted-foreground/70 leading-relaxed">{flag.description}</p>
        )}
      </div>
    )
  }

  if (flag.type === "select") {
    const selectedOpt = flag.options?.find((o) => o.value === value)
    return (
      <div
        className={cn(
          "flex flex-col gap-1.5",
          disabled && "opacity-40 pointer-events-none",
        )}
      >
        <span className="text-sm font-medium text-foreground">{flag.label}</span>
        {flag.description && (
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed -mt-0.5">{flag.description}</p>
        )}
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
        {selectedOpt?.description && (
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{selectedOpt.description}</p>
        )}
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
      {flag.description && (
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed -mt-0.5">{flag.description}</p>
      )}
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
