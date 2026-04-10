export interface RegexPreset {
    name: string
    category: string
    description: string
    content: string
    flags: string
    testString: string
}

export const REGEX_PRESETS: RegexPreset[] = [
    {
        name: "Email Address",
        category: "Common",
        description: "Matches standard email addresses",
        content: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
        flags: "g",
        testString: "Contact us at alice@example.com or support@test.org for help.",
    },
    {
        name: "URL",
        category: "Common",
        description: "Matches HTTP and HTTPS URLs",
        content: "https?://[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=%]+",
        flags: "g",
        testString: "Visit https://example.com or http://test.io/path?q=1&v=2 for more.",
    },
    {
        name: "IPv4 Address",
        category: "Network",
        description: "Matches IPv4 addresses like 192.168.1.1",
        content: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b",
        flags: "g",
        testString: "Server at 192.168.1.100, gateway 10.0.0.1, DNS 8.8.8.8.",
    },
    {
        name: "Phone (US)",
        category: "Common",
        description: "Matches US phone numbers in various formats",
        content: "\\+?1?[\\s.-]?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}",
        flags: "g",
        testString: "Call +1 (555) 123-4567 or 555.987.6543 or 1-800-555-0199.",
    },
    {
        name: "Date (YYYY-MM-DD)",
        category: "Common",
        description: "Matches ISO date format",
        content: "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])",
        flags: "g",
        testString: "Important dates: 2024-01-15, 2025-12-31, 2026-02-17.",
    },
    {
        name: "Hex Color",
        category: "Web",
        description: "Matches hex color codes like #FF5733",
        content: "#(?:[0-9a-fA-F]{3}){1,2}\\b",
        flags: "gi",
        testString: "Colors: #FF5733, #3b82f6, #0f0, #ABC.",
    },
    {
        name: "UUID",
        category: "Common",
        description: "Matches UUID v4 strings",
        content: "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
        flags: "gi",
        testString: "Session: 550e8400-e29b-41d4-a716-446655440000, Token: a1b2c3d4-e5f6-7890-abcd-ef1234567890.",
    },
    {
        name: "JWT Token",
        category: "Security",
        description: "Matches JSON Web Token format",
        content: "eyJ[A-Za-z0-9_-]+\\.eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+",
        flags: "g",
        testString: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
    },
    {
        name: "ISO Date-Time",
        category: "Common",
        description: "Matches ISO 8601 date-time with optional timezone",
        content: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})?",
        flags: "g",
        testString: "Created: 2024-01-15T09:30:00Z, Updated: 2025-06-01T14:00:00+05:30.",
    },
    {
        name: "Semantic Version",
        category: "Development",
        description: "Matches semver strings like 1.2.3 or 2.0.0-beta.1",
        content: "\\bv?(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)(?:-[\\da-zA-Z-]+(?:\\.[\\da-zA-Z-]+)*)?(?:\\+[\\da-zA-Z-]+(?:\\.[\\da-zA-Z-]+)*)?\\b",
        flags: "g",
        testString: "Versions: v1.0.0, 2.3.1, 0.1.0-beta.1, 3.0.0-rc.2+build.123.",
    },
    {
        name: "Markdown Link",
        category: "Web",
        description: "Matches [text](url) markdown links",
        content: "\\[([^\\]]+)\\]\\(([^)]+)\\)",
        flags: "g",
        testString: "Check [Google](https://google.com) and [Docs](https://docs.example.com/page).",
    },
    {
        name: "HTML Tag",
        category: "Web",
        description: "Matches opening and closing HTML tags",
        content: "<\\/?([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>",
        flags: "g",
        testString: '<div class="container"><p>Hello</p><br /><img src="a.png" /></div>',
    },
    {
        name: "Credit Card",
        category: "Security",
        description: "Matches common credit card number formats",
        content: "\\b(?:4\\d{3}|5[1-5]\\d{2}|3[47]\\d{2}|6(?:011|5\\d{2}))[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}\\b",
        flags: "g",
        testString: "Cards: 4111-1111-1111-1111, 5500 0000 0000 0004, 371449635398431.",
    },
    {
        name: "MAC Address",
        category: "Network",
        description: "Matches MAC addresses in colon or dash format",
        content: "(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}",
        flags: "gi",
        testString: "Devices: 00:1A:2B:3C:4D:5E, AA-BB-CC-DD-EE-FF, 01:23:45:67:89:ab.",
    },
    {
        name: "CSS Selector",
        category: "Web",
        description: "Matches CSS class and ID selectors",
        content: "[.#][a-zA-Z_-][a-zA-Z0-9_-]*",
        flags: "g",
        testString: "Selectors: .container, #main-nav, .btn-primary, #app, .text-lg.",
    },
] as const
