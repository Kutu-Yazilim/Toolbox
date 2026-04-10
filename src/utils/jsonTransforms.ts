export function sortKeys(json: string): string {
    const parsed = JSON.parse(json)
    const sorted = sortKeysRecursive(parsed)
    return JSON.stringify(sorted)
}

function sortKeysRecursive(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(sortKeysRecursive)
    }
    if (value !== null && typeof value === "object") {
        const sorted: Record<string, unknown> = {}
        for (const key of Object.keys(value as Record<string, unknown>).sort()) {
            sorted[key] = sortKeysRecursive((value as Record<string, unknown>)[key])
        }
        return sorted
    }
    return value
}

export function removeNulls(json: string): string {
    const parsed = JSON.parse(json)
    const cleaned = removeNullsRecursive(parsed)
    return JSON.stringify(cleaned)
}

function removeNullsRecursive(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(removeNullsRecursive)
    }
    if (value !== null && typeof value === "object") {
        const result: Record<string, unknown> = {}
        for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
            if (val !== null) {
                result[key] = removeNullsRecursive(val)
            }
        }
        return result
    }
    return value
}

export function flattenJson(json: string, separator: string = "."): string {
    const parsed = JSON.parse(json)
    const result: Record<string, unknown> = {}
    flattenRecursive(parsed, "", separator, result)
    return JSON.stringify(result)
}

function flattenRecursive(
    value: unknown,
    prefix: string,
    separator: string,
    result: Record<string, unknown>,
): void {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
            const newKey = prefix ? `${prefix}${separator}${key}` : key
            flattenRecursive(val, newKey, separator, result)
        }
    } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            const newKey = prefix ? `${prefix}${separator}${i}` : `${i}`
            flattenRecursive(value[i], newKey, separator, result)
        }
    } else {
        result[prefix] = value
    }
}

export function fixTrailingCommas(json: string): string {
    return json.replace(/,\s*([}\]])/g, "$1")
}
