"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { MobileNav } from "@/components/layout/MobileNav"
import { Breadcrumbs } from "@/components/common/Breadcrumbs"
import { CommandPalette } from "@/components/common/CommandPalette"
import { useRecentTools } from "@/hooks/useRecentTools"
import { TOOLS } from "@/config/toolRegistry"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [recentToolIds, addRecent] = useRecentTools()
  const pathname = usePathname()

  // Track recent tools on route change
  useEffect(() => {
    const tool = TOOLS.find((t) => pathname.startsWith(t.path))
    if (tool) addRecent(tool.id)
  }, [pathname, addRecent])

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const closePalette = useCallback(() => setPaletteOpen(false), [])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <MobileNav />
        <Breadcrumbs />
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <div className="text-muted-foreground text-sm">Loading...</div>
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
      <CommandPalette
        isOpen={paletteOpen}
        onClose={closePalette}
        recentToolIds={recentToolIds}
        onSelect={addRecent}
      />
    </div>
  )
}
