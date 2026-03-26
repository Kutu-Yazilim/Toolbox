import type { MetadataRoute } from "next"
import { CATEGORIES, TOOLS } from "@/config/toolRegistry"
import { BLOG_POSTS } from "@/data/blogPosts"

const BASE_URL = "https://toolbox.kutuyazilim.org"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()

  const home: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ]

  const categories: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${BASE_URL}${cat.path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  const tools: MetadataRoute.Sitemap = TOOLS.map((tool) => ({
    url: `${BASE_URL}${tool.path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  const blogIndex: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ]

  const blogPosts: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.publishedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  return [...home, ...categories, ...tools, ...blogIndex, ...blogPosts]
}
