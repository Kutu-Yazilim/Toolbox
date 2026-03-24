import { Suspense, useState, useEffect, useCallback } from "react"
import { Outlet, useLocation } from "react-router"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { MobileNav } from "@/components/layout/MobileNav"
import { PageMeta } from "@/components/common/PageMeta"
import { Breadcrumbs } from "@/components/common/Breadcrumbs"
import { CommandPalette } from "@/components/common/CommandPalette"
import { useRecentTools } from "@/hooks/useRecentTools"
import { TOOLS } from "@/config/toolRegistry"

export function RootLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [recentToolIds, addRecent] = useRecentTools()
  const location = useLocation()

  // Track recent tools on route change
  useEffect(() => {
    const tool = TOOLS.find((t) => location.pathname.startsWith(t.path))
    if (tool) addRecent(tool.id)
  }, [location.pathname, addRecent])

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
      <PageMeta />
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
          <Outlet />
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
