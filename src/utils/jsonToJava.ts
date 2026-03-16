import { inferType, toPascalCase, type JsonType } from "./jsonToTypes"

export function generateJava(json: unknown, rootName: string): string {
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
      return "boolean"
    case "null":
      return "Object"
    case "unknown":
      return "Object"
    case "union":
      return "Object"
    case "array": {
      const el = resolveType(type.elementType, name + "Item", classes)
      return `List<${boxed(el)}>`
    }
    case "object": {
      const className = toPascalCase(name)
      const fieldDecls = type.fields
        .map((f) => {
          const t = resolveType(f.type, f.name, classes)
          return `    private ${t} ${f.name};`
        })
        .join("\n")

      const methods = type.fields
        .map((f) => {
          const t = resolveType(f.type, f.name, [])
          const getter = `    public ${t} get${toPascalCase(f.name)}() {\n        return ${f.name};\n    }`
          const setter = `    public void set${toPascalCase(f.name)}(${t} ${f.name}) {\n        this.${f.name} = ${f.name};\n    }`
          return `${getter}\n\n${setter}`
        })
        .join("\n\n")

      classes.push(`public class ${className} {\n${fieldDecls}\n\n${methods}\n}`)
      return className
    }
  }
}

function boxed(type: string): string {
  const boxMap: Record<string, string> = {
    int: "Integer",
    double: "Double",
    boolean: "Boolean",
  }
  return boxMap[type] ?? type
}
