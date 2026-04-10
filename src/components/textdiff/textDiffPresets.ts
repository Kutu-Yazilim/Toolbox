import { type Preset } from "@/components/shared/PresetsDrawer"

export const TEXT_DIFF_PRESETS: Preset[] = [
    {
        name: "JS to TS Migration",
        category: "Code",
        description: "JavaScript to TypeScript conversion",
        content: JSON.stringify({
            original: `function greet(name) {\n  console.log("Hello, " + name);\n  return name;\n}\n\nconst users = ["Alice", "Bob", "Charlie"];\nfor (let i = 0; i < users.length; i++) {\n  greet(users[i]);\n}`,
            modified: `function greet(name: string): string {\n  console.log(\`Hello, \${name}!\`);\n  return name.trim();\n}\n\nconst users: string[] = ["Alice", "Bob", "Charlie", "Diana"];\nfor (const user of users) {\n  greet(user);\n}`,
        }),
    },
    {
        name: "Config Change",
        category: "Config",
        description: "JSON configuration diff",
        content: JSON.stringify({
            original: `{\n  "port": 3000,\n  "host": "localhost",\n  "debug": true,\n  "database": "dev_db"\n}`,
            modified: `{\n  "port": 8080,\n  "host": "0.0.0.0",\n  "debug": false,\n  "database": "prod_db",\n  "ssl": true\n}`,
        }),
    },
    {
        name: "CSS Refactor",
        category: "Code",
        description: "CSS to modern CSS changes",
        content: JSON.stringify({
            original: `.container {\n  display: block;\n  width: 100%;\n  margin: 0 auto;\n  float: left;\n}\n\n.item {\n  display: inline-block;\n  width: 33.33%;\n}`,
            modified: `.container {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 1rem;\n  max-width: 1200px;\n  margin: 0 auto;\n}\n\n.item {\n  flex: 1 1 calc(33.33% - 1rem);\n}`,
        }),
    },
]
