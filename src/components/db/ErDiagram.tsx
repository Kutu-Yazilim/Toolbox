"use client"

import { useEffect, useCallback } from "react"
import {
    ReactFlow,
    Background,
    useNodesState,
    useEdgesState,
    useReactFlow,
    ReactFlowProvider,
    type Node,
    type Edge,
    MarkerType,
    Position,
    ConnectionLineType,
    BackgroundVariant,
    getNodesBounds,
    getViewportForBounds,
} from "@xyflow/react"
import { toPng } from "html-to-image"
import { ZoomInIcon, ZoomOutIcon, MaximizeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import "@xyflow/react/dist/style.css"
import type { Database } from "@/types/dbml"
import { TableNode } from "./TableNode"

const NODE_TYPES = {
    table: TableNode,
}

const FIT_VIEW_PADDING = 0.3
const MIN_ZOOM = 0.2
const MAX_ZOOM = 2
const EXPORT_ZOOM_MIN = 0.5
const EXPORT_ZOOM_MAX = 2
const EXPORT_ZOOM_PADDING = 0.1
const EXPORT_BOUNDS_PADDING = 100
const GRID_GAP = 16
const GRID_DOT_SIZE = 1
const LAYOUT_COL_SPACING = 350
const LAYOUT_ROW_SPACING = 350
const LAYOUT_OFFSET = 50
const MIN_COLS = 2
const EDGE_STROKE_WIDTH = 2
const MARKER_SIZE = 20
const MARKER_START_SIZE = 15
const EDGE_LABEL_FONT_SIZE = 11
const EDGE_LABEL_PADDING: [number, number] = [8, 5]
const EDGE_LABEL_BORDER_RADIUS = 6
const MANY_TO_ONE_COLOR = "#3b82f6"
const ONE_TO_ONE_COLOR = "#22c55e"

interface ErDiagramProps {
    database: Database | null
    onExportReady?: (exportFn: () => Promise<void>) => void
}

function generateNodesAndEdges(database: Database | null): { nodes: Node[]; edges: Edge[] } {
    if (!database || database.tables.length === 0) {
        return { nodes: [], edges: [] }
    }

    const cols = Math.max(MIN_COLS, Math.ceil(Math.sqrt(database.tables.length)))

    const nodes: Node[] = database.tables.map((table, index) => ({
        id: table.name,
        type: "table",
        position: {
            x: (index % cols) * LAYOUT_COL_SPACING + LAYOUT_OFFSET,
            y: Math.floor(index / cols) * LAYOUT_ROW_SPACING + LAYOUT_OFFSET,
        },
        data: {
            label: table.name,
            columns: table.columns,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
    }))

    const edges: Edge[] = database.refs.map((ref, index) => {
        const isMany = ref.type === "many-to-one"
        const color = isMany ? MANY_TO_ONE_COLOR : ONE_TO_ONE_COLOR

        return {
            id: `edge-${index}-${ref.from.table}-${ref.from.column}-${ref.to.table}-${ref.to.column}`,
            source: ref.from.table,
            target: ref.to.table,
            sourceHandle: ref.from.column,
            targetHandle: ref.to.column,
            type: "smoothstep",
            animated: false,
            style: { stroke: color, strokeWidth: EDGE_STROKE_WIDTH },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: MARKER_SIZE,
                height: MARKER_SIZE,
                color,
            },
            markerStart: isMany
                ? { type: MarkerType.Arrow, width: MARKER_START_SIZE, height: MARKER_START_SIZE, color }
                : undefined,
            label: `${ref.from.column} \u2192 ${ref.to.column}`,
            labelStyle: { fill: "#ffffff", fontSize: EDGE_LABEL_FONT_SIZE, fontWeight: 600 },
            labelBgStyle: { fill: color, fillOpacity: 0.95 },
            labelBgPadding: EDGE_LABEL_PADDING,
            labelBgBorderRadius: EDGE_LABEL_BORDER_RADIUS,
        }
    })

    return { nodes, edges }
}

function ErDiagramInner({ database, onExportReady }: ErDiagramProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
    const { getNodes, zoomIn, zoomOut, fitView } = useReactFlow()

    const exportToPng = useCallback(async () => {
        const nodesBounds = getNodesBounds(getNodes())
        const imageWidth = nodesBounds.width + EXPORT_BOUNDS_PADDING
        const imageHeight = nodesBounds.height + EXPORT_BOUNDS_PADDING
        const viewport = getViewportForBounds(
            nodesBounds,
            imageWidth,
            imageHeight,
            EXPORT_ZOOM_MIN,
            EXPORT_ZOOM_MAX,
            EXPORT_ZOOM_PADDING,
        )

        const flowElement = document.querySelector(".react-flow__viewport") as HTMLElement
        if (!flowElement) return

        try {
            const dataUrl = await toPng(flowElement, {
                backgroundColor: "#1a1a2e",
                width: imageWidth,
                height: imageHeight,
                style: {
                    width: `${imageWidth}px`,
                    height: `${imageHeight}px`,
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                },
            })

            const link = document.createElement("a")
            link.download = "er-diagram.png"
            link.href = dataUrl
            link.click()
        } catch (error) {
            console.error("Error exporting to PNG:", error)
        }
    }, [getNodes])

    useEffect(() => {
        if (onExportReady) {
            onExportReady(exportToPng)
        }
    }, [onExportReady, exportToPng])

    useEffect(() => {
        const { nodes: newNodes, edges: newEdges } = generateNodesAndEdges(database)
        setNodes(newNodes)
        setEdges(newEdges)
    }, [database, setNodes, setEdges])

    if (!database || database.tables.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                    <p className="text-lg mb-1">No tables</p>
                    <p className="text-sm">Enter valid DBML to see the ER diagram</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative h-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={NODE_TYPES}
                fitView
                fitViewOptions={{ padding: FIT_VIEW_PADDING }}
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
                connectionLineType={ConnectionLineType.SmoothStep}
                defaultEdgeOptions={{
                    type: "smoothstep",
                    style: { strokeWidth: EDGE_STROKE_WIDTH },
                }}
                proOptions={{ hideAttribution: true }}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={GRID_GAP}
                    size={GRID_DOT_SIZE}
                    color="hsl(var(--muted-foreground) / 0.3)"
                />
            </ReactFlow>

            {/* Zoom controls */}
            <div className="absolute bottom-3 left-3 flex flex-col gap-1 z-10">
                <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={() => zoomIn()}
                    title="Zoom in"
                    className="bg-card shadow-md"
                >
                    <ZoomInIcon className="h-3.5 w-3.5" />
                </Button>
                <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={() => zoomOut()}
                    title="Zoom out"
                    className="bg-card shadow-md"
                >
                    <ZoomOutIcon className="h-3.5 w-3.5" />
                </Button>
                <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={() => fitView({ padding: FIT_VIEW_PADDING })}
                    title="Fit to view"
                    className="bg-card shadow-md"
                >
                    <MaximizeIcon className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    )
}

export function ErDiagram(props: ErDiagramProps) {
    return (
        <ReactFlowProvider>
            <ErDiagramInner {...props} />
        </ReactFlowProvider>
    )
}
