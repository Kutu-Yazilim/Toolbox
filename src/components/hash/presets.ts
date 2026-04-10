import { type Preset } from "@/components/shared/PresetsDrawer"

export const HASH_PRESETS: Preset[] = [
  {
    name: "Empty String",
    category: "Reference",
    description: "Known hash values for empty input",
    content: "",
  },
  {
    name: "Hello World",
    category: "Reference",
    description: "Classic test string",
    content: "Hello, World!",
  },
  {
    name: "Password Test",
    category: "Security",
    description: "Check a sample password hash",
    content: "P@ssw0rd123!",
  },
  {
    name: "JSON Payload",
    category: "Development",
    description: "Hash a JSON object string",
    content: '{"user":"admin","action":"login","timestamp":"2024-01-01T00:00:00Z"}',
  },
]
