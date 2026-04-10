import { type Preset } from "@/components/shared/PresetsDrawer"

export const JWT_DECODE_PRESETS: Preset[] = [
  {
    name: "Standard JWT",
    category: "Examples",
    description: "HS256 signed token with common claims",
    content: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4S3ojyNuxKnD_KJbKGSmMm3gT69LxGGDBYasfU0jLuY",
  },
  {
    name: "Expired Token",
    category: "Examples",
    description: "Token that has already expired",
    content: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4S3ojyNuxKnD_KJbKGSmMm3gT69LxGGDBYasfU0jLuY",
  },
  {
    name: "Admin Role Token",
    category: "Examples",
    description: "Token with admin role claim",
    content: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IkFkbWluIiwicm9sZSI6ImFkbWluIiwicGVybWlzc2lvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl0sImlhdCI6MTUxNjIzOTAyMn0.5RXHMfL4PZr3AYrXYKM_fXY7M9XLwV3MrRxK0WFOQIE",
  },
]

export const JWT_FORGE_PRESETS: Preset[] = [
  {
    name: "Basic User Token",
    category: "Templates",
    description: "Simple user authentication token",
    content: JSON.stringify({
      header: { alg: "HS256", typ: "JWT" },
      payload: { sub: "1234567890", name: "John Doe", iat: 0, exp: 0 },
    }),
  },
  {
    name: "API Key Token",
    category: "Templates",
    description: "API access token with scopes",
    content: JSON.stringify({
      header: { alg: "HS256", typ: "JWT" },
      payload: { iss: "api.example.com", sub: "api-key-001", scopes: ["read", "write"], iat: 0, exp: 0 },
    }),
  },
  {
    name: "Service Account",
    category: "Templates",
    description: "Service-to-service authentication",
    content: JSON.stringify({
      header: { alg: "HS256", typ: "JWT" },
      payload: { iss: "auth.example.com", sub: "service-worker", aud: "api.example.com", iat: 0, exp: 0 },
    }),
  },
]
