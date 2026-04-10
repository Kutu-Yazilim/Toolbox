import { type Preset } from "@/components/shared/PresetsDrawer"

export const TOTP_PRESETS: Preset[] = [
    { name: "RFC 6238 Test", category: "Standard", description: "Standard test vector from RFC 6238", content: JSON.stringify({ secret: "JBSWY3DPEHPK3PXP", period: 30, digits: 6, algorithm: "SHA-1" }) },
    { name: "SHA-256, 8 Digits", category: "Advanced", description: "Higher security TOTP configuration", content: JSON.stringify({ secret: "JBSWY3DPEHPK3PXP", period: 30, digits: 8, algorithm: "SHA-256" }) },
    { name: "60s Period", category: "Advanced", description: "Longer validity window", content: JSON.stringify({ secret: "JBSWY3DPEHPK3PXP", period: 60, digits: 6, algorithm: "SHA-1" }) },
    { name: "GitHub-style", category: "Services", description: "Typical GitHub 2FA settings", content: JSON.stringify({ secret: "", period: 30, digits: 6, algorithm: "SHA-1", issuer: "GitHub" }) },
]
