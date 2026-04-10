import { type Preset } from "@/components/shared/PresetsDrawer"

export const CSP_PRESETS: Preset[] = [
    { name: "Strict", category: "Security Level", description: "Strict policy with self-only sources", content: "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests" },
    { name: "Moderate", category: "Security Level", description: "Allows inline styles and data URIs", content: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; object-src 'none'" },
    { name: "CDN Friendly", category: "Use Cases", description: "Allows common CDN origins", content: "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:" },
    { name: "SPA / Next.js", category: "Use Cases", description: "Typical SPA framework policy", content: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https:; font-src 'self'" },
    { name: "Report Only", category: "Testing", description: "Non-blocking policy for testing", content: "default-src 'self'; script-src 'self'; style-src 'self'; report-uri /csp-report" },
]
