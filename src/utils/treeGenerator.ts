import type { TreeOptionsType } from "@/components/tree/TreeOptions"

interface TreeNode {
  name: string
  children: TreeNode[]
  path: string
}

const BRANCH_STYLES = {
  unicode: {
    branch: "├── ",
    lastBranch: "└── ",
    vertical: "│   ",
    empty: "    ",
  },
  ascii: {
    branch: "+-- ",
    lastBranch: "+-- ",
    vertical: "|   ",
    empty: "    ",
  },
  minimal: {
    branch: "- ",
    lastBranch: "- ",
    vertical: "  ",
    empty: "  ",
  },
}

function parseInput(input: string): TreeNode[] {
  const lines = input.split("\n").filter((line) => line.trim())
  const root: TreeNode = { name: "", children: [], path: "" }
  const stack: { node: TreeNode; indent: number }[] = [{ node: root, indent: -1 }]

  for (const line of lines) {
    const trimmedLine = line.trimStart()
    const indent = line.length - trimmedLine.length
    const name = trimmedLine.trim()

    if (!name) continue

    // Pop stack until we find a parent with less indentation
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop()
    }

    const parent = stack[stack.length - 1].node
    const path = parent.path ? `${parent.path}/${name}` : name
    const newNode: TreeNode = { name, children: [], path }
    parent.children.push(newNode)
    stack.push({ node: newNode, indent })
  }

  return root.children
}

function renderTree(
  nodes: TreeNode[],
  options: TreeOptionsType,
  prefix: string = ""
): string {
  const style = BRANCH_STYLES[options.branchStyle]
  let result = ""

  nodes.forEach((node, index) => {
    const isLast = index === nodes.length - 1
    const branch = isLast ? style.lastBranch : style.branch
    const childPrefix = prefix + (isLast ? style.empty : style.vertical)

    // Determine if this is a directory (has children or no file extension)
    const isDirectory = node.children.length > 0 || !node.name.includes(".")
    const displayName = options.fullPath ? node.path : node.name
    const suffix = options.trailingSlash && isDirectory ? "/" : ""

    result += `${prefix}${branch}${displayName}${suffix}\n`

    if (node.children.length > 0) {
      result += renderTree(node.children, options, childPrefix)
    }
  })

  return result
}

export function generateTree(input: string, options: TreeOptionsType): string {
  if (!input.trim()) return ""

  const nodes = parseInput(input)
  if (nodes.length === 0) return ""

  const rootSymbol = options.rootSymbol || "."
  const treeBranches = renderTree(nodes, options)

  return `${rootSymbol}\n${treeBranches}`
}
