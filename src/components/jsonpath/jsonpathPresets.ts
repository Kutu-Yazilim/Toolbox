import { type Preset } from "@/components/shared/PresetsDrawer"

export const JSONPATH_PRESETS: Preset[] = [
    { name: "Bookstore", category: "Sample Data", description: "Nested bookstore with inventory", content: JSON.stringify({
        store: {
            name: "TechBooks",
            location: { city: "Istanbul", country: "Turkey" },
            books: [
                { title: "TypeScript Handbook", author: "Microsoft", price: 29.99, tags: ["typescript", "programming"], inStock: true },
                { title: "React Patterns", author: "Kent C. Dodds", price: 35.50, tags: ["react", "javascript", "frontend"], inStock: false },
                { title: "Node.js Design Patterns", author: "Mario Casciaro", price: 42.00, tags: ["node", "backend"], inStock: true },
            ],
            totalBooks: 3, open: true,
        },
    }, null, 2) },
    { name: "API Response", category: "Sample Data", description: "Typical REST API paginated response", content: JSON.stringify({
        status: 200, data: { users: [
            { id: 1, name: "Alice", email: "alice@example.com", active: true },
            { id: 2, name: "Bob", email: "bob@example.com", active: false },
        ], pagination: { page: 1, total: 50 } },
    }, null, 2) },
    { name: "Nested Config", category: "Sample Data", description: "Application configuration object", content: JSON.stringify({
        app: { name: "MyApp", version: "2.0.0", features: { darkMode: true, analytics: false }, db: { host: "localhost", port: 5432 } },
    }, null, 2) },
]
