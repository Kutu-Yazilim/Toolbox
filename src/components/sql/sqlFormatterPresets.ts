import { type Preset } from "@/components/shared/PresetsDrawer"

export const SQL_FORMATTER_PRESETS: Preset[] = [
    {
        name: "SELECT with JOIN",
        category: "Queries",
        description: "Multi-table join query with aggregation",
        content: `SELECT u.id, u.name, u.email, COUNT(o.id) AS order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.created_at > '2024-01-01' GROUP BY u.id, u.name, u.email HAVING COUNT(o.id) > 5 ORDER BY order_count DESC LIMIT 10;`,
    },
    {
        name: "Subquery",
        category: "Queries",
        description: "Query with correlated subquery",
        content: `SELECT e.name, e.salary, e.department FROM employees e WHERE e.salary > (SELECT AVG(salary) FROM employees WHERE department = e.department) ORDER BY e.department, e.salary DESC;`,
    },
    {
        name: "CREATE TABLE",
        category: "DDL",
        description: "Table creation with constraints",
        content: `CREATE TABLE users (id SERIAL PRIMARY KEY, username VARCHAR(50) NOT NULL UNIQUE, email VARCHAR(255) NOT NULL, password_hash VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT chk_email CHECK (email LIKE '%@%.%'));`,
    },
    {
        name: "INSERT with CTE",
        category: "DML",
        description: "Common Table Expression with insert",
        content: `WITH new_users AS (SELECT 'alice' AS username, 'alice@example.com' AS email UNION ALL SELECT 'bob', 'bob@example.com') INSERT INTO users (username, email) SELECT username, email FROM new_users WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = new_users.email);`,
    },
    {
        name: "Window Functions",
        category: "Queries",
        description: "Query using window functions",
        content: `SELECT name, department, salary, RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank, salary - LAG(salary) OVER (PARTITION BY department ORDER BY salary) AS salary_diff FROM employees WHERE active = true ORDER BY department, dept_rank;`,
    },
]
