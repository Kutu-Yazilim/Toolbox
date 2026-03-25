"use client"

import Link from "next/link"
import { HomeIcon, SearchIcon } from "lucide-react"
import { TOOLS } from "@/config/toolRegistry"

const SUGGESTED_TOOLS = TOOLS.slice(0, 6)

export function NotFoundPage() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="flex max-w-lg flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <SearchIcon className="size-12 text-muted-foreground" />
          <h1 className="text-4xl font-bold">404</h1>
          <p className="text-lg text-muted-foreground">
            Page not found. The tool you are looking for does not exist.
          </p>
        </div>

        <div className="w-full space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Try one of these tools instead:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SUGGESTED_TOOLS.map((tool) => (
              <Link
                key={tool.id}
                href={tool.path}
                className="group flex items-center gap-2 rounded-lg border border-border/60 bg-card p-3 text-left transition-all hover:border-primary/30 hover:shadow-md"
              >
                <tool.icon className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                <span className="text-sm font-medium">{tool.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <HomeIcon className="size-4" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}
