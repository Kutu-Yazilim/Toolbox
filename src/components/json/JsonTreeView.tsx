"use client"

import { useState, useCallback, useMemo } from "react"
import { ChevronRightIcon, ChevronDownIcon } from "lucide-react"

const INITIAL_EXPAND_DEPTH = 2

interface JsonTreeViewProps {
    json: string
    isValid: boolean
    selectedPath: string | null
    onSelectPath: (path: string) => void
}

type JsonValueType = "string" | "number" | "boolean" | "null" | "array" | "object"

function getValueType(value: unknown): JsonValueType {
    if (value === null) return "null"
    if (Array.isArray(value)) return "array"
    return typeof value as JsonValueType
}

const TYPE_COLOR_MAP: Record<JsonValueType, string> = {
    string: "text-emerald-500",
    number: "text-orange-400",
    boolean: "text-blue-400",
    null: "text-muted-foreground",
    array: "text-purple-400",
    object: "text-yellow-400",
}

function formatValue(value: unknown, type: JsonValueType): string {
    if (type === "string") return `"${value}"`
    if (type === "null") return "null"
    return String(value)
}

interface TreeNodeProps {
    keyName: string | number | null
    value: unknown
    path: string
    depth: number
    selectedPath: string | null
    onSelectPath: (path: string) => void
}

function TreeNode({ keyName, value, path, depth, selectedPath, onSelectPath }: TreeNodeProps) {
    const [expanded, setExpanded] = useState(depth < INITIAL_EXPAND_DEPTH)
    const valueType = getValueType(value)
    const isExpandable = valueType === "object" || valueType === "array"
    const isSelected = path === selectedPath

    const toggleExpanded = useCallback(() => {
        setExpanded(prev => !prev)
    }, [])

    const handleSelect = useCallback(() => {
        onSelectPath(path)
    }, [path, onSelectPath])

    const childEntries = useMemo(() => {
        if (!isExpandable || !expanded) return []
        if (Array.isArray(value)) {
            return value.map((item, i) => ({
                key: i,
                value: item,
                path: `${path}[${i}]`,
            }))
        }
        return Object.entries(value as Record<string, unknown>).map(([k, v]) => ({
            key: k,
            value: v,
            path: `${path}.${k}`,
        }))
    }, [value, isExpandable, expanded, path])

    const countLabel = useMemo(() => {
        if (valueType === "array") return `[${(value as unknown[]).length}]`
        if (valueType === "object") return `{${Object.keys(value as Record<string, unknown>).length}}`
        return null
    }, [value, valueType])

    return (
        <div className="select-none">
            <div
                className={`flex items-center gap-1 py-0.5 px-1 rounded-sm cursor-pointer hover:bg-muted/50 transition-colors ${
                    isSelected ? "bg-muted" : ""
                }`}
                style={{ paddingLeft: `${depth * 16 + 4}px` }}
                onClick={handleSelect}
            >
                {isExpandable ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleExpanded()
                        }}
                        className="flex-shrink-0 p-0 hover:text-foreground text-muted-foreground"
                    >
                        {expanded ? (
                            <ChevronDownIcon className="h-3 w-3" />
                        ) : (
                            <ChevronRightIcon className="h-3 w-3" />
                        )}
                    </button>
                ) : (
                    <span className="w-3 flex-shrink-0" />
                )}

                {keyName !== null && (
                    <span className="text-foreground text-xs font-medium">
                        {typeof keyName === "number" ? keyName : `"${keyName}"`}
                        <span className="text-muted-foreground">: </span>
                    </span>
                )}

                {isExpandable ? (
                    <span className={`text-xs ${TYPE_COLOR_MAP[valueType]}`}>{countLabel}</span>
                ) : (
                    <span className={`text-xs ${TYPE_COLOR_MAP[valueType]}`}>
                        {formatValue(value, valueType)}
                    </span>
                )}
            </div>

            {expanded &&
                childEntries.map((entry) => (
                    <TreeNode
                        key={entry.key}
                        keyName={entry.key}
                        value={entry.value}
                        path={entry.path}
                        depth={depth + 1}
                        selectedPath={selectedPath}
                        onSelectPath={onSelectPath}
                    />
                ))}
        </div>
    )
}

export function JsonTreeView({ json, isValid, selectedPath, onSelectPath }: JsonTreeViewProps) {
    const parsed = useMemo(() => {
        if (!isValid || !json.trim()) return undefined
        try {
            return JSON.parse(json)
        } catch {
            return undefined
        }
    }, [json, isValid])

    if (parsed === undefined) {
        return (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground p-4">
                {json.trim() ? "Invalid JSON" : "Enter JSON to see the tree view"}
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-auto p-2 text-xs font-mono">
            <TreeNode
                keyName={null}
                value={parsed}
                path="$"
                depth={0}
                selectedPath={selectedPath}
                onSelectPath={onSelectPath}
            />
        </div>
    )
}
