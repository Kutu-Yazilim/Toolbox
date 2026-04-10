import { type Preset } from "@/components/shared/PresetsDrawer"

export const HTTP_STATUS_PRESETS: Preset[] = [
    {
        name: "Success Codes",
        category: "Filters",
        description: "Show only 2xx success status codes",
        content: "2",
    },
    {
        name: "Client Errors",
        category: "Filters",
        description: "Show only 4xx client error codes",
        content: "4",
    },
    {
        name: "Server Errors",
        category: "Filters",
        description: "Show only 5xx server error codes",
        content: "5",
    },
    {
        name: "Auth Related",
        category: "Filters",
        description: "Search for authentication/authorization codes",
        content: "unauthorized",
    },
    {
        name: "Not Found",
        category: "Common",
        description: "Search for 404 Not Found",
        content: "404",
    },
]
