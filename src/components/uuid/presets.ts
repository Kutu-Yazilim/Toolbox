import { type Preset } from "@/components/shared/PresetsDrawer"

export const UUID_PRESETS: Preset[] = [
  {
    name: "Single v4 UUID",
    category: "Quick Generate",
    description: "1 random UUID (most common)",
    content: JSON.stringify({ version: "v4", count: 1 }),
  },
  {
    name: "Batch of 10 v4",
    category: "Quick Generate",
    description: "10 random UUIDs for testing",
    content: JSON.stringify({ version: "v4", count: 10 }),
  },
  {
    name: "Batch of 100 v4",
    category: "Bulk",
    description: "100 random UUIDs",
    content: JSON.stringify({ version: "v4", count: 100 }),
  },
  {
    name: "10 v7 (Timestamp)",
    category: "Quick Generate",
    description: "10 sortable timestamp-based UUIDs",
    content: JSON.stringify({ version: "v7", count: 10 }),
  },
]
