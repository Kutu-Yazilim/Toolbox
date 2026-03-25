"use client"

import { useMemo } from "react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react"
import { getBlogPostBySlug, BLOG_POSTS } from "@/data/blogPosts"
import { TOOLS, CATEGORIES } from "@/config/toolRegistry"

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold text-foreground mt-6 mb-3 pb-2 border-b border-border first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-semibold text-foreground mt-5 mb-2 pb-1.5 border-b border-border">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base font-semibold text-foreground mt-3 mb-1.5">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-sm text-foreground/90 leading-relaxed mb-3">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside text-sm text-foreground/90 mb-3 space-y-1 pl-2">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside text-sm text-foreground/90 mb-3 space-y-1 pl-2">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-sm leading-relaxed">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/40 pl-4 my-3 text-sm text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes("language-")
    if (isBlock) {
      return (
        <code className={`block text-xs font-mono ${className || ""}`}>
          {children}
        </code>
      )
    }
    return (
      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-foreground/90">
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="bg-muted rounded-lg p-4 my-3 overflow-x-auto text-xs">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border bg-muted px-3 py-1.5 text-left font-medium text-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-3 py-1.5 text-foreground/90">{children}</td>
  ),
  hr: () => <hr className="my-4 border-border" />,
}

export function BlogPostPage({ slug }: { slug: string }) {
  const post = slug ? getBlogPostBySlug(slug) : undefined
  const tool = post ? TOOLS.find((t) => t.id === post.toolId) : undefined
  const category = tool ? CATEGORIES.find((c) => c.id === tool.categoryId) : undefined

  const relatedPosts = useMemo(() => {
    if (!tool) return []
    return BLOG_POSTS.filter(
      (p) => p.slug !== slug && TOOLS.find((t) => t.id === p.toolId)?.categoryId === tool.categoryId,
    ).slice(0, 3)
  }, [slug, tool])

  if (!post) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">Post Not Found</h1>
        <p className="text-sm text-muted-foreground">
          The blog post you are looking for does not exist.
        </p>
        <Link
          href="/blog"
          className="text-sm font-medium text-primary hover:underline"
        >
          Back to Blog
        </Link>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 md:px-8">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back to Blog
        </Link>

        {/* Tool link bar */}
        {tool && (
          <div className="flex items-center gap-3 mb-4 rounded-lg border border-border bg-card p-3">
            <tool.icon className="size-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">
                {category?.label}
              </p>
              <p className="text-sm font-medium text-foreground truncate">
                {tool.label}
              </p>
            </div>
            <Link
              href={tool.path}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
            >
              Try this tool
              <ExternalLinkIcon className="size-3" />
            </Link>
          </div>
        )}

        {/* Article header */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {post.title}
          </h1>
          <p className="text-sm text-muted-foreground">{post.description}</p>
          <time
            dateTime={post.publishedAt}
            className="block mt-2 text-xs text-muted-foreground"
          >
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </header>

        {/* Content */}
        <article className="prose-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {post.content}
          </ReactMarkdown>
        </article>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-8 pt-6 border-t border-border">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">
              Related Posts
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/blog/${rp.slug}`}
                  className="group rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {rp.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {rp.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
