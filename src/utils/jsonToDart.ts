import { inferType, toPascalCase, type JsonType } from "./jsonToTypes"

export function generateDart(json: unknown, rootName: string): string {
  const type = inferType(json)
  const classes: string[] = []
  resolveType(type, rootName, classes)
  return classes.join("\n\n")
}

function resolveType(type: JsonType, name: string, classes: string[]): string {
  switch (type.kind) {
    case "string":
      return "String"
    case "number":
      return type.isInteger ? "int" : "double"
    case "boolean":
      return "bool"
    case "null":
      return "dynamic"
    case "unknown":
      return "dynamic"
    case "union":
      return "dynamic"
    case "array": {
      const el = resolveType(type.elementType, name + "Item", classes)
      return `List<${el}>`
    }
    case "object": {
      const className = toPascalCase(name)
      const fields = type.fields
      const fieldDecls = fields
        .map((f) => {
          const t = resolveType(f.type, f.name, classes)
          const nullable = f.optional ? "?" : ""
          return `  final ${t}${nullable} ${dartFieldName(f.name)};`
        })
        .join("\n")

      const ctorParams = fields
        .map((f) => {
          const req = f.optional ? "" : "required "
          return `    ${req}this.${dartFieldName(f.name)},`
        })
        .join("\n")

      const fromJsonFields = fields
        .map((f) => {
          const t = resolveType(f.type, f.name, [])
          if (isComplexType(f.type)) {
            return `      ${dartFieldName(f.name)}: json['${f.name}'] as ${t},`
          }
          return `      ${dartFieldName(f.name)}: json['${f.name}'] as ${t},`
        })
        .join("\n")

      const toJsonFields = fields
        .map((f) => `      '${f.name}': ${dartFieldName(f.name)},`)
        .join("\n")

      classes.push(
        `class ${className} {\n${fieldDecls}\n\n  ${className}({\n${ctorParams}\n  });\n\n  factory ${className}.fromJson(Map<String, dynamic> json) {\n    return ${className}(\n${fromJsonFields}\n    );\n  }\n\n  Map<String, dynamic> toJson() {\n    return {\n${toJsonFields}\n    };\n  }\n}`,
      )
      return className
    }
  }
}

function isComplexType(type: JsonType): boolean {
  return type.kind === "object" || type.kind === "array"
}

function dartFieldName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
}
