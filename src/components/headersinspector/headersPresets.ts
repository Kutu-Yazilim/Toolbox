import { type Preset } from "@/components/shared/PresetsDrawer"

export const HEADERS_PRESETS: Preset[] = [
    { name: "https://google.com", category: "Popular", description: "Google search engine", content: "https://google.com" },
    { name: "https://github.com", category: "Popular", description: "Code hosting platform", content: "https://github.com" },
    { name: "https://cloudflare.com", category: "Security", description: "Strong security headers", content: "https://cloudflare.com" },
    { name: "https://example.com", category: "Testing", description: "IANA reserved test domain", content: "https://example.com" },
    { name: "https://httpbin.org/headers", category: "Testing", description: "HTTP testing service", content: "https://httpbin.org/headers" },
]
