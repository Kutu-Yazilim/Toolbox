import { Parser, ModelExporter } from "@dbml/core"
import type { Database } from "@/types/dbml"

type SqlDialect = "postgresql" | "mysql" | "sqlite"

const DIALECT_FORMAT_MAP: Record<SqlDialect, "postgres" | "mysql" | null> = {
    postgresql: "postgres",
    mysql: "mysql",
    sqlite: null,
}

export function exportToSql(dbml: string, dialect: SqlDialect): string {
    const format = DIALECT_FORMAT_MAP[dialect]

    if (format) {
        return exportViaDbmlCore(dbml, format)
    }

    return exportSqlite(dbml)
}

function exportViaDbmlCore(dbml: string, format: "postgres" | "mysql"): string {
    const parser = new Parser()
    const database = parser.parse(dbml, "dbmlv2")
    return ModelExporter.export(database, format)
}

function exportSqlite(dbml: string): string {
    const parser = new Parser()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed: any = parser.parse(dbml, "dbmlv2")
    const schema = parsed.schemas?.[0]

    if (!schema?.tables?.length) {
        return "-- No tables found"
    }

    const db = parseToDatabaseModel(schema)
    return generateSqliteDdl(db)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseToDatabaseModel(schema: any): Database {
    return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tables: schema.tables.map((table: any) => ({
            name: table.name,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            columns: (table.fields || []).map((field: any) => ({
                name: field.name,
                type: field.type?.type_name || field.type?.schemaName || String(field.type) || "TEXT",
                isPrimaryKey: field.pk || false,
                isUnique: field.unique || false,
                isNotNull: field.not_null || false,
                defaultValue: field.dbdefault?.value,
                note: typeof field.note === "string" ? field.note : field.note?.value,
            })),
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        refs: (schema.refs || []).map((ref: any) => ({
            from: {
                table: ref.endpoints?.[0]?.tableName || "",
                column: ref.endpoints?.[0]?.fieldNames?.[0] || "",
            },
            to: {
                table: ref.endpoints?.[1]?.tableName || "",
                column: ref.endpoints?.[1]?.fieldNames?.[0] || "",
            },
            type: ref.endpoints?.[0]?.relation === "*" ? "many-to-one" as const : "one-to-one" as const,
        })),
    }
}

interface SqliteColumn {
    name: string
    type: string
    isPrimaryKey: boolean
    isUnique: boolean
    isNotNull: boolean
    defaultValue?: string
}

function generateSqliteDdl(db: Database): string {
    const statements: string[] = []

    for (const table of db.tables) {
        const columnDefs = (table.columns as SqliteColumn[]).map((col) => {
            const parts = [col.name]
            const sqliteType = mapToSqliteType(col.type)
            parts.push(sqliteType)

            if (col.isPrimaryKey) {
                parts.push(sqliteType === "INTEGER" ? "PRIMARY KEY AUTOINCREMENT" : "PRIMARY KEY")
            }
            if (col.isNotNull && !col.isPrimaryKey) {
                parts.push("NOT NULL")
            }
            if (col.isUnique && !col.isPrimaryKey) {
                parts.push("UNIQUE")
            }
            if (col.defaultValue !== undefined) {
                parts.push(`DEFAULT ${col.defaultValue}`)
            }

            return `  ${parts.join(" ")}`
        })

        statements.push(`CREATE TABLE ${table.name} (\n${columnDefs.join(",\n")}\n);`)
    }

    for (const ref of db.refs) {
        const constraintName = `fk_${ref.from.table}_${ref.from.column}`
        statements.push(
            `ALTER TABLE ${ref.from.table} ADD CONSTRAINT ${constraintName} FOREIGN KEY (${ref.from.column}) REFERENCES ${ref.to.table} (${ref.to.column});`
        )
    }

    return statements.join("\n\n")
}

function mapToSqliteType(type: string): string {
    const upper = type.toUpperCase()

    if (upper.includes("INT")) return "INTEGER"
    if (upper.includes("CHAR") || upper.includes("TEXT") || upper.includes("VARCHAR")) return "TEXT"
    if (upper.includes("REAL") || upper.includes("FLOAT") || upper.includes("DOUBLE")) return "REAL"
    if (upper.includes("BLOB")) return "BLOB"
    if (upper.includes("BOOL")) return "INTEGER"
    if (upper.includes("DATE") || upper.includes("TIME") || upper.includes("TIMESTAMP")) return "TEXT"
    if (upper.includes("DECIMAL") || upper.includes("NUMERIC")) return "NUMERIC"

    return "TEXT"
}
