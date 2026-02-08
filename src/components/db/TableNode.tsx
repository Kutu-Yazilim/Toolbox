import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { KeyIcon, HashIcon } from "lucide-react"
import type { Column } from "@/types/dbml"

interface TableNodeData {
    label: string
    columns: Column[]
}

export const TableNode = memo(function TableNode({
    data,
}: NodeProps) {
    const tableData = data as TableNodeData

    return (
        <div className="bg-card border-2 border-primary rounded-lg shadow-xl min-w-[220px] overflow-hidden">
            {/* Table Header */}
            <div className="bg-primary text-primary-foreground px-4 py-2.5 font-bold text-sm tracking-wide">
                📋 {tableData.label}
            </div>

            {/* Columns */}
            <div className="divide-y divide-border bg-card">
                {tableData.columns.map((column) => (
                    <div
                        key={column.name}
                        className={`px-4 py-2 flex items-center justify-between text-xs relative group
                            ${column.isPrimaryKey ? 'bg-yellow-500/10' : 'hover:bg-muted/50'}`}
                    >
                        {/* Left Handle - Target (for incoming relationships) */}
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={column.name}
                            className="!w-3 !h-3 !bg-blue-500 !border-2 !border-blue-700 !-left-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ top: '50%' }}
                        />

                        {/* Column Info */}
                        <div className="flex items-center gap-2 flex-1">
                            {column.isPrimaryKey && (
                                <KeyIcon className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                            )}
                            {column.isUnique && !column.isPrimaryKey && (
                                <HashIcon className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                            )}
                            <span className={`${column.isPrimaryKey ? 'font-bold text-yellow-600 dark:text-yellow-400' : ''}`}>
                                {column.name}
                            </span>
                        </div>

                        {/* Column Type */}
                        <span className="text-muted-foreground ml-3 font-mono text-[10px] uppercase">
                            {column.type}
                        </span>

                        {/* Right Handle - Source (for outgoing relationships) */}
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={column.name}
                            className="!w-3 !h-3 !bg-green-500 !border-2 !border-green-700 !-right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ top: '50%' }}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
})
