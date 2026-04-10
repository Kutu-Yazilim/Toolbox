import { type Preset } from "@/components/shared/PresetsDrawer"

export const BOARD_PRESETS: Preset[] = [
  {
    name: "Flowchart",
    category: "Diagrams",
    description: "Basic flowchart with decision nodes",
    content: JSON.stringify({ template: "flowchart" }),
  },
  {
    name: "Mind Map",
    category: "Diagrams",
    description: "Central topic with branches",
    content: JSON.stringify({ template: "mindmap" }),
  },
  {
    name: "Wireframe",
    category: "Design",
    description: "Simple mobile wireframe layout",
    content: JSON.stringify({ template: "wireframe" }),
  },
  {
    name: "Kanban Board",
    category: "Planning",
    description: "To-do, In Progress, Done columns",
    content: JSON.stringify({ template: "kanban" }),
  },
]
