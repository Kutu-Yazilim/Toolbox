"use client"

import { useState, useCallback, useMemo } from "react"
import {
  Square as SquareIcon,
  Circle as CircleIcon,
  Diamond as DiamondIcon,
  Type as TypeIcon,
  StickyNote as StickyNoteIcon,
  Image as ImageIcon,
  Pencil as PencilIcon,
  Minus as MinusIcon,
  ArrowRight as ArrowRightIcon,
  Folder as FolderIcon,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  ChevronsDownUp,
  Search,
} from "lucide-react"
import type { BoardElement, ElementType } from "@/types/board"

// ── Constants ──────────────────────────────────────────────────

const PANEL_WIDTH = 240
const NAME_MAX_LENGTH = 20
const INDENT_PER_LEVEL = 24 // px per nesting level

// ── Props ──────────────────────────────────────────────────────

interface LayersPanelProps {
  elements: BoardElement[]
  selectedIds: string[]
  onSelect: (ids: string[]) => void
  onReorder: (elementId: string, newIndex: number) => void
  onToggleVisible: (id: string) => void
  onToggleLock: (id: string) => void
  onRename: (id: string, name: string) => void
}

// ── Helpers ────────────────────────────────────────────────────

const TYPE_ICONS: Record<ElementType, React.ComponentType<{ className?: string }>> = {
  rectangle: SquareIcon,
  ellipse: CircleIcon,
  diamond: DiamondIcon,
  text: TypeIcon,
  sticky: StickyNoteIcon,
  image: ImageIcon,
  draw: PencilIcon,
  line: MinusIcon,
  arrow: ArrowRightIcon,
  group: FolderIcon,
}

function autoName(element: BoardElement): string {
  const prefix = element.type.charAt(0).toUpperCase() + element.type.slice(1)
  if ("text" in element && typeof element.text === "string" && element.text.length > 0) {
    const truncated = element.text.length > NAME_MAX_LENGTH
      ? element.text.slice(0, NAME_MAX_LENGTH) + "..."
      : element.text
    return `${prefix}: ${truncated}`
  }
  return prefix
}

function getDisplayName(element: BoardElement): string {
  return element.name ?? autoName(element)
}

function matchesSearch(element: BoardElement, query: string): boolean {
  const lower = query.toLowerCase()
  const name = getDisplayName(element).toLowerCase()
  if (name.includes(lower)) return true
  if ("text" in element && typeof element.text === "string") {
    return element.text.toLowerCase().includes(lower)
  }
  return false
}

// ── Layer Row ──────────────────────────────────────────────────

interface LayerRowProps {
  element: BoardElement
  isSelected: boolean
  depth: number
  isGroupExpanded: boolean
  onToggleExpand: (id: string) => void
  onClickRow: (id: string, e: React.MouseEvent) => void
  onDoubleClickName: (id: string) => void
  onToggleVisible: (id: string) => void
  onToggleLock: (id: string) => void
  editingId: string | null
  editingName: string
  onEditingNameChange: (name: string) => void
  onEditingConfirm: () => void
  onEditingCancel: () => void
}

function LayerRow({
  element,
  isSelected,
  depth,
  isGroupExpanded,
  onToggleExpand,
  onClickRow,
  onDoubleClickName,
  onToggleVisible,
  onToggleLock,
  editingId,
  editingName,
  onEditingNameChange,
  onEditingConfirm,
  onEditingCancel,
}: LayerRowProps) {
  const Icon = TYPE_ICONS[element.type]
  const isGroup = element.type === "group"
  const isEditing = editingId === element.id

  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 cursor-pointer group text-sm hover:bg-accent/50 ${
        isSelected ? "bg-accent" : ""
      } ${!element.visible ? "opacity-50" : ""}`}
      style={{ paddingLeft: depth * INDENT_PER_LEVEL + 8 }}
      onClick={(e) => onClickRow(element.id, e)}
    >
      {isGroup && (
        <button
          className="p-0 hover:bg-accent/30 rounded"
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand(element.id)
          }}
        >
          {isGroupExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
      )}
      {!isGroup && <span className="w-3" />}

      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

      {isEditing ? (
        <input
          className="flex-1 min-w-0 bg-background border border-border rounded px-1 py-0 text-xs outline-none"
          value={editingName}
          onChange={(e) => onEditingNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEditingConfirm()
            if (e.key === "Escape") onEditingCancel()
          }}
          onBlur={onEditingConfirm}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="flex-1 min-w-0 truncate text-xs"
          onDoubleClick={(e) => {
            e.stopPropagation()
            onDoubleClickName(element.id)
          }}
        >
          {getDisplayName(element)}
        </span>
      )}

      <button
        className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-accent/30"
        onClick={(e) => {
          e.stopPropagation()
          onToggleVisible(element.id)
        }}
      >
        {element.visible ? (
          <Eye className="h-3 w-3 text-muted-foreground" />
        ) : (
          <EyeOff className="h-3 w-3 text-muted-foreground" />
        )}
      </button>

      <button
        className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-accent/30"
        onClick={(e) => {
          e.stopPropagation()
          onToggleLock(element.id)
        }}
      >
        {element.locked ? (
          <Lock className="h-3 w-3 text-muted-foreground" />
        ) : (
          <Unlock className="h-3 w-3 text-muted-foreground" />
        )}
      </button>
    </div>
  )
}

// ── Layers Panel ───────────────────────────────────────────────

export default function LayersPanel({
  elements,
  selectedIds,
  onSelect,
  onReorder,
  onToggleVisible,
  onToggleLock,
  onRename,
}: LayersPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  // Suppress unused var lint — onReorder is part of the interface for future drag-and-drop
  void onReorder

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const elementMap = useMemo(() => {
    const map = new Map<string, BoardElement>()
    for (const el of elements) map.set(el.id, el)
    return map
  }, [elements])

  // Top-level elements (no groupId) in z-order (bottom of array = bottom of stack)
  const topLevelElements = useMemo(
    () => elements.filter((el) => !el.groupId),
    [elements]
  )

  const filteredHasMatch = useCallback(
    (el: BoardElement): boolean => {
      if (!searchQuery) return true
      if (matchesSearch(el, searchQuery)) return true
      if (el.type === "group") {
        return el.childIds.some((childId) => {
          const child = elementMap.get(childId)
          return child ? matchesSearch(child, searchQuery) : false
        })
      }
      return false
    },
    [searchQuery, elementMap]
  )

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleExpandAll = useCallback(() => {
    const groupIds = elements
      .filter((el) => el.type === "group")
      .map((el) => el.id)
    setExpandedGroups(new Set(groupIds))
  }, [elements])

  const handleCollapseAll = useCallback(() => {
    setExpandedGroups(new Set())
  }, [])

  const handleClickRow = useCallback(
    (id: string, e: React.MouseEvent) => {
      if (e.shiftKey) {
        // Shift+click: add to selection range
        onSelect([...selectedIds, id])
      } else if (e.metaKey || e.ctrlKey) {
        // Cmd/Ctrl+click: toggle
        if (selectedSet.has(id)) {
          onSelect(selectedIds.filter((sid) => sid !== id))
        } else {
          onSelect([...selectedIds, id])
        }
      } else {
        onSelect([id])
      }
    },
    [selectedIds, selectedSet, onSelect]
  )

  const handleDoubleClickName = useCallback(
    (id: string) => {
      const el = elementMap.get(id)
      if (!el) return
      setEditingId(id)
      setEditingName(getDisplayName(el))
    },
    [elementMap]
  )

  const handleEditingConfirm = useCallback(() => {
    if (editingId && editingName.trim()) {
      onRename(editingId, editingName.trim())
    }
    setEditingId(null)
    setEditingName("")
  }, [editingId, editingName, onRename])

  const handleEditingCancel = useCallback(() => {
    setEditingId(null)
    setEditingName("")
  }, [])

  function renderElement(el: BoardElement, depth: number): React.ReactNode {
    if (!filteredHasMatch(el)) return null

    const isGroup = el.type === "group"
    const isExpanded = expandedGroups.has(el.id)

    return (
      <div key={el.id}>
        <LayerRow
          element={el}
          isSelected={selectedSet.has(el.id)}
          depth={depth}
          isGroupExpanded={isExpanded}
          onToggleExpand={handleToggleExpand}
          onClickRow={handleClickRow}
          onDoubleClickName={handleDoubleClickName}
          onToggleVisible={onToggleVisible}
          onToggleLock={onToggleLock}
          editingId={editingId}
          editingName={editingName}
          onEditingNameChange={setEditingName}
          onEditingConfirm={handleEditingConfirm}
          onEditingCancel={handleEditingCancel}
        />
        {isGroup && isExpanded &&
          el.childIds
            .map((childId) => elementMap.get(childId))
            .filter((child): child is BoardElement => child != null)
            .map((child) => renderElement(child, depth + 1))}
      </div>
    )
  }

  return (
    <div
      className="flex flex-col h-full border-r bg-card"
      style={{ width: PANEL_WIDTH }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm font-medium">Layers</span>
        <div className="flex gap-1">
          <button
            className="p-1 rounded hover:bg-accent/50"
            onClick={handleExpandAll}
            title="Expand all"
          >
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            className="p-1 rounded hover:bg-accent/50"
            onClick={handleCollapseAll}
            title="Collapse all"
          >
            <ChevronsDownUp className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-1.5 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <input
            className="w-full bg-background border border-border rounded pl-6 pr-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
            placeholder="Search layers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Element list */}
      <div className="flex-1 overflow-y-auto">
        {topLevelElements.map((el) => renderElement(el, 0))}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t text-xs text-muted-foreground">
        {elements.length} element{elements.length !== 1 ? "s" : ""}
      </div>
    </div>
  )
}
