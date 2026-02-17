export interface OpenApiEndpoint {
    method: string
    path: string
    summary: string
    tag: string
    headers: { key: string; value: string }[]
    pathParams: { name: string; description: string }[]
    queryParams: { name: string; required: boolean; description: string }[]
    bodyExample: string | null
}

export interface ParsedOpenApiSpec {
    title: string
    version: string
    baseUrl: string
    endpoints: OpenApiEndpoint[]
    tags: string[]
}

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveRef(ref: string, root: any): any {
    if (!ref.startsWith("#/")) return null
    const parts = ref.slice(2).split("/")
    let current = root
    for (const part of parts) {
        if (current == null || typeof current !== "object") return null
        current = current[part]
    }
    return current ?? null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveSchema(schema: any, root: any, depth = 0): any {
    if (!schema || depth > 10) return schema
    if (schema.$ref) return resolveSchema(resolveRef(schema.$ref, root), root, depth + 1)
    return schema
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateExample(schema: any, root: any, depth = 0): unknown {
    if (!schema || depth > 8) return null

    const resolved = resolveSchema(schema, root, 0)
    if (!resolved) return null

    if (resolved.example !== undefined) return resolved.example

    switch (resolved.type) {
        case "object": {
            const obj: Record<string, unknown> = {}
            if (resolved.properties) {
                for (const [key, propSchema] of Object.entries(resolved.properties)) {
                    obj[key] = generateExample(propSchema, root, depth + 1)
                }
            }
            return obj
        }
        case "array": {
            const itemExample = resolved.items
                ? generateExample(resolved.items, root, depth + 1)
                : null
            return itemExample !== null ? [itemExample] : []
        }
        case "string":
            if (resolved.enum?.length) return resolved.enum[0]
            if (resolved.format === "date-time") return "2024-01-01T00:00:00Z"
            if (resolved.format === "date") return "2024-01-01"
            if (resolved.format === "email") return "user@example.com"
            if (resolved.format === "uri" || resolved.format === "url") return "https://example.com"
            if (resolved.format === "uuid") return "00000000-0000-0000-0000-000000000000"
            return "string"
        case "integer":
            if (resolved.enum?.length) return resolved.enum[0]
            return resolved.minimum ?? 0
        case "number":
            if (resolved.enum?.length) return resolved.enum[0]
            return resolved.minimum ?? 0.0
        case "boolean":
            return true
        default:
            // If allOf, merge properties
            if (resolved.allOf) {
                const merged: Record<string, unknown> = {}
                for (const sub of resolved.allOf) {
                    const subExample = generateExample(sub, root, depth + 1)
                    if (subExample && typeof subExample === "object" && !Array.isArray(subExample)) {
                        Object.assign(merged, subExample)
                    }
                }
                return Object.keys(merged).length > 0 ? merged : null
            }
            // If oneOf/anyOf, use first
            if (resolved.oneOf?.length) return generateExample(resolved.oneOf[0], root, depth + 1)
            if (resolved.anyOf?.length) return generateExample(resolved.anyOf[0], root, depth + 1)
            return null
    }
}

export function parseOpenApiSpec(json: unknown): ParsedOpenApiSpec {
    if (!json || typeof json !== "object") {
        throw new Error("Invalid input: expected a JSON object")
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const root = json as any

    if (!root.openapi && !root.swagger) {
        throw new Error("Not a valid OpenAPI spec: missing 'openapi' or 'swagger' field")
    }

    if (!root.paths || typeof root.paths !== "object") {
        throw new Error("Not a valid OpenAPI spec: missing 'paths' object")
    }

    const title = root.info?.title ?? "Untitled API"
    const version = root.info?.version ?? ""
    const baseUrl = root.servers?.[0]?.url ?? root.host
        ? `${root.schemes?.[0] ?? "https"}://${root.host}${root.basePath ?? ""}`
        : ""

    const endpoints: OpenApiEndpoint[] = []
    const tagSet = new Set<string>()

    for (const [path, pathItem] of Object.entries(root.paths)) {
        if (!pathItem || typeof pathItem !== "object") continue

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pathObj = pathItem as any
        // Path-level parameters apply to all operations
        const pathParams = Array.isArray(pathObj.parameters) ? pathObj.parameters : []

        for (const method of HTTP_METHODS) {
            const operation = pathObj[method]
            if (!operation || typeof operation !== "object") continue

            const tag = operation.tags?.[0] ?? "default"
            tagSet.add(tag)

            const summary = operation.summary || operation.operationId || `${method.toUpperCase()} ${path}`

            // Merge path-level and operation-level parameters
            const allParams = [
                ...pathParams,
                ...(Array.isArray(operation.parameters) ? operation.parameters : []),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ].map((p: any) => {
                if (p.$ref) return resolveRef(p.$ref, root) ?? p
                return p
            })

            const headerParams = allParams
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((p: any) => p.in === "header")
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((p: any) => ({
                    key: p.name,
                    value: p.example ?? p.schema?.example ?? "",
                }))

            const pathParamsList = allParams
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((p: any) => p.in === "path")
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((p: any) => ({
                    name: p.name,
                    description: p.description ?? "",
                }))

            const queryParamsList = allParams
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((p: any) => p.in === "query")
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((p: any) => ({
                    name: p.name,
                    required: !!p.required,
                    description: p.description ?? "",
                }))

            // Extract request body
            let bodyExample: string | null = null
            const requestBody = operation.requestBody
                ? (operation.requestBody.$ref
                    ? resolveRef(operation.requestBody.$ref, root)
                    : operation.requestBody)
                : null

            if (requestBody) {
                const jsonContent = requestBody.content?.["application/json"]
                if (jsonContent) {
                    if (jsonContent.example) {
                        bodyExample = JSON.stringify(jsonContent.example, null, 2)
                    } else if (jsonContent.schema) {
                        const example = generateExample(jsonContent.schema, root)
                        if (example !== null) {
                            bodyExample = JSON.stringify(example, null, 2)
                        }
                    }
                }
            }

            endpoints.push({
                method: method.toUpperCase(),
                path,
                summary,
                tag,
                headers: headerParams,
                pathParams: pathParamsList,
                queryParams: queryParamsList,
                bodyExample,
            })
        }
    }

    const tags = Array.from(tagSet).sort()

    return { title, version, baseUrl, endpoints, tags }
}
