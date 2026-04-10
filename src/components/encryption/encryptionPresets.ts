import { type Preset } from "@/components/shared/PresetsDrawer"

export const ENCRYPTION_PRESETS: Preset[] = [
    { name: "Hello World", category: "Examples", description: "Simple plaintext for testing", content: "Hello, World! This is a test message for encryption." },
    { name: "JSON Payload", category: "Examples", description: "Sample JSON data to encrypt", content: '{"username": "admin", "token": "abc123", "role": "editor"}' },
    { name: "API Key", category: "Examples", description: "Simulated sensitive data", content: "sk_live_EXAMPLE1234567890abcdefghijklmnop" },
    { name: "Multi-line Secret", category: "Examples", description: "Multi-line config block", content: "DB_HOST=localhost\nDB_PORT=5432\nDB_USER=admin\nDB_PASS=supersecret" },
]
