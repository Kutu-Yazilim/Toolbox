"use client"

import type { Layer } from "@/types/shapemaker"
import { Button } from "@/components/ui/button"
import {
  PlusIcon,
  Trash2Icon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  UnlockIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

type Props = {
  layers: Layer[]
  activeLayerId: string
  activePathId: string | null
  selectedPathIds: string[]
  onSelectLayer: (id: string) => void
  onSelectPath: (id: string | null) => void
  onAddLayer: () => void
  onDeleteLayer: (id: string) => void
  onToggleLayerVisibility: (id: string) => void
  onToggleLayerLock: (id: string) => void
  onAddPath: (layerId: string) => void
  onDeletePath: (layerId: string, pathId: string) => void
  onTogglePathVisibility: (layerId: string, pathId: string) => void
  onTogglePathLock: (layerId: string, pathId: string) => void
  onDuplicatePath: (layerId: string, pathId: string) => void
  onRenameLayer: (id: string, name: string) => void
}

export function LayersPanel({
  layers,
  activeLayerId,
  activePathId,
  selectedPathIds,
  onSelectLayer,
  onSelectPath,
  onAddLayer,
  onDeleteLayer,
  onToggleLayerVisibility,
  onToggleLayerLock,
  onAddPath,
  onDeletePath,
  onTogglePathVisibility,
  onTogglePathLock,
  onDuplicatePath,
  onRenameLayer,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(layers.map((l) => l.id))
  )

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 h-9 border-b border-border flex-shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Layers
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {layers.length}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onAddLayer}
          title="Add layer"
        >
          <PlusIcon />
        </Button>
      </div>

      {/* Layer list */}
      <div className="flex-1 overflow-y-auto min-h-0 p-1.5">
        {layers.map((layer) => (
          <div key={layer.id} className="mb-0.5">
            {/* Layer header */}
            <div
              className={cn(
                "flex items-center gap-1 px-1.5 py-1 rounded-md text-sm cursor-pointer group",
                layer.id === activeLayerId
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted/50"
              )}
              onClick={() => {
                onSelectLayer(layer.id)
                onSelectPath(null)
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleExpand(layer.id)
                }}
                className="p-0.5 text-muted-foreground hover:text-foreground"
              >
                {expanded.has(layer.id) ? (
                  <ChevronDownIcon className="h-3 w-3" />
                ) : (
                  <ChevronRightIcon className="h-3 w-3" />
                )}
              </button>

              <input
                type="text"
                value={layer.name}
                onChange={(e) => onRenameLayer(layer.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-transparent text-xs font-medium outline-none min-w-0 px-1"
              />

              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleLayerVisibility(layer.id)
                  }}
                  className="p-0.5 text-muted-foreground hover:text-foreground"
                  title={layer.visible ? "Hide layer" : "Show layer"}
                >
                  {layer.visible ? (
                    <EyeIcon className="h-3 w-3" />
                  ) : (
                    <EyeOffIcon className="h-3 w-3" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleLayerLock(layer.id)
                  }}
                  className="p-0.5 text-muted-foreground hover:text-foreground"
                  title={layer.locked ? "Unlock layer" : "Lock layer"}
                >
                  {layer.locked ? (
                    <LockIcon className="h-3 w-3" />
                  ) : (
                    <UnlockIcon className="h-3 w-3" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddPath(layer.id)
                  }}
                  className="p-0.5 text-muted-foreground hover:text-foreground"
                  title="Add path"
                >
                  <PlusIcon className="h-3 w-3" />
                </button>
                {layers.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteLayer(layer.id)
                    }}
                    className="p-0.5 text-muted-foreground hover:text-destructive"
                    title="Delete layer"
                  >
                    <Trash2Icon className="h-3 w-3" />
                  </button>
                )}
              </div>

              {!layer.visible && (
                <EyeOffIcon className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
              )}
              {layer.locked && (
                <LockIcon className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
              )}
            </div>

            {/* Paths */}
            {expanded.has(layer.id) && (
              <div className="ml-4 mt-0.5">
                {layer.paths.map((path) => (
                  <div
                    key={path.id}
                    className={cn(
                      "flex items-center gap-1 px-1.5 py-1 rounded text-xs cursor-pointer group/path",
                      selectedPathIds.includes(path.id)
                        ? "bg-primary/10 text-foreground ring-1 ring-primary/30"
                        : "hover:bg-muted/50 text-muted-foreground",
                    )}
                    onClick={() => {
                      onSelectLayer(layer.id)
                      onSelectPath(path.id)
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-sm flex-shrink-0 border"
                      style={{
                        backgroundColor: path.paint.fillColor,
                        borderColor: path.paint.strokeColor,
                      }}
                    />
                    <span className="flex-1 truncate">{path.name}</span>

                    <div className="flex items-center gap-0.5 opacity-0 group-hover/path:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onTogglePathVisibility(layer.id, path.id)
                        }}
                        className="p-0.5 hover:text-foreground"
                        title={path.visible ? "Hide" : "Show"}
                      >
                        {path.visible ? (
                          <EyeIcon className="h-2.5 w-2.5" />
                        ) : (
                          <EyeOffIcon className="h-2.5 w-2.5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onTogglePathLock(layer.id, path.id)
                        }}
                        className="p-0.5 hover:text-foreground"
                      >
                        {path.locked ? (
                          <LockIcon className="h-2.5 w-2.5" />
                        ) : (
                          <UnlockIcon className="h-2.5 w-2.5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDuplicatePath(layer.id, path.id)
                        }}
                        className="p-0.5 hover:text-foreground"
                        title="Duplicate"
                      >
                        <CopyIcon className="h-2.5 w-2.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeletePath(layer.id, path.id)
                        }}
                        className="p-0.5 hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2Icon className="h-2.5 w-2.5" />
                      </button>
                    </div>

                    {!path.visible && (
                      <EyeOffIcon className="h-2.5 w-2.5 text-muted-foreground/40" />
                    )}
                  </div>
                ))}
                {layer.paths.length === 0 && (
                  <p className="text-xs text-muted-foreground/50 px-1.5 py-2">
                    No paths
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
