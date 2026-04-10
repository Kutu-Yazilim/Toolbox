import { type Preset } from "@/components/shared/PresetsDrawer"

export const BASE64_PRESETS: Preset[] = [
  {
    name: "JSON Object",
    category: "Common",
    description: "A sample JSON payload",
    content: '{"name":"Alice","email":"alice@example.com","roles":["admin","user"]}',
  },
  {
    name: "HTML Snippet",
    category: "Common",
    description: "A basic HTML document",
    content: '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello</h1></body></html>',
  },
  {
    name: "Bearer Token",
    category: "Auth",
    description: "A sample Authorization header value",
    content: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
  },
  {
    name: "CSV Data",
    category: "Data",
    description: "Sample comma-separated values",
    content: "name,email,age\nAlice,alice@example.com,30\nBob,bob@example.com,25",
  },
]

export const URL_PRESETS: Preset[] = [
  {
    name: "Search URL with Params",
    category: "URLs",
    description: "URL with query params and special chars",
    content: 'https://example.com/search?q=hello world&lang=en&filter=name="test"&redirect=https://other.com/path',
  },
  {
    name: "OAuth Callback",
    category: "URLs",
    description: "Typical OAuth redirect URI",
    content: "https://app.example.com/auth/callback?code=abc123&state=xyz&redirect_uri=https://app.example.com/dashboard",
  },
  {
    name: "API Endpoint with JSON",
    category: "URLs",
    description: "REST API URL with encoded JSON body",
    content: 'https://api.example.com/v1/users?filter={"status":"active","role":"admin"}&limit=10',
  },
  {
    name: "Email mailto Link",
    category: "URLs",
    description: "A mailto link with subject and body",
    content: "mailto:user@example.com?subject=Hello World&body=This is a test email with special chars: <>&",
  },
]
