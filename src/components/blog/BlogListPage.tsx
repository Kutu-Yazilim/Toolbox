"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { SearchIcon } from "lucide-react"
import { BLOG_POSTS } from "@/data/blogPosts"
import { TOOLS, CATEGORIES } from "@/config/toolRegistry"

export function BlogListPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredPosts = useMemo(() => {
    const q = searchQuery.toLowerCase()
    if (!q) return BLOG_POSTS
    return BLOG_POSTS.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    )
  }, [searchQuery])

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 md:px-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <h1 className="text-3xl font-bold text-foreground">ToolBox Blog</h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            Guides, tips, and tutorials for every tool in the box.
          </p>
          <div className="relative w-full max-w-md mt-2">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search blog posts..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Posts grid */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            {BLOG_POSTS.length === 0
              ? "Blog posts are coming soon. Stay tuned!"
              : "No posts match your search."}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => {
              const tool = TOOLS.find((t) => t.id === post.toolId)
              const category = tool
                ? CATEGORIES.find((c) => c.id === tool.categoryId)
                : undefined

              return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  {category && (
                    <span className="inline-block self-start rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary mb-2">
                      {category.label}
                    </span>
                  )}
                  <h2 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-3 flex-1">
                    {post.description}
                  </p>
                  <span className="mt-3 text-xs font-medium text-primary">
                    Read more
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
