import { inferType, toPascalCase, type JsonType } from "./jsonToTypes"

export function generatePython(json: unknown, rootName: string): string {
  const type = inferType(json)
  const classes: string[] = ["from dataclasses import dataclass\nfrom typing import Optional, List, Any"]
  resolveType(type, rootName, classes)
  return classes.join("\n\n\n")
}

function resolveType(type: JsonType, name: string, classes: string[]): string {
  switch (type.kind) {
    case "string":
      return "str"
    case "number":
      return type.isInteger ? "int" : "float"
    case "boolean":
      return "bool"
    case "null":
      return "None"
    case "unknown":
      return "Any"
    case "union":
      return "Any"
    case "array": {
      const el = resolveType(type.elementType, name + "Item", classes)
      return `List[${el}]`
    }
    case "object": {
      const className = toPascalCase(name)
      const fields = type.fields
        .map((f) => {
          const t = resolveType(f.type, f.name, classes)
          if (f.optional) {
            return `    ${toSnakeCase(f.name)}: Optional[${t}] = None`
          }
          return `    ${toSnakeCase(f.name)}: ${t}`
        })
        .join("\n")

      classes.push(`@dataclass\nclass ${className}:\n${fields}`)
      return className
    }
  }
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, "_$1")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_/, "")
    .toLowerCase()
}
