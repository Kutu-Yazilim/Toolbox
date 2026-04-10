import { type Preset } from "@/components/shared/PresetsDrawer"

export const JSON_TO_TYPES_PRESETS: Preset[] = [
    {
        name: "User Profile",
        category: "Common",
        description: "Typical user object with nested address",
        content: `{\n  "id": 1,\n  "name": "Alice",\n  "email": "alice@example.com",\n  "active": true,\n  "score": 95.5,\n  "address": {\n    "street": "123 Main St",\n    "city": "Springfield",\n    "zip": "62704"\n  },\n  "roles": ["admin", "editor"],\n  "metadata": null\n}`,
    },
    {
        name: "API Response",
        category: "API",
        description: "Paginated API response wrapper",
        content: `{\n  "data": [\n    { "id": 1, "title": "Post 1", "published": true },\n    { "id": 2, "title": "Post 2", "published": false }\n  ],\n  "meta": {\n    "page": 1,\n    "perPage": 20,\n    "total": 100,\n    "totalPages": 5\n  },\n  "links": {\n    "self": "/api/posts?page=1",\n    "next": "/api/posts?page=2",\n    "last": "/api/posts?page=5"\n  }\n}`,
    },
    {
        name: "E-commerce Product",
        category: "Domain",
        description: "Product with variants and pricing",
        content: `{\n  "sku": "PROD-001",\n  "name": "Premium Widget",\n  "description": "A high-quality widget",\n  "price": 29.99,\n  "currency": "USD",\n  "inStock": true,\n  "categories": ["electronics", "gadgets"],\n  "variants": [\n    { "size": "S", "color": "red", "stock": 10 },\n    { "size": "M", "color": "blue", "stock": 25 }\n  ],\n  "images": [\n    { "url": "https://example.com/img1.jpg", "alt": "Front view" }\n  ]\n}`,
    },
    {
        name: "GitHub Event",
        category: "API",
        description: "GitHub webhook event payload",
        content: `{\n  "action": "opened",\n  "number": 42,\n  "pull_request": {\n    "id": 123456,\n    "title": "Add new feature",\n    "state": "open",\n    "draft": false,\n    "user": {\n      "login": "octocat",\n      "avatar_url": "https://github.com/images/octocat.png"\n    },\n    "created_at": "2024-01-15T10:30:00Z",\n    "updated_at": "2024-01-15T10:30:00Z",\n    "labels": [{ "name": "enhancement", "color": "a2eeef" }]\n  }\n}`,
    },
]
