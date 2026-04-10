import { type Preset } from "@/components/shared/PresetsDrawer"

export const PASSWORD_PRESETS: Preset[] = [
    { name: "Strong (20 chars)", category: "Password", description: "All character types, 20 characters", content: JSON.stringify({ mode: "password", length: 20, lower: true, upper: true, numbers: true, symbols: true, noAmbiguous: false }) },
    { name: "PIN (6 digits)", category: "Password", description: "Numbers only, 6 characters", content: JSON.stringify({ mode: "password", length: 6, lower: false, upper: false, numbers: true, symbols: false, noAmbiguous: false }) },
    { name: "Alphanumeric (16)", category: "Password", description: "Letters and numbers, no symbols", content: JSON.stringify({ mode: "password", length: 16, lower: true, upper: true, numbers: true, symbols: false, noAmbiguous: false }) },
    { name: "Passphrase (4 words)", category: "Passphrase", description: "4 words with hyphens", content: JSON.stringify({ mode: "passphrase", wordCount: 4, separator: "-" }) },
    { name: "Passphrase (6 words)", category: "Passphrase", description: "6 words for high security", content: JSON.stringify({ mode: "passphrase", wordCount: 6, separator: "-" }) },
]
