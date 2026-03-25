export type BlogPost = {
  slug: string
  toolId: string // matches tool.id from toolRegistry
  title: string
  description: string // meta description for SEO
  content: string // markdown content
  keywords: string[]
  publishedAt: string // ISO date
}

export const BLOG_POSTS: BlogPost[] = [
  // Will be populated with 83+ posts
]

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug)
}

export function getBlogPostByToolId(toolId: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.toolId === toolId)
}
