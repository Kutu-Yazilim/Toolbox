import { useState, useCallback, useMemo } from "react"
import { Parser } from "@dbml/core"
import type { Database } from "@/types/dbml"

// Disable TypeScript strict checking for @dbml/core as it has incomplete types
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useDbmlParser() {
  const [database, setDatabase] = useState<Database | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Create a persistent parser instance
  const parser = useMemo(() => new Parser(), [])

  const parse = useCallback((dbml: string) => {
    if (!dbml.trim()) {
      setDatabase(null)
      setError(null)
      return
    }

    try {
      // Use the parser instance to parse DBML
      const parsed: any = parser.parse(dbml, "dbmlv2")
      
      // The parsed result has schemas array
      const schema = parsed.schemas?.[0]
      
      if (!schema || !schema.tables || schema.tables.length === 0) {
        setDatabase({ tables: [], refs: [] })
        setError(null)
        return
      }

      // IMPORTANT: refs are inside the schema, not at the top level!
      const schemaRefs = schema.refs || []

      // Convert to our Database type
      const db: Database = {
        tables: schema.tables.map((table: any) => ({
          name: table.name,
          columns: (table.fields || []).map((field: any) => ({
            name: field.name,
            type: field.type?.type_name || field.type?.schemaName || String(field.type) || "unknown",
            isPrimaryKey: field.pk || false,
            isUnique: field.unique || false,
            isNotNull: field.not_null || false,
            note: typeof field.note === "string" ? field.note : field.note?.value,
          })),
        })),
        refs: schemaRefs.map((ref: any) => ({
          from: {
            table: ref.endpoints?.[0]?.tableName || "",
            column: ref.endpoints?.[0]?.fieldNames?.[0] || "",
          },
          to: {
            table: ref.endpoints?.[1]?.tableName || "",
            column: ref.endpoints?.[1]?.fieldNames?.[0] || "",
          },
          // relation: '*' means many, '1' means one
          type: ref.endpoints?.[0]?.relation === "*" ? "many-to-one" : "one-to-one",
        })),
      }

      console.log("Parsed database:", { tables: db.tables.length, refs: db.refs.length })
      setDatabase(db)
      setError(null)
    } catch (e: any) {
      console.error("DBML Parse Error:", e)
      // Extract meaningful error message
      let message = "Failed to parse DBML"
      if (e?.message) {
        message = e.message
      } else if (e?.diags && Array.isArray(e.diags)) {
        message = e.diags.map((d: any) => d.message).join(", ")
      }
      setError(message)
      setDatabase(null)
    }
  }, [parser])

  return { database, error, parse }
}
