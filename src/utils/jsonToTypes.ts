export type JsonType =
  | { kind: "string" }
  | { kind: "number"; isInteger: boolean }
  | { kind: "boolean" }
  | { kind: "null" }
  | { kind: "array"; elementType: JsonType }
  | { kind: "object"; fields: JsonField[] }
  | { kind: "union"; types: JsonType[] }
  | { kind: "unknown" }

export type JsonField = {
  name: string
  type: JsonType
  optional: boolean
}

export function inferType(value: unknown): JsonType {
  if (value === null) return { kind: "null" }
  if (typeof value === "string") return { kind: "string" }
  if (typeof value === "boolean") return { kind: "boolean" }
  if (typeof value === "number")
    return { kind: "number", isInteger: Number.isInteger(value) }

  if (Array.isArray(value)) {
    if (value.length === 0) return { kind: "array", elementType: { kind: "unknown" } }
    const types = value.map(inferType)
    const merged = mergeTypes(types)
    return { kind: "array", elementType: merged }
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>
    const fields: JsonField[] = Object.keys(obj).map((key) => ({
      name: key,
      type: inferType(obj[key]),
      optional: false,
    }))
    return { kind: "object", fields }
  }

  return { kind: "unknown" }
}

function mergeTypes(types: JsonType[]): JsonType {
  if (types.length === 0) return { kind: "unknown" }
  if (types.length === 1) return types[0]

  // If all same kind, merge
  const kinds = new Set(types.map((t) => t.kind))
  if (kinds.size === 1) {
    const kind = types[0].kind
    if (kind === "object") {
      return mergeObjectTypes(types as Extract<JsonType, { kind: "object" }>[])
    }
    if (kind === "number") {
      const allInt = (types as Extract<JsonType, { kind: "number" }>[]).every(
        (t) => t.isInteger,
      )
      return { kind: "number", isInteger: allInt }
    }
    return types[0]
  }

  // If mix of null and something else, make it optional
  const nonNull = types.filter((t) => t.kind !== "null")
  if (nonNull.length === 1 && types.some((t) => t.kind === "null")) {
    return nonNull[0] // caller handles nullable at field level
  }

  return { kind: "union", types: dedupeTypes(types) }
}

function mergeObjectTypes(
  types: Extract<JsonType, { kind: "object" }>[],
): JsonType {
  const allKeys = new Set<string>()
  for (const t of types) {
    for (const f of t.fields) allKeys.add(f.name)
  }

  const fields: JsonField[] = [...allKeys].map((key) => {
    const fieldTypes: JsonType[] = []
    let presentCount = 0

    for (const t of types) {
      const field = t.fields.find((f) => f.name === key)
      if (field) {
        fieldTypes.push(field.type)
        presentCount++
      }
    }

    return {
      name: key,
      type: mergeTypes(fieldTypes),
      optional: presentCount < types.length,
    }
  })

  return { kind: "object", fields }
}

function dedupeTypes(types: JsonType[]): JsonType[] {
  const seen = new Set<string>()
  return types.filter((t) => {
    const key = t.kind
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^./, (c) => c.toUpperCase())
}
