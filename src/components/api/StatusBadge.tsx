"use client"

export function StatusBadge({ status }: { status: number }) {
    const color = status < 300
        ? "text-emerald-500 bg-emerald-500/10"
        : status < 400
            ? "text-blue-400 bg-blue-400/10"
            : status < 500
                ? "text-amber-400 bg-amber-400/10"
                : "text-destructive bg-destructive/10"

    return (
        <span className={`text-[11px] font-mono font-medium px-1.5 py-0.5 rounded ${color}`}>
            {status}
        </span>
    )
}
