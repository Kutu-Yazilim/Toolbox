import { type Preset } from "@/components/shared/PresetsDrawer"

export const TRANSFORM_PRESETS: Preset[] = [
    { name: "Employee Data", category: "Sample Data", description: "Employee records with salary info", content: JSON.stringify([
        { name: "Alice", age: 30, city: "New York", role: "Engineer", salary: 95000 },
        { name: "Bob", age: 25, city: "San Francisco", role: "Designer", salary: 82000 },
        { name: "Charlie", age: 35, city: "London", role: "Manager", salary: 110000 },
        { name: "Diana", age: 28, city: "Berlin", role: "Developer", salary: 88000 },
        { name: "Eve", age: 32, city: "Tokyo", role: "Analyst", salary: 76000 },
        { name: "Frank", age: 30, city: "New York", role: "Engineer", salary: 97000 },
    ], null, 2) },
    { name: "Product Catalog", category: "Sample Data", description: "Products with categories and prices", content: JSON.stringify([
        { id: 1, product: "Laptop", category: "Electronics", price: 999, stock: 45 },
        { id: 2, product: "Keyboard", category: "Accessories", price: 79, stock: 200 },
        { id: 3, product: "Monitor", category: "Electronics", price: 449, stock: 30 },
        { id: 4, product: "Mouse", category: "Accessories", price: 29, stock: 150 },
    ], null, 2) },
    { name: "CSV Format", category: "Formats", description: "Comma-separated values", content: `name,age,city
Alice,30,New York
Bob,25,San Francisco
Charlie,35,London` },
]
