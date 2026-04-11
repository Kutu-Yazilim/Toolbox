"use client"

import { useEffect, useMemo } from "react"
import type { Tool } from "@/types/board"

interface KeyboardParams {
  selectedIds: string[]
  editingId: string | null
  editingGroupId: string | null
  setTool: (tool: Tool) => void
  setSelectedIds: (ids: string[]) => void
  setEditingGroupId: (id: string | null) => void
  // Operations
  deleteSelected: () => void
  duplicateSelected: () => void
  copySelected: () => void
  cutSelected: () => void
  pasteClipboard: () => void
  selectAll: () => void
  undo: () => void
  redo: () => void
  commitText: () => void
  groupSelected: () => void
  ungroupSelected: () => void
  nudgeSelected: (dx: number, dy: number) => void
  bringToFront: () => void
  sendToBack: () => void
  bringForward: () => void
  sendBackward: () => void
  copyCanvasToClipboard: () => void
}

interface ShortcutInfo {
  key: string
  label: string
  category: string
}

interface KeyboardReturn {
  shortcuts: ShortcutInfo[]
}

export function useBoardKeyboard(params: KeyboardParams): KeyboardReturn {
  const {
    selectedIds,
    editingId,
    editingGroupId,
    setTool,
    setSelectedIds,
    setEditingGroupId,
    deleteSelected,
    duplicateSelected,
    copySelected,
    cutSelected,
    pasteClipboard,
    selectAll,
    undo,
    redo,
    commitText,
    groupSelected,
    ungroupSelected,
    nudgeSelected,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    copyCanvasToClipboard,
  } = params

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return

      // Tool shortcuts
      const toolMap: Record<string, Tool> = {
        v: "select",
        h: "hand",
        r: "rectangle",
        o: "ellipse",
        d: "diamond",
        l: "line",
        a: "arrow",
        p: "draw",
        t: "text",
        s: "sticky",
      }

      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const newTool = toolMap[e.key.toLowerCase()]
        if (newTool) {
          setTool(newTool)
          return
        }
      }

      // Delete
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length > 0) {
          e.preventDefault()
          deleteSelected()
        }
        return
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault()
        redo()
        return
      }

      // Cut
      if ((e.ctrlKey || e.metaKey) && e.key === "x") {
        e.preventDefault()
        cutSelected()
        return
      }

      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault()
        copySelected()
        return
      }

      // Paste
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault()
        pasteClipboard()
        return
      }

      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault()
        duplicateSelected()
        return
      }

      // Select All
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault()
        selectAll()
        return
      }

      // Copy canvas as PNG to clipboard
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
        e.preventDefault()
        copyCanvasToClipboard()
        return
      }

      // Group (Ctrl+G)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "g") {
        e.preventDefault()
        groupSelected()
        return
      }

      // Ungroup (Ctrl+Shift+G)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "G") {
        e.preventDefault()
        ungroupSelected()
        return
      }

      // Arrow keys: nudge
      if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      ) {
        if (selectedIds.length > 0) {
          e.preventDefault()
          const step = e.shiftKey ? 10 : 1
          const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0
          const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0
          nudgeSelected(dx, dy)
        }
        return
      }

      // Z-order: ] bring forward, [ send backward
      if (e.key === "]") {
        e.preventDefault()
        if (e.ctrlKey || e.metaKey) {
          bringToFront()
        } else {
          bringForward()
        }
        return
      }
      if (e.key === "[") {
        e.preventDefault()
        if (e.ctrlKey || e.metaKey) {
          sendToBack()
        } else {
          sendBackward()
        }
        return
      }

      // Escape
      if (e.key === "Escape") {
        if (editingGroupId) {
          setEditingGroupId(null)
        } else {
          setSelectedIds([])
          setTool("select")
        }
        if (editingId) commitText()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    selectedIds,
    editingId,
    editingGroupId,
    deleteSelected,
    duplicateSelected,
    copySelected,
    cutSelected,
    pasteClipboard,
    selectAll,
    undo,
    redo,
    commitText,
    groupSelected,
    ungroupSelected,
    nudgeSelected,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    copyCanvasToClipboard,
    setTool,
    setSelectedIds,
    setEditingGroupId,
  ])

  const shortcuts = useMemo<ShortcutInfo[]>(
    () => [
      // Tools
      { key: "V", label: "Select", category: "Tools" },
      { key: "H", label: "Hand", category: "Tools" },
      { key: "R", label: "Rectangle", category: "Tools" },
      { key: "O", label: "Ellipse", category: "Tools" },
      { key: "D", label: "Diamond", category: "Tools" },
      { key: "L", label: "Line", category: "Tools" },
      { key: "A", label: "Arrow", category: "Tools" },
      { key: "P", label: "Draw", category: "Tools" },
      { key: "T", label: "Text", category: "Tools" },
      { key: "S", label: "Sticky", category: "Tools" },
      // Edit
      { key: "mod+Z", label: "Undo", category: "Edit" },
      { key: "mod+Y", label: "Redo", category: "Edit" },
      { key: "mod+C", label: "Copy", category: "Edit" },
      { key: "mod+V", label: "Paste", category: "Edit" },
      { key: "mod+X", label: "Cut", category: "Edit" },
      { key: "mod+D", label: "Duplicate", category: "Edit" },
      { key: "Delete", label: "Delete", category: "Edit" },
      { key: "mod+A", label: "Select All", category: "Edit" },
      // Elements
      { key: "mod+G", label: "Group", category: "Elements" },
      { key: "mod+shift+G", label: "Ungroup", category: "Elements" },
      { key: "]", label: "Bring Forward", category: "Elements" },
      { key: "[", label: "Send Backward", category: "Elements" },
      { key: "mod+]", label: "Bring to Front", category: "Elements" },
      { key: "mod+[", label: "Send to Back", category: "Elements" },
      { key: "Arrows", label: "Nudge (Shift+Arrow for 10px)", category: "Elements" },
    ],
    []
  )

  return { shortcuts }
}
