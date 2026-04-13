import { type Preset } from "@/components/shared/PresetsDrawer"
import type { Layer, ShapePath, PathSegment, PaintStyle } from "@/types/shapemaker"
import { DEFAULT_PAINT, DEFAULT_TRANSFORM } from "@/types/shapemaker"
import { generateRegularPolygon, generateStar, generatePresetShape } from "@/utils/shapemakerPolygon"

function makeLayer(name: string, paths: ShapePath[]): Layer {
  return {
    id: `preset_layer_${name}`,
    name,
    paths,
    visible: true,
    locked: false,
  }
}

function makePath(name: string, segments: PathSegment[], paint?: Partial<PaintStyle>): ShapePath {
  return {
    id: `preset_path_${name}`,
    name,
    segments,
    closed: true,
    paint: { ...DEFAULT_PAINT, ...paint },
    visible: true,
    locked: false,
    transform: { ...DEFAULT_TRANSFORM },
  }
}

const CX = 200
const CY = 200
const SIZE = 160

// 1. Star (5-point star)
const starSegments = generateStar(5, CX, CY, SIZE / 2, SIZE * 0.38)
const starLayers: Layer[] = [
  makeLayer("Star", [makePath("Star", starSegments, { fillColor: "#FFD700" })]),
]

// 2. Heart (hand-defined cubic bezier)
const heartSegments: PathSegment[] = [
  { type: "moveTo", point: { x: CX, y: CY + 60 } },
  { type: "cubicTo", controlPoint1: { x: CX + 80, y: CY - 10 }, controlPoint2: { x: CX + 80, y: CY - 70 }, endPoint: { x: CX, y: CY - 30 } },
  { type: "cubicTo", controlPoint1: { x: CX - 80, y: CY - 70 }, controlPoint2: { x: CX - 80, y: CY - 10 }, endPoint: { x: CX, y: CY + 60 } },
  { type: "close" },
]
const heartLayers: Layer[] = [
  makeLayer("Heart", [makePath("Heart", heartSegments, { fillColor: "#E91E63" })]),
]

// 3. Arrow
const arrowSegments = generatePresetShape("arrow", CX, CY, SIZE)
const arrowLayers: Layer[] = [
  makeLayer("Arrow", [makePath("Arrow", arrowSegments, { fillColor: "#4CAF50" })]),
]

// 4. Rounded Rectangle (approximated with lines)
const rrx = CX - 70
const rry = CY - 50
const rrw = 140
const rrh = 100
const rrr = 15
const roundedRectSegments: PathSegment[] = [
  { type: "moveTo", point: { x: rrx + rrr, y: rry } },
  { type: "lineTo", point: { x: rrx + rrw - rrr, y: rry } },
  { type: "arcToPoint", endPoint: { x: rrx + rrw, y: rry + rrr }, radius: { x: rrr, y: rrr }, rotation: 0, largeArc: false, clockwise: true },
  { type: "lineTo", point: { x: rrx + rrw, y: rry + rrh - rrr } },
  { type: "arcToPoint", endPoint: { x: rrx + rrw - rrr, y: rry + rrh }, radius: { x: rrr, y: rrr }, rotation: 0, largeArc: false, clockwise: true },
  { type: "lineTo", point: { x: rrx + rrr, y: rry + rrh } },
  { type: "arcToPoint", endPoint: { x: rrx, y: rry + rrh - rrr }, radius: { x: rrr, y: rrr }, rotation: 0, largeArc: false, clockwise: true },
  { type: "lineTo", point: { x: rrx, y: rry + rrr } },
  { type: "arcToPoint", endPoint: { x: rrx + rrr, y: rry }, radius: { x: rrr, y: rrr }, rotation: 0, largeArc: false, clockwise: true },
  { type: "close" },
]
const roundedRectLayers: Layer[] = [
  makeLayer("Rounded Rect", [makePath("Rounded Rectangle", roundedRectSegments, { fillColor: "#2196F3" })]),
]

// 5. Circle (4 cubic beziers)
const cr = SIZE / 2
const ck = cr * 0.5522847498
const circleSegments: PathSegment[] = [
  { type: "moveTo", point: { x: CX, y: CY - cr } },
  { type: "cubicTo", controlPoint1: { x: CX + ck, y: CY - cr }, controlPoint2: { x: CX + cr, y: CY - ck }, endPoint: { x: CX + cr, y: CY } },
  { type: "cubicTo", controlPoint1: { x: CX + cr, y: CY + ck }, controlPoint2: { x: CX + ck, y: CY + cr }, endPoint: { x: CX, y: CY + cr } },
  { type: "cubicTo", controlPoint1: { x: CX - ck, y: CY + cr }, controlPoint2: { x: CX - cr, y: CY + ck }, endPoint: { x: CX - cr, y: CY } },
  { type: "cubicTo", controlPoint1: { x: CX - cr, y: CY - ck }, controlPoint2: { x: CX - ck, y: CY - cr }, endPoint: { x: CX, y: CY - cr } },
  { type: "close" },
]
const circleLayers: Layer[] = [
  makeLayer("Circle", [makePath("Circle", circleSegments, { fillColor: "#FF9800" })]),
]

// 6. Diamond (4 lines rotated 45 degrees)
const dh = SIZE / 2
const diamondSegments: PathSegment[] = [
  { type: "moveTo", point: { x: CX, y: CY - dh } },
  { type: "lineTo", point: { x: CX + dh, y: CY } },
  { type: "lineTo", point: { x: CX, y: CY + dh } },
  { type: "lineTo", point: { x: CX - dh, y: CY } },
  { type: "close" },
]
const diamondLayers: Layer[] = [
  makeLayer("Diamond", [makePath("Diamond", diamondSegments, { fillColor: "#9C27B0" })]),
]

// 7. Speech Bubble (rounded rect + triangle tail)
const sbx = CX - 70
const sby = CY - 50
const sbw = 140
const sbh = 80
const sbr = 12
const speechBubbleSegments: PathSegment[] = [
  { type: "moveTo", point: { x: sbx + sbr, y: sby } },
  { type: "lineTo", point: { x: sbx + sbw - sbr, y: sby } },
  { type: "arcToPoint", endPoint: { x: sbx + sbw, y: sby + sbr }, radius: { x: sbr, y: sbr }, rotation: 0, largeArc: false, clockwise: true },
  { type: "lineTo", point: { x: sbx + sbw, y: sby + sbh - sbr } },
  { type: "arcToPoint", endPoint: { x: sbx + sbw - sbr, y: sby + sbh }, radius: { x: sbr, y: sbr }, rotation: 0, largeArc: false, clockwise: true },
  // Tail
  { type: "lineTo", point: { x: sbx + 50, y: sby + sbh } },
  { type: "lineTo", point: { x: sbx + 30, y: sby + sbh + 30 } },
  { type: "lineTo", point: { x: sbx + 30, y: sby + sbh } },
  { type: "lineTo", point: { x: sbx + sbr, y: sby + sbh } },
  { type: "arcToPoint", endPoint: { x: sbx, y: sby + sbh - sbr }, radius: { x: sbr, y: sbr }, rotation: 0, largeArc: false, clockwise: true },
  { type: "lineTo", point: { x: sbx, y: sby + sbr } },
  { type: "arcToPoint", endPoint: { x: sbx + sbr, y: sby }, radius: { x: sbr, y: sbr }, rotation: 0, largeArc: false, clockwise: true },
  { type: "close" },
]
const speechBubbleLayers: Layer[] = [
  makeLayer("Speech Bubble", [makePath("Speech Bubble", speechBubbleSegments, { fillColor: "#03A9F4" })]),
]

// 8. Checkmark (2 line segments)
const checkmarkSegments: PathSegment[] = [
  { type: "moveTo", point: { x: CX - 50, y: CY } },
  { type: "lineTo", point: { x: CX - 15, y: CY + 40 } },
  { type: "lineTo", point: { x: CX + 50, y: CY - 40 } },
]
const checkmarkLayers: Layer[] = [
  makeLayer("Checkmark", [
    makePath("Checkmark", checkmarkSegments, {
      fillColor: "#4CAF50",
      paintingStyle: "stroke",
      strokeColor: "#4CAF50",
      strokeWidth: 8,
      strokeCap: "round",
      strokeJoin: "round",
    }),
  ]),
]

// 9. Hexagon (via generateRegularPolygon(6))
const hexSegments = generateRegularPolygon(6, CX, CY, SIZE / 2)
const hexLayers: Layer[] = [
  makeLayer("Hexagon", [makePath("Hexagon", hexSegments, { fillColor: "#607D8B" })]),
]

// 10. Cross (via generatePresetShape("cross"))
const crossSegments = generatePresetShape("cross", CX, CY, SIZE)
const crossLayers: Layer[] = [
  makeLayer("Cross", [makePath("Cross", crossSegments, { fillColor: "#F44336" })]),
]

export const SHAPEMAKER_PRESETS: Preset[] = [
  {
    name: "Star",
    category: "Basic",
    description: "Five-pointed star shape",
    content: JSON.stringify(starLayers),
  },
  {
    name: "Heart",
    category: "Symbols",
    description: "Heart shape using cubic bezier curves",
    content: JSON.stringify(heartLayers),
  },
  {
    name: "Arrow",
    category: "Symbols",
    description: "Right-pointing arrow",
    content: JSON.stringify(arrowLayers),
  },
  {
    name: "Rounded Rectangle",
    category: "Basic",
    description: "Rectangle with rounded corners",
    content: JSON.stringify(roundedRectLayers),
  },
  {
    name: "Circle",
    category: "Basic",
    description: "Perfect circle using cubic bezier curves",
    content: JSON.stringify(circleLayers),
  },
  {
    name: "Diamond",
    category: "Basic",
    description: "Diamond shape (rotated square)",
    content: JSON.stringify(diamondLayers),
  },
  {
    name: "Speech Bubble",
    category: "Custom",
    description: "Speech bubble with triangle tail",
    content: JSON.stringify(speechBubbleLayers),
  },
  {
    name: "Checkmark",
    category: "Symbols",
    description: "Checkmark stroke shape",
    content: JSON.stringify(checkmarkLayers),
  },
  {
    name: "Hexagon",
    category: "Basic",
    description: "Regular hexagon",
    content: JSON.stringify(hexLayers),
  },
  {
    name: "Cross",
    category: "Symbols",
    description: "Plus/cross shape",
    content: JSON.stringify(crossLayers),
  },
]
