import { type Preset } from "@/components/shared/PresetsDrawer"

export const API_REQUEST_PRESETS: Preset[] = [
    {
        name: "GET JSON",
        category: "REST",
        description: "Simple GET request to fetch JSON data",
        content: JSON.stringify({ method: "GET", url: "https://jsonplaceholder.typicode.com/posts/1", headers: [{ key: "Accept", value: "application/json", enabled: true }], body: "" }),
    },
    {
        name: "POST JSON",
        category: "REST",
        description: "Create a resource with JSON body",
        content: JSON.stringify({ method: "POST", url: "https://jsonplaceholder.typicode.com/posts", headers: [{ key: "Content-Type", value: "application/json", enabled: true }], body: '{\n  "title": "New Post",\n  "body": "Content here",\n  "userId": 1\n}' }),
    },
    {
        name: "Bearer Auth",
        category: "Auth",
        description: "GET with Bearer token authentication",
        content: JSON.stringify({ method: "GET", url: "https://api.example.com/me", headers: [{ key: "Authorization", value: "Bearer YOUR_TOKEN", enabled: true }, { key: "Accept", value: "application/json", enabled: true }], body: "" }),
    },
    {
        name: "GraphQL Query",
        category: "GraphQL",
        description: "POST a GraphQL query",
        content: JSON.stringify({ method: "POST", url: "https://api.example.com/graphql", headers: [{ key: "Content-Type", value: "application/json", enabled: true }], body: '{\n  "query": "{ users { id name email } }"\n}' }),
    },
    {
        name: "PUT Update",
        category: "REST",
        description: "Update an existing resource",
        content: JSON.stringify({ method: "PUT", url: "https://jsonplaceholder.typicode.com/posts/1", headers: [{ key: "Content-Type", value: "application/json", enabled: true }], body: '{\n  "id": 1,\n  "title": "Updated Title",\n  "body": "Updated content",\n  "userId": 1\n}' }),
    },
]
