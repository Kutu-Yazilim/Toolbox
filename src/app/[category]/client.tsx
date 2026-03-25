"use client"

import { use } from "react"
import { CategoryLandingPage } from "@/components/common/CategoryLandingPage"

export function CategoryPageClient({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  // Consume the params promise (Next.js 15+ async params)
  use(params)
  return <CategoryLandingPage />
}
