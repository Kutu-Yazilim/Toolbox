"use client"

import { useState, useCallback } from "react"
import { FolderIcon, FileIcon, ChevronRightIcon } from "lucide-react"
import type { TreeNode } from "@/utils/treeGenerator"

interface VisualTreeViewProps {
    nodes: TreeNode[]
    rootSymbol: string
}

interface TreeNodeRowProps {
    node: TreeNode
    depth: number
}

const INDENT_PX = 20

function TreeNodeRow({ node, depth }: TreeNodeRowProps) {
    const [expanded, setExpanded] = useState(true)
    const hasChildren = node.children.length > 0
    const nodeIsDir = hasChildren || !node.name.includes(".")

    const handleToggle = useCallback(() => {
        if (hasChildren) {
            setExpanded((prev) => !prev)
        }
    }, [hasChildren])

    return (
        <div>
            <button
                onClick={handleToggle}
                className={`flex items-center gap-1.5 w-full text-left py-0.5 px-1 rounded text-sm font-mono transition-colors hover:bg-muted/50 ${
                    hasChildren ? "cursor-pointer" : "cursor-default"
                }`}
                style={{ paddingLeft: depth * INDENT_PX }}
                title={node.path}
            >
                {hasChildren ? (
                    <ChevronRightIcon
                        className={`h-3 w-3 text-muted-foreground flex-shrink-0 transition-transform ${
                            expanded ? "rotate-90" : ""
                        }`}
                    />
                ) : (
                    <span className="w-3 flex-shrink-0" />
                )}
                {nodeIsDir ? (
                    <FolderIcon className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                ) : (
                    <FileIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-foreground truncate">{node.name}</span>
            </button>
            {expanded && hasChildren && (
                <div>
                    {node.children.map((child, i) => (
                        <TreeNodeRow key={`${child.name}-${i}`} node={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    )
}

export function VisualTreeView({ nodes, rootSymbol }: VisualTreeViewProps) {
    if (nodes.length === 0) {
        return (
            <div className="p-4 text-sm text-muted-foreground">
                Your visual tree will appear here...
            </div>
        )
    }

    return (
        <div className="p-2 overflow-auto h-full">
            <div className="flex items-center gap-1.5 py-0.5 px-1 text-sm font-mono">
                <span className="w-3 flex-shrink-0" />
                <FolderIcon className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                <span className="text-foreground font-medium">{rootSymbol || "."}</span>
            </div>
            {nodes.map((node, i) => (
                <TreeNodeRow key={`${node.name}-${i}`} node={node} depth={1} />
            ))}
        </div>
    )
}
