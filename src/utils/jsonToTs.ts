import { inferType, toPascalCase, type JsonType, type JsonField } from "./jsonToTypes"

export function generateTypeScript(json: unknown, rootName: string): string {
  const type = inferType(json)
  const interfaces: string[] = []
  resolveType(type, rootName, interfaces)
  return interfaces.join("\n\n")
}

function resolveType(
  type: JsonType,
  name: string,
  interfaces: string[],
): string {
  switch (type.kind) {
    case "string":
      return "string"
    case "number":
      return "number"
    case "boolean":
      return "boolean"
    case "null":
      return "null"
    case "unknown":
      return "unknown"
    case "union":
      return type.types.map((t) => resolveType(t, name, interfaces)).join(" | ")
    case "array": {
      const elType = resolveType(type.elementType, name + "Item", interfaces)
      return `${elType}[]`
    }
    case "object": {
      const interfaceName = toPascalCase(name)
      const lines = type.fields.map((f: JsonField) => {
        const fieldType = resolveType(f.type, f.name, interfaces)
        const opt = f.optional ? "?" : ""
        const nullable = hasNull(f.type) ? " | null" : ""
        return `  ${safeName(f.name)}${opt}: ${fieldType}${nullable};`
      })
      interfaces.push(`interface ${interfaceName} {\n${lines.join("\n")}\n}`)
      return interfaceName
    }
  }
}

function hasNull(type: JsonType): boolean {
  if (type.kind === "null") return true
  if (type.kind === "union") return type.types.some((t) => t.kind === "null")
  return false
}

function safeName(name: string): string {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) ? name : `"${name}"`
}
