"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

type Tab = {
  id: string
  label: string
  href: string
}

export function TabLayout({
  tabs,
  activeTab,
  children,
}: {
  tabs: Tab[]
  activeTab: string
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 h-9 border-b border-border flex-shrink-0 bg-muted/10">
        {tabs.map(({ id, label, href }) => {
          const isActive = id === activeTab || pathname === href
          return (
            <Link
              key={id}
              href={href}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {label}
            </Link>
          )
        })}
      </div>

      <div className="flex-1 min-h-0">{children}</div>
    </div>
  )
}
