import type { Metadata } from "next"
import { BlogListPage } from "@/components/blog/BlogListPage"

export const metadata: Metadata = {
  title: "Blog — Guides & Tutorials for Online Developer Tools",
  description:
    "Read guides and tutorials for 83+ free online developer and creative tools. Learn how to use JSON formatters, regex testers, image converters, and more.",
  alternates: { canonical: "https://toolbox.kutuyazilim.org/blog" },
  openGraph: {
    title: "Blog — ToolBox by Kutu Yazilim",
    description:
      "Guides and tutorials for free online developer tools.",
    url: "https://toolbox.kutuyazilim.org/blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — ToolBox by Kutu Yazilim",
    description: "Guides and tutorials for free online developer tools.",
  },
}

export default function BlogPage() {
  return <BlogListPage />
}
