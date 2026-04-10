import { type Preset } from "@/components/shared/PresetsDrawer"

export const GIT_COMMAND_PRESETS: Preset[] = [
    {
        name: "Undo Last Commit",
        category: "Common",
        description: "Reset last commit but keep changes staged",
        content: JSON.stringify({ op: "reset", flags: { ref: "HEAD~1", mode: "--soft" } }),
    },
    {
        name: "Pretty Log",
        category: "Common",
        description: "Compact log with graph visualization",
        content: JSON.stringify({ op: "log", flags: { oneline: true, graph: true, count: "20" } }),
    },
    {
        name: "Stash with Message",
        category: "Common",
        description: "Save work in progress with a label",
        content: JSON.stringify({ op: "stash", flags: { action: "push", message: "WIP: feature work" } }),
    },
    {
        name: "Merge No-FF",
        category: "Branching",
        description: "Merge preserving branch history",
        content: JSON.stringify({ op: "merge", flags: { branch: "feature-branch", "no-ff": true } }),
    },
    {
        name: "Staged Diff",
        category: "Common",
        description: "Review changes ready to commit",
        content: JSON.stringify({ op: "diff", flags: { staged: true } }),
    },
]
