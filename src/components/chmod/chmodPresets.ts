import { type Preset } from "@/components/shared/PresetsDrawer"

export const CHMOD_PRESETS: Preset[] = [
    {
        name: "644 - Default File",
        category: "Common",
        description: "Owner read/write, group/other read-only",
        content: "644",
    },
    {
        name: "755 - Default Dir/Script",
        category: "Common",
        description: "Owner full, group/other read+execute",
        content: "755",
    },
    {
        name: "700 - Owner Only",
        category: "Restrictive",
        description: "Full access for owner, none for others",
        content: "700",
    },
    {
        name: "777 - Full Access",
        category: "Permissive",
        description: "Full access for everyone (use with caution)",
        content: "777",
    },
    {
        name: "600 - Private File",
        category: "Restrictive",
        description: "Owner read/write only (SSH keys, configs)",
        content: "600",
    },
    {
        name: "444 - Read-Only",
        category: "Restrictive",
        description: "Read-only for everyone",
        content: "444",
    },
]
