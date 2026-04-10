import { type Preset } from "@/components/shared/PresetsDrawer"

export const ENCODER_PRESETS: Preset[] = [
    {
        name: "JWT Token",
        category: "Authentication",
        description: "Example JWT with header, payload, and signature",
        content: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    },
    {
        name: "Data URI (PNG pixel)",
        category: "Data URIs",
        description: "Base64-encoded 1x1 transparent PNG as a data URI",
        content: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    },
    {
        name: "Basic Auth Header",
        category: "Authentication",
        description: "HTTP Basic Authentication header value",
        content: "Basic dXNlcm5hbWU6cGFzc3dvcmQ=",
    },
    {
        name: "URL Query String",
        category: "URL Encoding",
        description: "Complex URL with special characters in query params",
        content: "https://api.example.com/search?q=hello+world&filter=name%3D%22test%22&redirect=https%3A%2F%2Fother.com%2Fpath&tags=a%26b",
    },
    {
        name: "HTML with Entities",
        category: "HTML Entities",
        description: "HTML snippet containing entity-encoded characters",
        content: "&lt;div class=&quot;container&quot;&gt;&lt;p&gt;Price: 5 &amp;gt; 3 &amp;amp; 2 &amp;lt; 4&lt;/p&gt;&lt;/div&gt;",
    },
    {
        name: "JSON Payload",
        category: "Base64",
        description: "JSON object for Base64 encoding",
        content: '{"name":"Alice","email":"alice@example.com","roles":["admin","user"],"metadata":{"created":"2024-01-15"}}',
    },
]
