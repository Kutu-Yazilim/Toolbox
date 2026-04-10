import { type Preset } from "@/components/shared/PresetsDrawer"

export const CODE_SCREENSHOT_PRESETS: Preset[] = [
    {
        name: "React Component",
        category: "Code",
        description: "Functional React component with hooks",
        content: JSON.stringify({
            code: `function Counter() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(c => c + 1)}>\n        Increment\n      </button>\n    </div>\n  );\n}`,
            language: "typescript",
        }),
    },
    {
        name: "Python Script",
        category: "Code",
        description: "Python function with type hints",
        content: JSON.stringify({
            code: `def fibonacci(n: int) -> list[int]:\n    """Generate the first n Fibonacci numbers."""\n    if n <= 0:\n        return []\n    \n    sequence = [0, 1]\n    for _ in range(2, n):\n        sequence.append(sequence[-1] + sequence[-2])\n    \n    return sequence[:n]\n\nprint(fibonacci(10))`,
            language: "python",
        }),
    },
    {
        name: "Rust Struct",
        category: "Code",
        description: "Rust struct with implementation",
        content: JSON.stringify({
            code: `#[derive(Debug, Clone)]\nstruct Point {\n    x: f64,\n    y: f64,\n}\n\nimpl Point {\n    fn new(x: f64, y: f64) -> Self {\n        Point { x, y }\n    }\n\n    fn distance(&self, other: &Point) -> f64 {\n        ((self.x - other.x).powi(2)\n            + (self.y - other.y).powi(2))\n        .sqrt()\n    }\n}`,
            language: "rust",
        }),
    },
    {
        name: "SQL Query",
        category: "Code",
        description: "Complex SQL query with joins",
        content: JSON.stringify({
            code: `SELECT\n  u.name,\n  COUNT(o.id) AS total_orders,\n  SUM(o.amount) AS total_spent\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nWHERE u.active = true\nGROUP BY u.id, u.name\nHAVING COUNT(o.id) > 5\nORDER BY total_spent DESC\nLIMIT 10;`,
            language: "sql",
        }),
    },
]
