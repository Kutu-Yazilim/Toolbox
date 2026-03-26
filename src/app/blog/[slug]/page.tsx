import type { Metadata } from "next"
import { BLOG_POSTS } from "@/data/blogPosts"
import { TOOLS, CATEGORIES } from "@/config/toolRegistry"
import { BlogPostClient } from "./client"

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = BLOG_POSTS.find((p) => p.slug === slug)
  if (!post) return {}

  const tool = TOOLS.find((t) => t.id === post.toolId)
  const category = tool ? CATEGORIES.find((c) => c.id === tool.categoryId) : undefined

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: "Kutu Yazilim" }],
    alternates: { canonical: `https://toolbox.kutuyazilim.org/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://toolbox.kutuyazilim.org/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      authors: ["Kutu Yazilim"],
      section: category?.label,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  }
}

function BlogJsonLd({ slug }: { slug: string }) {
  const post = BLOG_POSTS.find((p) => p.slug === slug)
  if (!post) return null

  const tool = TOOLS.find((t) => t.id === post.toolId)
  const category = tool ? CATEGORIES.find((c) => c.id === tool.categoryId) : undefined
  const baseUrl = "https://toolbox.kutuyazilim.org"

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    author: {
      "@type": "Organization",
      name: "Kutu Yazilim",
      url: "https://kutuyazilim.org",
    },
    publisher: {
      "@type": "Organization",
      name: "Kutu Yazilim",
      url: "https://kutuyazilim.org",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/LogoOnlyCircularSVG.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${post.slug}`,
    },
    keywords: post.keywords.join(", "),
    articleSection: category?.label,
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ToolBox", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${baseUrl}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${baseUrl}/blog/${post.slug}` },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
    </>
  )
}

export default async function BlogPostRoute({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return (
    <>
      <BlogJsonLd slug={slug} />
      <BlogPostClient params={params} />
    </>
  )
}
