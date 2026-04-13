import type { PathSegment, Point } from "@/types/shapemaker"

export type PolygonPreset =
  | "triangle"
  | "square"
  | "pentagon"
  | "hexagon"
  | "octagon"
  | "star-5"
  | "star-6"
  | "star-8"
  | "arrow"
  | "cross"
  | "chevron"
  | "badge"

export function generateRegularPolygon(
  sides: number,
  cx: number,
  cy: number,
  radius: number,
): PathSegment[] {
  const segments: PathSegment[] = []
  const angleStep = (2 * Math.PI) / sides
  const startAngle = -Math.PI / 2 // Start at top

  const firstX = cx + radius * Math.cos(startAngle)
  const firstY = cy + radius * Math.sin(startAngle)

  segments.push({ type: "moveTo", point: { x: firstX, y: firstY } })

  for (let i = 1; i < sides; i++) {
    const angle = startAngle + i * angleStep
    const x = cx + radius * Math.cos(angle)
    const y = cy + radius * Math.sin(angle)
    segments.push({ type: "lineTo", point: { x, y } })
  }

  segments.push({ type: "close" })

  return segments
}

export function generateStar(
  points: number,
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
): PathSegment[] {
  const segments: PathSegment[] = []
  const totalVertices = points * 2
  const angleStep = (2 * Math.PI) / totalVertices
  const startAngle = -Math.PI / 2 // Start at top

  const firstX = cx + outerRadius * Math.cos(startAngle)
  const firstY = cy + outerRadius * Math.sin(startAngle)

  segments.push({ type: "moveTo", point: { x: firstX, y: firstY } })

  for (let i = 1; i < totalVertices; i++) {
    const angle = startAngle + i * angleStep
    const r = i % 2 === 0 ? outerRadius : innerRadius
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    segments.push({ type: "lineTo", point: { x, y } })
  }

  segments.push({ type: "close" })

  return segments
}

function makePoint(x: number, y: number): Point {
  return { x, y }
}

function generateArrow(cx: number, cy: number, size: number): PathSegment[] {
  const half = size / 2
  const shaftH = size * 0.3
  const headW = size * 0.45
  const shaftY = shaftH / 2

  // Right-pointing arrow centered at (cx, cy)
  const points: Point[] = [
    makePoint(cx - half, cy - shaftY),
    makePoint(cx + half - headW, cy - shaftY),
    makePoint(cx + half - headW, cy - half),
    makePoint(cx + half, cy),
    makePoint(cx + half - headW, cy + half),
    makePoint(cx + half - headW, cy + shaftY),
    makePoint(cx - half, cy + shaftY),
  ]

  return [
    { type: "moveTo", point: points[0] },
    ...points.slice(1).map<PathSegment>((p) => ({ type: "lineTo", point: p })),
    { type: "close" },
  ]
}

function generateCross(cx: number, cy: number, size: number): PathSegment[] {
  const arm = size / 2
  const thickness = size * 0.3
  const t = thickness / 2

  const points: Point[] = [
    makePoint(cx - t, cy - arm),
    makePoint(cx + t, cy - arm),
    makePoint(cx + t, cy - t),
    makePoint(cx + arm, cy - t),
    makePoint(cx + arm, cy + t),
    makePoint(cx + t, cy + t),
    makePoint(cx + t, cy + arm),
    makePoint(cx - t, cy + arm),
    makePoint(cx - t, cy + t),
    makePoint(cx - arm, cy + t),
    makePoint(cx - arm, cy - t),
    makePoint(cx - t, cy - t),
  ]

  return [
    { type: "moveTo", point: points[0] },
    ...points.slice(1).map<PathSegment>((p) => ({ type: "lineTo", point: p })),
    { type: "close" },
  ]
}

function generateChevron(cx: number, cy: number, size: number): PathSegment[] {
  const half = size / 2
  const thickness = size * 0.28
  const tipX = cx + half

  const points: Point[] = [
    makePoint(cx - half, cy - half),
    makePoint(tipX, cy),
    makePoint(cx - half, cy + half),
    makePoint(cx - half + thickness, cy + half),
    makePoint(tipX - thickness, cy),
    makePoint(cx - half + thickness, cy - half),
  ]

  return [
    { type: "moveTo", point: points[0] },
    ...points.slice(1).map<PathSegment>((p) => ({ type: "lineTo", point: p })),
    { type: "close" },
  ]
}

function generateBadge(cx: number, cy: number, size: number): PathSegment[] {
  const half = size / 2
  const topHeight = size * 0.65
  const pointTip = cy + half

  // Shield/badge: flat top, rounded-ish sides, pointed bottom
  // Approximated with straight lines as a pentagon variant
  const points: Point[] = [
    makePoint(cx - half, cy - half),
    makePoint(cx + half, cy - half),
    makePoint(cx + half, cy - half + topHeight),
    makePoint(cx, pointTip),
    makePoint(cx - half, cy - half + topHeight),
  ]

  return [
    { type: "moveTo", point: points[0] },
    ...points.slice(1).map<PathSegment>((p) => ({ type: "lineTo", point: p })),
    { type: "close" },
  ]
}

export function generatePresetShape(
  preset: PolygonPreset,
  cx: number,
  cy: number,
  size: number,
): PathSegment[] {
  const radius = size / 2

  switch (preset) {
    case "triangle":
      return generateRegularPolygon(3, cx, cy, radius)
    case "square":
      return generateRegularPolygon(4, cx, cy, radius)
    case "pentagon":
      return generateRegularPolygon(5, cx, cy, radius)
    case "hexagon":
      return generateRegularPolygon(6, cx, cy, radius)
    case "octagon":
      return generateRegularPolygon(8, cx, cy, radius)
    case "star-5":
      return generateStar(5, cx, cy, radius, size * 0.38)
    case "star-6":
      return generateStar(6, cx, cy, radius, size * 0.38)
    case "star-8":
      return generateStar(8, cx, cy, radius, size * 0.38)
    case "arrow":
      return generateArrow(cx, cy, size)
    case "cross":
      return generateCross(cx, cy, size)
    case "chevron":
      return generateChevron(cx, cy, size)
    case "badge":
      return generateBadge(cx, cy, size)
  }
}
