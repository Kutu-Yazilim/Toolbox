import { type Preset } from "@/components/shared/PresetsDrawer"

const CATEGORY_MILESTONES = "Milestones"
const CATEGORY_SYSTEM = "System Limits"
const CATEGORY_STANDARDS = "Standard Epochs"

export const TIMESTAMP_PRESETS: Preset[] = [
    {
        name: "Unix Epoch",
        category: CATEGORY_STANDARDS,
        description: "January 1, 1970 00:00:00 UTC",
        content: "0",
    },
    {
        name: "GPS Epoch",
        category: CATEGORY_STANDARDS,
        description: "January 6, 1980 00:00:00 UTC",
        content: "315964800",
    },
    {
        name: "NTP Epoch",
        category: CATEGORY_STANDARDS,
        description: "January 1, 1900 00:00:00 UTC",
        content: "-2208988800",
    },
    {
        name: "Y2K",
        category: CATEGORY_MILESTONES,
        description: "January 1, 2000 00:00:00 UTC",
        content: "946684800",
    },
    {
        name: "Y2K38 Problem",
        category: CATEGORY_SYSTEM,
        description: "Max 32-bit signed integer timestamp",
        content: "2147483647",
    },
    {
        name: "Max JS Date (ms)",
        category: CATEGORY_SYSTEM,
        description: "Maximum JavaScript Date value",
        content: "8640000000000000",
    },
    {
        name: "1 Billion Seconds",
        category: CATEGORY_MILESTONES,
        description: "September 9, 2001 01:46:40 UTC",
        content: "1000000000",
    },
    {
        name: "2 Billion Seconds",
        category: CATEGORY_MILESTONES,
        description: "May 18, 2033 03:33:20 UTC",
        content: "2000000000",
    },
    {
        name: "Apollo 11 Moon Landing",
        category: CATEGORY_MILESTONES,
        description: "July 20, 1969 20:17:40 UTC",
        content: "-14182940",
    },
    {
        name: "First iPhone Release",
        category: CATEGORY_MILESTONES,
        description: "June 29, 2007",
        content: "1183075200",
    },
]
