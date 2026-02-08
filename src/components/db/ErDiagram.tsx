import { useEffect, useRef, useCallback } from "react"
import {
    ReactFlow,
    Background,
    Controls,
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
import "@xyflow/react/dist/style.css"
import type { Database } from "@/types/dbml"
import { TableNode } from "./TableNode"

const nodeTypes = {
    table: TableNode,
}

interface ErDiagramProps {
    database: Database | null
    onExportReady?: (exportFn: () => Promise<void>) => void
}

function generateNodesAndEdges(database: Database | null): { nodes: Node[]; edges: Edge[] } {
    if (!database || database.tables.length === 0) {
        return { nodes: [], edges: [] }
    }

    // Calculate layout - spread tables more for better visibility
    const tableCount = database.tables.length
    const cols = Math.max(2, Math.ceil(Math.sqrt(tableCount)))

    const nodes: Node[] = database.tables.map((table, index) => {
        const row = Math.floor(index / cols)
        const col = index % cols

        return {
            id: table.name,
            type: "table",
            position: { x: col * 350 + 50, y: row * 350 + 50 },
            data: {
                label: table.name,
                columns: table.columns,
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
        }
    })

    // Create edges with clear visual styling like DBeaver
    const edges: Edge[] = database.refs.map((ref, index) => {
        const isMany = ref.type === "many-to-one"

        return {
            id: `edge-${index}-${ref.from.table}-${ref.from.column}-${ref.to.table}-${ref.to.column}`,
            source: ref.from.table,
            target: ref.to.table,
            sourceHandle: ref.from.column,
            targetHandle: ref.to.column,
            type: "smoothstep",
            animated: false, // DBeaver-style: solid lines, not animated
            style: {
                stroke: isMany ? "#3b82f6" : "#22c55e", // Blue for many-to-one, green for one-to-one
                strokeWidth: 2,
            },
            // Arrow at the target (the referenced table)
            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
                color: isMany ? "#3b82f6" : "#22c55e",
            },
            // Diamond/circle at source for many relationships
            markerStart: isMany ? {
                type: MarkerType.Arrow,
                width: 15,
                height: 15,
                color: "#3b82f6",
            } : undefined,
            // Label showing relationship type and field names
            label: `${ref.from.column} → ${ref.to.column}`,
            labelStyle: {
                fill: "#ffffff",
                fontSize: 11,
                fontWeight: 600,
            },
            labelBgStyle: {
                fill: isMany ? "#3b82f6" : "#22c55e",
                fillOpacity: 0.95,
            },
            labelBgPadding: [8, 5] as [number, number],
            labelBgBorderRadius: 6,
        }
    })

    return { nodes, edges }
}

function ErDiagramInner({ database, onExportReady }: ErDiagramProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
    const { getNodes } = useReactFlow()

    // Export to PNG function
    const exportToPng = useCallback(async () => {
        const nodesBounds = getNodesBounds(getNodes())
        const imageWidth = nodesBounds.width + 100
        const imageHeight = nodesBounds.height + 100
        const viewport = getViewportForBounds(
            nodesBounds,
            imageWidth,
            imageHeight,
            0.5,
            2,
            0.1
        )

        const flowElement = document.querySelector('.react-flow__viewport') as HTMLElement
        if (!flowElement) return

        try {
            const dataUrl = await toPng(flowElement, {
                backgroundColor: '#1a1a2e',
                width: imageWidth,
                height: imageHeight,
                style: {
                    width: `${imageWidth}px`,
                    height: `${imageHeight}px`,
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                },
            })

            const link = document.createElement('a')
            link.download = 'er-diagram.png'
            link.href = dataUrl
            link.click()
        } catch (error) {
            console.error('Error exporting to PNG:', error)
        }
    }, [getNodes])

    // Pass the export function to parent
    useEffect(() => {
        if (onExportReady) {
            onExportReady(exportToPng)
        }
    }, [onExportReady, exportToPng])

    // Update nodes and edges when database changes
    useEffect(() => {
        const { nodes: newNodes, edges: newEdges } = generateNodesAndEdges(database)
        setNodes(newNodes)
        setEdges(newEdges)
    }, [database, setNodes, setEdges])

    if (!database || database.tables.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <p>Enter valid DBML to see the ER diagram</p>
                </div>
            </div>
        )
    }

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.2}
            maxZoom={2}
            connectionLineType={ConnectionLineType.SmoothStep}
            defaultEdgeOptions={{
                type: "smoothstep",
                style: { strokeWidth: 2 },
            }}
            proOptions={{ hideAttribution: true }}
        >
            <Background
                variant={BackgroundVariant.Dots}
                gap={16}
                size={1}
                color="hsl(var(--muted-foreground) / 0.3)"
            />
            <Controls
                className="bg-card border rounded-md shadow-md"
                showInteractive={false}
            />
        </ReactFlow>
    )
}

export function ErDiagram(props: ErDiagramProps) {
    return (
        <ReactFlowProvider>
            <ErDiagramInner {...props} />
        </ReactFlowProvider>
    )
}
