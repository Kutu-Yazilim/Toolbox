import { inferType, toPascalCase, type JsonType } from "./jsonToTypes"

export function generateCsharp(json: unknown, rootName: string): string {
  const type = inferType(json)
  const classes: string[] = []
  resolveType(type, rootName, classes)
  return classes.join("\n\n")
}

function resolveType(type: JsonType, name: string, classes: string[]): string {
  switch (type.kind) {
    case "string":
      return "string"
    case "number":
      return type.isInteger ? "int" : "double"
    case "boolean":
      return "bool"
    case "null":
      return "object"
    case "unknown":
      return "object"
    case "union":
      return "object"
    case "array": {
      const el = resolveType(type.elementType, name + "Item", classes)
      return `List<${el}>`
    }
    case "object": {
      const className = toPascalCase(name)
      const props = type.fields
        .map((f) => {
          const t = resolveType(f.type, f.name, classes)
          const nullable = f.optional ? "?" : ""
          const propName = toPascalCase(f.name)
          return `    [JsonProperty("${f.name}")]\n    public ${t}${nullable} ${propName} { get; set; }`
        })
        .join("\n\n")

      classes.push(`public class ${className}\n{\n${props}\n}`)
      return className
    }
  }
}
