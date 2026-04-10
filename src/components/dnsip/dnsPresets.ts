import { type Preset } from "@/components/shared/PresetsDrawer"

export const DNS_PRESETS: Preset[] = [
    { name: "google.com", category: "Popular", description: "Google search engine", content: "google.com" },
    { name: "github.com", category: "Popular", description: "Code hosting platform", content: "github.com" },
    { name: "cloudflare.com", category: "CDN / DNS", description: "CDN and DNS provider", content: "cloudflare.com" },
    { name: "aws.amazon.com", category: "Cloud", description: "Amazon Web Services", content: "aws.amazon.com" },
    { name: "example.com", category: "Testing", description: "IANA reserved test domain", content: "example.com" },
]
