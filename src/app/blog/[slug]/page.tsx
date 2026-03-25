import { BLOG_POSTS } from "@/data/blogPosts"
import { BlogPostClient } from "./client"

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }))
}

export default function BlogPostRoute({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return <BlogPostClient params={params} />
}
