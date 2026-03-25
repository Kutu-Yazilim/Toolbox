"use client"

import { use } from "react"
import { BlogPostPage } from "@/components/blog/BlogPostPage"

export function BlogPostClient({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  return <BlogPostPage slug={slug} />
}
