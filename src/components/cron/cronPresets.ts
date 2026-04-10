import { type Preset } from "@/components/shared/PresetsDrawer"

export const CRON_PRESETS: Preset[] = [
    {
        name: "Every minute",
        category: "Frequent",
        description: "Run every single minute",
        content: "* * * * *",
    },
    {
        name: "Every 5 minutes",
        category: "Frequent",
        description: "Run every 5 minutes",
        content: "*/5 * * * *",
    },
    {
        name: "Every hour",
        category: "Frequent",
        description: "At the start of every hour",
        content: "0 * * * *",
    },
    {
        name: "Daily at midnight",
        category: "Daily",
        description: "Run once daily at 00:00",
        content: "0 0 * * *",
    },
    {
        name: "Weekdays at 9 AM",
        category: "Business",
        description: "Monday through Friday at 9:00 AM",
        content: "0 9 * * 1-5",
    },
    {
        name: "First of month",
        category: "Monthly",
        description: "Run at midnight on the 1st of each month",
        content: "0 0 1 * *",
    },
]
