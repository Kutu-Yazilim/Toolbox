import { Suspense } from "react"
import { Outlet } from "react-router"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { MobileNav } from "@/components/layout/MobileNav"
import { PageMeta } from "@/components/common/PageMeta"

export function RootLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <PageMeta />
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <MobileNav />
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
    </div>
  )
}
