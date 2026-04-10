"use client"

const GROUP_COLORS = [
    "text-blue-400 bg-blue-400/10",
    "text-emerald-400 bg-emerald-400/10",
    "text-purple-400 bg-purple-400/10",
    "text-orange-400 bg-orange-400/10",
    "text-pink-400 bg-pink-400/10",
    "text-cyan-400 bg-cyan-400/10",
    "text-yellow-400 bg-yellow-400/10",
    "text-red-400 bg-red-400/10",
] as const

export interface GroupRow {
    matchIndex: number
    groupIndex: number
    groupName: string | null
    value: string
    startIndex: number
}

interface GroupsTableProps {
    groups: GroupRow[]
}

export function GroupsTable({ groups }: GroupsTableProps) {
    if (groups.length === 0) {
        return (
            <div className="p-4 text-xs text-muted-foreground text-center">
                No capture groups found
            </div>
        )
    }

    return (
        <div className="overflow-auto h-full">
            <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card z-10">
                    <tr className="border-b border-border">
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Match</th>
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Group</th>
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Value</th>
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Index</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {groups.map((row, i) => {
                        const colorClass = GROUP_COLORS[row.groupIndex % GROUP_COLORS.length]
                        return (
                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                                <td className="px-3 py-1.5 text-muted-foreground">{row.matchIndex + 1}</td>
                                <td className="px-3 py-1.5">
                                    <span className={`font-mono px-1 py-0.5 rounded ${colorClass}`}>
                                        {row.groupName ?? `$${row.groupIndex}`}
                                    </span>
                                </td>
                                <td className="px-3 py-1.5 font-mono break-all">{row.value}</td>
                                <td className="px-3 py-1.5 text-muted-foreground">{row.startIndex}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

export { GROUP_COLORS }
