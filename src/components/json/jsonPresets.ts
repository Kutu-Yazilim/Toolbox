import { type Preset } from "@/components/shared/PresetsDrawer"

export const JSON_PRESETS: Preset[] = [
    {
        name: "API Response",
        category: "Common",
        description: "Typical REST API response with pagination",
        content: JSON.stringify(
            {
                status: 200,
                data: {
                    users: [
                        { id: 1, name: "Alice", email: "alice@example.com", active: true },
                        { id: 2, name: "Bob", email: "bob@example.com", active: false },
                    ],
                },
                meta: {
                    total: 2,
                    page: 1,
                    perPage: 10,
                    totalPages: 1,
                },
                errors: null,
            },
            null,
            2,
        ),
    },
    {
        name: "package.json",
        category: "Config",
        description: "Node.js package manifest",
        content: JSON.stringify(
            {
                name: "my-app",
                version: "1.0.0",
                description: "A sample application",
                main: "index.js",
                scripts: {
                    dev: "next dev",
                    build: "next build",
                    start: "next start",
                    lint: "eslint .",
                    test: "vitest",
                },
                dependencies: {
                    next: "^15.0.0",
                    react: "^19.0.0",
                    "react-dom": "^19.0.0",
                },
                devDependencies: {
                    typescript: "^5.6.0",
                    eslint: "^9.0.0",
                    vitest: "^2.0.0",
                },
                license: "MIT",
            },
            null,
            2,
        ),
    },
    {
        name: "tsconfig.json",
        category: "Config",
        description: "TypeScript compiler configuration",
        content: JSON.stringify(
            {
                compilerOptions: {
                    target: "ES2022",
                    lib: ["dom", "dom.iterable", "esnext"],
                    allowJs: true,
                    skipLibCheck: true,
                    strict: true,
                    noEmit: true,
                    esModuleInterop: true,
                    module: "esnext",
                    moduleResolution: "bundler",
                    resolveJsonModule: true,
                    isolatedModules: true,
                    jsx: "preserve",
                    incremental: true,
                    paths: {
                        "@/*": ["./src/*"],
                    },
                },
                include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
                exclude: ["node_modules"],
            },
            null,
            2,
        ),
    },
    {
        name: "OpenAPI Stub",
        category: "API",
        description: "Minimal OpenAPI 3.0 specification",
        content: JSON.stringify(
            {
                openapi: "3.0.3",
                info: {
                    title: "Sample API",
                    version: "1.0.0",
                    description: "A sample API specification",
                },
                servers: [{ url: "https://api.example.com/v1" }],
                paths: {
                    "/users": {
                        get: {
                            summary: "List users",
                            operationId: "listUsers",
                            parameters: [
                                {
                                    name: "page",
                                    in: "query",
                                    schema: { type: "integer", default: 1 },
                                },
                            ],
                            responses: {
                                "200": {
                                    description: "Successful response",
                                    content: {
                                        "application/json": {
                                            schema: {
                                                type: "array",
                                                items: { $ref: "#/components/schemas/User" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                components: {
                    schemas: {
                        User: {
                            type: "object",
                            properties: {
                                id: { type: "integer" },
                                name: { type: "string" },
                                email: { type: "string", format: "email" },
                            },
                            required: ["id", "name", "email"],
                        },
                    },
                },
            },
            null,
            2,
        ),
    },
]
