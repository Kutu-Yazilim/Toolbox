import type { TreeOptionsType } from "@/components/tree/TreeOptions"

export interface TreeNode {
  name: string
  children: TreeNode[]
  path: string
}

const BRANCH_STYLES = {
  unicode: {
    branch: "\u251C\u2500\u2500 ",
    lastBranch: "\u2514\u2500\u2500 ",
    vertical: "\u2502   ",
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

const COMMENT_PATTERN = /^\s*(\/\/|#)/

const FOLDER_ICON = "\uD83D\uDCC1"
const FILE_ICON = "\uD83D\uDCC4"

function stripCommentLines(input: string): string {
  return input
    .split("\n")
    .filter((line) => !COMMENT_PATTERN.test(line))
    .join("\n")
}

export function parseInput(input: string, options?: Pick<TreeOptionsType, "stripComments">): TreeNode[] {
  const processedInput = options?.stripComments ? stripCommentLines(input) : input
  const lines = processedInput.split("\n").filter((line) => line.trim())
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

function isDirectory(node: TreeNode): boolean {
  return node.children.length > 0 || !node.name.includes(".")
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

    const nodeIsDir = isDirectory(node)
    const displayName = options.fullPath ? node.path : node.name
    const suffix = options.trailingSlash && nodeIsDir ? "/" : ""
    const icon = options.showIcons ? (nodeIsDir ? `${FOLDER_ICON} ` : `${FILE_ICON} `) : ""

    result += `${prefix}${branch}${icon}${displayName}${suffix}\n`

    if (node.children.length > 0) {
      result += renderTree(node.children, options, childPrefix)
    }
  })

  return result
}

export function generateTree(input: string, options: TreeOptionsType): string {
  if (!input.trim()) return ""

  const nodes = parseInput(input, { stripComments: options.stripComments })
  if (nodes.length === 0) return ""

  const rootSymbol = options.rootSymbol || "."
  const rootIcon = options.showIcons ? `${FOLDER_ICON} ` : ""
  const treeBranches = renderTree(nodes, options)

  return `${rootIcon}${rootSymbol}\n${treeBranches}`
}

export function generateMarkdownTree(input: string, options: TreeOptionsType): string {
  const tree = generateTree(input, options)
  if (!tree) return ""
  return `\`\`\`\n${tree}\`\`\``
}
