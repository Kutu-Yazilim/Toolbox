"use client"

import { useRef } from "react"
import type {
  BoardElement,
  Camera,
  Tool,
  ElementStyle,
} from "@/types/board"
import { useCanvasRenderer } from "./useCanvasRenderer"
import { useCanvasInteraction } from "./useCanvasInteraction"
import { ContextMenu } from "./ContextMenu"

interface BoardCanvasProps {
  elements: BoardElement[]
  selectedIds: string[]
  camera: Camera
  tool: Tool
  gridEnabled: boolean
  gridSize: number
  defaultStyle: ElementStyle
  onElementsChange: (elements: BoardElement[]) => void
  onSelectionChange: (ids: string[]) => void
  onCameraChange: (camera: Camera) => void
  onToolChange: (tool: Tool) => void
  onEditText: (id: string) => void
  onCommitText: () => void
  onCut: () => void
  onCopy: () => void
  onPaste: () => void
  onDuplicate: () => void
  onDelete: () => void
  onBringToFront: () => void
  onBringForward: () => void
  onSendBackward: () => void
  onSendToBack: () => void
  onSelectAll: () => void
  onToggleLock: () => void
  editingGroupId: string | null
  onEditingGroupChange: (id: string | null) => void
}

export function BoardCanvas({
  elements,
  selectedIds,
  camera,
  tool,
  gridEnabled,
  gridSize,
  defaultStyle,
  onElementsChange,
  onSelectionChange,
  onCameraChange,
  onToolChange,
  onEditText,
  onCommitText,
  onCut,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onBringToFront,
  onBringForward,
  onSendBackward,
  onSendToBack,
  onSelectAll,
  onToggleLock,
  editingGroupId,
  onEditingGroupChange,
}: BoardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // ── Interaction Hook ───────────────────────────────────────────

  const {
    previewElement,
    selectionBox,
    hoveredElementId,
    activeConnectionPoint,
    smartGuides,
    cursor,
    handlers,
    contextMenuPosition,
    closeContextMenu,
  } = useCanvasInteraction({
    canvasRef,
    elements,
    selectedIds,
    camera,
    tool,
    gridEnabled,
    gridSize,
    defaultStyle,
    editingGroupId,
    onElementsChange,
    onSelectionChange,
    onCameraChange,
    onToolChange,
    onEditText,
    onCommitText,
    onEditingGroupChange,
  })

  // ── Renderer Hook ─────────────────────────────────────────────

  const { containerRef, canvasSize } = useCanvasRenderer({
    canvasRef,
    elements,
    camera,
    selectedIds,
    gridEnabled,
    gridSize,
    selectionBox,
    previewElement,
    hoveredElementId,
    activeConnectionPoint,
    smartGuides,
  })

  // ── Context Menu Sections ──────────────────────────────────────

  const selectedElement = selectedIds.length === 1 ? elements.find((el) => el.id === selectedIds[0]) : null
  const isLocked = selectedElement?.locked ?? false
  const hasSelection = selectedIds.length > 0

  const contextMenuSections = [
    {
      items: [
        { label: "Cut", shortcut: "Ctrl+X", disabled: !hasSelection, onClick: onCut },
        { label: "Copy", shortcut: "Ctrl+C", disabled: !hasSelection, onClick: onCopy },
        { label: "Paste", shortcut: "Ctrl+V", onClick: onPaste },
        { label: "Duplicate", shortcut: "Ctrl+D", disabled: !hasSelection, onClick: onDuplicate },
      ],
    },
    {
      items: [
        { label: "Bring to Front", disabled: !hasSelection, onClick: onBringToFront },
        { label: "Bring Forward", disabled: !hasSelection, onClick: onBringForward },
        { label: "Send Backward", disabled: !hasSelection, onClick: onSendBackward },
        { label: "Send to Back", disabled: !hasSelection, onClick: onSendToBack },
      ],
    },
    {
      items: [
        { label: isLocked ? "Unlock" : "Lock", disabled: !hasSelection, onClick: onToggleLock },
        { label: "Delete", disabled: !hasSelection, onClick: onDelete },
      ],
    },
    {
      items: [{ label: "Select All", shortcut: "Ctrl+A", onClick: onSelectAll }],
    },
  ]

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      onDragOver={handlers.onDragOver}
      onDrop={handlers.onDrop}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          cursor,
        }}
        onMouseDown={handlers.onMouseDown}
        onMouseMove={handlers.onMouseMove}
        onMouseUp={handlers.onMouseUp}
        onDoubleClick={handlers.onDoubleClick}
        onContextMenu={handlers.onContextMenu}
        onTouchStart={handlers.onTouchStart}
        onTouchMove={handlers.onTouchMove}
        onTouchEnd={handlers.onTouchEnd}
      />

      {/* Context Menu */}
      {contextMenuPosition && (
        <ContextMenu
          position={contextMenuPosition}
          sections={contextMenuSections}
          onClose={closeContextMenu}
        />
      )}
    </div>
  )
}
