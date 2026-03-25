import { Link } from "react-router"
import { BookOpenIcon } from "lucide-react"
import { getBlogPostByToolId } from "@/data/blogPosts"

export function BlogGuideLink({ toolId }: { toolId: string }) {
  const post = getBlogPostByToolId(toolId)
  if (!post) return null

  return (
    <section className="border-t border-border/60 bg-card/50 px-4 py-4">
      <div className="mx-auto max-w-4xl">
        <Link
          to={`/blog/${post.slug}`}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:border-primary/30 hover:shadow-sm"
        >
          <BookOpenIcon className="size-4 text-primary" />
          Read the guide: {post.title}
        </Link>
      </div>
    </section>
  )
}
