import { type Preset } from "@/components/shared/PresetsDrawer"

export const SSL_PRESETS: Preset[] = [
    { name: "google.com", category: "Popular", description: "Google search engine", content: "google.com" },
    { name: "github.com", category: "Popular", description: "Code hosting platform", content: "github.com" },
    { name: "letsencrypt.org", category: "Certificate Authorities", description: "Free SSL certificates", content: "letsencrypt.org" },
    { name: "expired.badssl.com", category: "Testing", description: "Intentionally expired certificate", content: "expired.badssl.com" },
    { name: "self-signed.badssl.com", category: "Testing", description: "Self-signed certificate", content: "self-signed.badssl.com" },
]
