import { CATEGORIES } from "@/config/toolRegistry"
import { CategoryPageClient } from "./client"

export function generateStaticParams() {
  return CATEGORIES.map((cat) => ({
    category: cat.path.replace("/", ""),
  }))
}

export default function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  return <CategoryPageClient params={params} />
}
