import { type Preset } from "@/components/shared/PresetsDrawer"

export const QR_PRESETS: Preset[] = [
  {
    name: "Website URL",
    category: "Links",
    description: "Standard HTTPS URL",
    content: "https://kutu.io",
  },
  {
    name: "Email Address",
    category: "Contact",
    description: "mailto link for email",
    content: "mailto:hello@example.com",
  },
  {
    name: "Phone Number",
    category: "Contact",
    description: "Telephone link",
    content: "tel:+1234567890",
  },
  {
    name: "Wi-Fi Network",
    category: "Utility",
    description: "Wi-Fi connection string (WPA)",
    content: "WIFI:T:WPA;S:MyNetwork;P:MyPassword;;",
  },
  {
    name: "vCard Contact",
    category: "Contact",
    description: "Digital business card",
    content: "BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL:+1234567890\nEMAIL:john@example.com\nEND:VCARD",
  },
]
