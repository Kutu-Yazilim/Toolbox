import type {
  Layer,
  ShapePath,
  PaintStyle,
  CodeGenOptions,
  GradientDef,
} from "@/types/shapemaker"
import { computeBoundingBox } from "./shapemakerTransform"

function colorToFlutter(hex: string, opacity: number): string {
  const clean = hex.replace("#", "")
  const alphaHex = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase()
  return `Color(0x${alphaHex}${clean.toUpperCase()})`
}

function pointToCode(
  x: number,
  y: number,
  opts: CodeGenOptions
): { x: string; y: string } {
  if (opts.responsive) {
    const rx = (x / opts.canvasWidth).toFixed(4)
    const ry = (y / opts.canvasHeight).toFixed(4)
    return { x: `size.width * ${rx}`, y: `size.height * ${ry}` }
  }
  return { x: x.toFixed(1), y: y.toFixed(1) }
}

function generateGradientCode(
  gradient: GradientDef,
  opts: CodeGenOptions
): string {
  const lines: string[] = []

  if (gradient.type === "linear") {
    const s = pointToCode(gradient.startPoint.x, gradient.startPoint.y, opts)
    const e = pointToCode(gradient.endPoint.x, gradient.endPoint.y, opts)
    lines.push("      shader: ui.Gradient.linear(")
    lines.push(`        Offset(${s.x}, ${s.y}),`)
    lines.push(`        Offset(${e.x}, ${e.y}),`)
  } else if (gradient.type === "radial") {
    const c = pointToCode(gradient.center.x, gradient.center.y, opts)
    const r = opts.responsive
      ? `size.width * ${(gradient.radius / opts.canvasWidth).toFixed(4)}`
      : gradient.radius.toFixed(1)
    lines.push("      shader: ui.Gradient.radial(")
    lines.push(`        Offset(${c.x}, ${c.y}),`)
    lines.push(`        ${r},`)
  } else {
    const c = pointToCode(gradient.center.x, gradient.center.y, opts)
    lines.push("      shader: ui.Gradient.sweep(")
    lines.push(`        Offset(${c.x}, ${c.y}),`)
  }

  const colors = gradient.stops.map((s) => colorToFlutter(s.color, 1)).join(", ")
  const stops = gradient.stops.map((s) => s.offset.toFixed(2)).join(", ")
  lines.push(`        [${colors}],`)
  lines.push(`        [${stops}],`)
  lines.push("      ),")

  return lines.join("\n")
}

function generatePaintCode(
  paint: PaintStyle,
  varName: string,
  opts: CodeGenOptions
): string {
  const lines: string[] = []
  lines.push(`    final ${varName} = Paint()`)

  if (paint.paintingStyle === "stroke" || paint.paintingStyle === "fillAndStroke") {
    if (paint.paintingStyle === "stroke") {
      lines.push("      ..style = PaintingStyle.stroke")
    }
    lines.push(`      ..strokeWidth = ${paint.strokeWidth.toFixed(1)}`)
    if (paint.strokeCap !== "butt") {
      const cap = paint.strokeCap === "round" ? "StrokeCap.round" : "StrokeCap.square"
      lines.push(`      ..strokeCap = ${cap}`)
    }
    if (paint.strokeJoin !== "miter") {
      const join =
        paint.strokeJoin === "round" ? "StrokeJoin.round" : "StrokeJoin.bevel"
      lines.push(`      ..strokeJoin = ${join}`)
    }
  }

  if (paint.gradient) {
    lines.push(generateGradientCode(paint.gradient, opts))
  } else {
    const color =
      paint.paintingStyle === "stroke"
        ? colorToFlutter(paint.strokeColor, paint.strokeOpacity)
        : colorToFlutter(paint.fillColor, paint.fillOpacity)
    lines.push(`      ..color = ${color}`)
  }

  // Add blur/shadow if present
  if (paint.blurRadius > 0) {
    lines.push(
      `      ..maskFilter = MaskFilter.blur(BlurStyle.normal, ${paint.blurRadius.toFixed(1)})`
    )
  }

  lines[lines.length - 1] += ";"
  return lines.join("\n")
}

function generatePathCode(
  path: ShapePath,
  pathVar: string,
  opts: CodeGenOptions
): string {
  const lines: string[] = []
  lines.push(`    final ${pathVar} = Path()`)

  for (const seg of path.segments) {
    switch (seg.type) {
      case "moveTo": {
        const p = pointToCode(seg.point.x, seg.point.y, opts)
        lines.push(`      ..moveTo(${p.x}, ${p.y})`)
        break
      }
      case "lineTo": {
        const p = pointToCode(seg.point.x, seg.point.y, opts)
        lines.push(`      ..lineTo(${p.x}, ${p.y})`)
        break
      }
      case "quadraticBezierTo": {
        const cp = pointToCode(seg.controlPoint.x, seg.controlPoint.y, opts)
        const ep = pointToCode(seg.endPoint.x, seg.endPoint.y, opts)
        lines.push(
          `      ..quadraticBezierTo(${cp.x}, ${cp.y}, ${ep.x}, ${ep.y})`
        )
        break
      }
      case "cubicTo": {
        const c1 = pointToCode(seg.controlPoint1.x, seg.controlPoint1.y, opts)
        const c2 = pointToCode(seg.controlPoint2.x, seg.controlPoint2.y, opts)
        const ep = pointToCode(seg.endPoint.x, seg.endPoint.y, opts)
        lines.push(
          `      ..cubicTo(${c1.x}, ${c1.y}, ${c2.x}, ${c2.y}, ${ep.x}, ${ep.y})`
        )
        break
      }
      case "arcToPoint": {
        const ep = pointToCode(seg.endPoint.x, seg.endPoint.y, opts)
        const rx = opts.responsive
          ? `size.width * ${(seg.radius.x / opts.canvasWidth).toFixed(4)}`
          : seg.radius.x.toFixed(1)
        const ry = opts.responsive
          ? `size.height * ${(seg.radius.y / opts.canvasHeight).toFixed(4)}`
          : seg.radius.y.toFixed(1)
        lines.push(
          `      ..arcToPoint(Offset(${ep.x}, ${ep.y}), radius: Radius.elliptical(${rx}, ${ry}), rotation: ${seg.rotation.toFixed(1)}, largeArc: ${seg.largeArc}, clockwise: ${seg.clockwise})`
        )
        break
      }
      case "close": {
        lines.push("      ..close()")
        break
      }
    }
  }

  lines[lines.length - 1] += ";"
  return lines.join("\n")
}

export function generateFlutterCode(
  layers: Layer[],
  opts: CodeGenOptions
): string {
  const lines: string[] = []

  lines.push("import 'dart:ui' as ui;")
  lines.push("import 'package:flutter/material.dart';")
  lines.push("")

  // Widget wrapper
  lines.push(`class ${opts.className} extends StatelessWidget {`)
  lines.push(`  const ${opts.className}({super.key});`)
  lines.push("")
  lines.push("  @override")
  lines.push("  Widget build(BuildContext context) {")

  if (opts.includeSize) {
    lines.push(`    return CustomPaint(`)
    lines.push(
      `      size: const Size(${opts.canvasWidth.toFixed(1)}, ${opts.canvasHeight.toFixed(1)}),`
    )
    lines.push(`      painter: ${opts.className}Painter(),`)
    lines.push("    );")
  } else {
    lines.push(`    return CustomPaint(`)
    lines.push(`      painter: ${opts.className}Painter(),`)
    lines.push("    );")
  }

  lines.push("  }")
  lines.push("}")
  lines.push("")

  // Painter class
  lines.push(
    `class ${opts.className}Painter extends CustomPainter {`
  )
  lines.push("  @override")
  lines.push("  void paint(Canvas canvas, Size size) {")

  let paintIdx = 0
  let pathIdx = 0

  for (const layer of layers) {
    if (!layer.visible) continue

    for (const path of layer.paths) {
      if (!path.visible || path.segments.length === 0) continue

      const paintVar = `paint${paintIdx}`
      const pathVar = `path${pathIdx}`

      lines.push("")
      lines.push(`    // ${layer.name} - ${path.name}`)
      lines.push(generatePaintCode(path.paint, paintVar, opts))
      lines.push("")
      lines.push(generatePathCode(path, pathVar, opts))
      lines.push("")

      const hasRotation = path.transform.rotation !== 0
      if (hasRotation) {
        const bbox = computeBoundingBox(path.segments)
        const bboxCx = bbox.x + bbox.width / 2
        const bboxCy = bbox.y + bbox.height / 2
        const cx = opts.responsive
          ? pointToCode(bboxCx, bboxCy, opts).x
          : bboxCx.toFixed(1)
        const cy = opts.responsive
          ? pointToCode(bboxCx, bboxCy, opts).y
          : bboxCy.toFixed(1)
        lines.push(`    canvas.save();`)
        lines.push(`    canvas.translate(${cx}, ${cy});`)
        lines.push(`    canvas.rotate(${path.transform.rotation.toFixed(6)});`)
        lines.push(`    canvas.translate(-${cx}, -${cy});`)
      }

      if (path.paint.paintingStyle === "fillAndStroke") {
        lines.push(`    canvas.drawPath(${pathVar}, ${paintVar});`)
        lines.push(`    final ${paintVar}Stroke = Paint()`)
        lines.push("      ..style = PaintingStyle.stroke")
        lines.push(
          `      ..strokeWidth = ${path.paint.strokeWidth.toFixed(1)}`
        )
        lines.push(
          `      ..color = ${colorToFlutter(path.paint.strokeColor, path.paint.strokeOpacity)};`
        )
        lines.push(
          `    canvas.drawPath(${pathVar}, ${paintVar}Stroke);`
        )
      } else {
        lines.push(`    canvas.drawPath(${pathVar}, ${paintVar});`)
      }

      if (hasRotation) {
        lines.push(`    canvas.restore();`)
      }

      paintIdx++
      pathIdx++
    }
  }

  lines.push("  }")
  lines.push("")
  lines.push("  @override")
  lines.push("  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;")
  lines.push("}")

  return lines.join("\n")
}
