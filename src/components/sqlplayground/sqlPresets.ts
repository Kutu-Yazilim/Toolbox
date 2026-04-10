import { type Preset } from "@/components/shared/PresetsDrawer"

export const SQL_PRESETS: Preset[] = [
    { name: "Select All", category: "Queries", description: "Select all rows from a table", content: "SELECT * FROM table_name LIMIT 100;" },
    { name: "Count Rows", category: "Queries", description: "Count total rows in a table", content: "SELECT COUNT(*) AS total FROM table_name;" },
    { name: "Group By", category: "Aggregation", description: "Group and count by column", content: "SELECT column_name, COUNT(*) AS count\nFROM table_name\nGROUP BY column_name\nORDER BY count DESC;" },
    { name: "Create Table", category: "DDL", description: "Create a sample table with data", content: "CREATE TABLE IF NOT EXISTS sample (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL,\n  value REAL\n);\n\nINSERT INTO sample (id, name, value) VALUES\n  (1, 'Alpha', 10.5),\n  (2, 'Beta', 20.3),\n  (3, 'Gamma', 15.7);\n\nSELECT * FROM sample;" },
    { name: "Join Example", category: "Queries", description: "Inner join between two tables", content: "SELECT a.*, b.*\nFROM table_a a\nINNER JOIN table_b b ON a.id = b.a_id;" },
]
