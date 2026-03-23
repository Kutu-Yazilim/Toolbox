import { useState, useMemo, useCallback } from "react"
import { CopyIcon, CheckIcon, PlusIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GradientType = "linear" | "radial" | "conic"

type ColorStop = {
  color: string
  position: number
}

type RadialPosition =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"

type CopiedKey = "css" | "flutter" | null

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GRADIENT_TYPES: GradientType[] = ["linear", "radial", "conic"]

const GRADIENT_TYPE_LABELS: Record<GradientType, string> = {
  linear: "Linear",
  radial: "Radial",
  conic: "Conic",
}

const RADIAL_POSITIONS: { value: RadialPosition; label: string }[] = [
  { value: "top-left", label: "Top Left" },
  { value: "top", label: "Top" },
  { value: "top-right", label: "Top Right" },
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom", label: "Bottom" },
  { value: "bottom-right", label: "Bottom Right" },
]

const RADIAL_POSITION_CSS: Record<RadialPosition, string> = {
  center: "circle at center",
  top: "circle at center top",
  bottom: "circle at center bottom",
  left: "circle at left center",
  right: "circle at right center",
  "top-left": "circle at left top",
  "top-right": "circle at right top",
  "bottom-left": "circle at left bottom",
  "bottom-right": "circle at right bottom",
}

const RADIAL_POSITION_FLUTTER: Record<RadialPosition, string> = {
  center: "Alignment.center",
  top: "Alignment.topCenter",
  bottom: "Alignment.bottomCenter",
  left: "Alignment.centerLeft",
  right: "Alignment.centerRight",
  "top-left": "Alignment.topLeft",
  "top-right": "Alignment.topRight",
  "bottom-left": "Alignment.bottomLeft",
  "bottom-right": "Alignment.bottomRight",
}

type Preset = {
  name: string
  stops: ColorStop[]
  type: GradientType
  angle: number
}

const PRESETS: Preset[] = [
  {
    name: "Sunset",
    type: "linear",
    angle: 135,
    stops: [
      { color: "#f97316", position: 0 },
      { color: "#ec4899", position: 50 },
      { color: "#8b5cf6", position: 100 },
    ],
  },
  {
    name: "Ocean",
    type: "linear",
    angle: 180,
    stops: [
      { color: "#0ea5e9", position: 0 },
      { color: "#2563eb", position: 50 },
      { color: "#1e3a5f", position: 100 },
    ],
  },
  {
    name: "Forest",
    type: "linear",
    angle: 160,
    stops: [
      { color: "#22c55e", position: 0 },
      { color: "#15803d", position: 50 },
      { color: "#14532d", position: 100 },
    ],
  },
  {
    name: "Aurora",
    type: "linear",
    angle: 135,
    stops: [
      { color: "#667eea", position: 0 },
      { color: "#764ba2", position: 100 },
    ],
  },
  {
    name: "Flame",
    type: "linear",
    angle: 45,
    stops: [
      { color: "#ff0844", position: 0 },
      { color: "#ffb199", position: 100 },
    ],
  },
  {
    name: "Mint",
    type: "linear",
    angle: 120,
    stops: [
      { color: "#a8edea", position: 0 },
      { color: "#fed6e3", position: 100 },
    ],
  },
  {
    name: "Night Sky",
    type: "linear",
    angle: 180,
    stops: [
      { color: "#0f0c29", position: 0 },
      { color: "#302b63", position: 50 },
      { color: "#24243e", position: 100 },
    ],
  },
  {
    name: "Peach",
    type: "radial",
    angle: 0,
    stops: [
      { color: "#ffecd2", position: 0 },
      { color: "#fcb69f", position: 100 },
    ],
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hexToFlutterColor(hex: string): string {
  const clean = hex.replace("#", "").toUpperCase()
  return `Color(0xFF${clean})`
}

function buildCssGradient(
  type: GradientType,
  angle: number,
  position: RadialPosition,
  stops: ColorStop[],
): string {
  const stopStr = stops
    .map((s) => `${s.color} ${s.position}%`)
    .join(", ")

  switch (type) {
    case "linear":
      return `linear-gradient(${angle}deg, ${stopStr})`
    case "radial":
      return `radial-gradient(${RADIAL_POSITION_CSS[position]}, ${stopStr})`
    case "conic":
      return `conic-gradient(from ${angle}deg, ${stopStr})`
  }
}

function angleToFlutterAlignment(angleDeg: number): { begin: string; end: string } {
  const knownAngles: Record<number, { begin: string; end: string }> = {
    0: { begin: "Alignment.bottomCenter", end: "Alignment.topCenter" },
    45: { begin: "Alignment.bottomLeft", end: "Alignment.topRight" },
    90: { begin: "Alignment.centerLeft", end: "Alignment.centerRight" },
    135: { begin: "Alignment.topLeft", end: "Alignment.bottomRight" },
    180: { begin: "Alignment.topCenter", end: "Alignment.bottomCenter" },
    225: { begin: "Alignment.topRight", end: "Alignment.bottomLeft" },
    270: { begin: "Alignment.centerRight", end: "Alignment.centerLeft" },
    315: { begin: "Alignment.bottomRight", end: "Alignment.topLeft" },
  }

  if (knownAngles[angleDeg]) return knownAngles[angleDeg]

  const rad = ((angleDeg - 90) * Math.PI) / 180
  const x = parseFloat(Math.cos(rad).toFixed(2))
  const y = parseFloat(Math.sin(rad).toFixed(2))
  return {
    begin: `Alignment(${(-x).toFixed(2)}, ${(-y).toFixed(2)})`,
    end: `Alignment(${x.toFixed(2)}, ${y.toFixed(2)})`,
  }
}

function buildFlutterCode(
  type: GradientType,
  angle: number,
  position: RadialPosition,
  stops: ColorStop[],
): string {
  const colors = stops.map((s) => `        ${hexToFlutterColor(s.color)}`).join(",\n")
  const stopsStr = stops.map((s) => `        ${(s.position / 100).toFixed(2)}`).join(",\n")

  switch (type) {
    case "linear": {
      const alignment = angleToFlutterAlignment(angle)
      return `LinearGradient(
      begin: ${alignment.begin},
      end: ${alignment.end},
      colors: [
${colors},
      ],
      stops: [
${stopsStr},
      ],
    )`
    }
    case "radial": {
      return `RadialGradient(
      center: ${RADIAL_POSITION_FLUTTER[position]},
      radius: 0.5,
      colors: [
${colors},
      ],
      stops: [
${stopsStr},
      ],
    )`
    }
    case "conic": {
      const startAngle = ((angle % 360) * Math.PI) / 180
      const endAngle = startAngle + 2 * Math.PI
      return `SweepGradient(
      startAngle: ${startAngle.toFixed(4)},
      endAngle: ${endAngle.toFixed(4)},
      colors: [
${colors},
      ],
      stops: [
${stopsStr},
      ],
    )`
    }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GradientGenerator() {
  const [type, setType] = useState<GradientType>("linear")
  const [angle, setAngle] = useState(135)
  const [position, setPosition] = useState<RadialPosition>("center")
  const [stops, setStops] = useState<ColorStop[]>([
    { color: "#667eea", position: 0 },
    { color: "#764ba2", position: 100 },
  ])
  const [copied, setCopied] = useState<CopiedKey>(null)

  const cssGradient = useMemo(
    () => buildCssGradient(type, angle, position, stops),
    [type, angle, position, stops],
  )

  const cssCode = useMemo(() => `background: ${cssGradient};`, [cssGradient])

  const flutterCode = useMemo(
    () => buildFlutterCode(type, angle, position, stops),
    [type, angle, position, stops],
  )

  const copyToClipboard = useCallback(
    (text: string, key: CopiedKey) => {
      navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    },
    [],
  )

  const updateStop = useCallback(
    (index: number, field: "color" | "position", value: string | number) => {
      setStops((prev) =>
        prev.map((s, i) =>
          i === index ? { ...s, [field]: value } : s,
        ),
      )
    },
    [],
  )

  const removeStop = useCallback(
    (index: number) => {
      setStops((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)))
    },
    [],
  )

  const addStop = useCallback(() => {
    setStops((prev) => {
      const lastPos = prev[prev.length - 1]?.position ?? 50
      const newPos = Math.min(100, lastPos + 10)
      return [...prev, { color: "#ffffff", position: newPos }]
    })
  }, [])

  const applyPreset = useCallback((preset: Preset) => {
    setType(preset.type)
    setAngle(preset.angle)
    setStops(preset.stops.map((s) => ({ ...s })))
    if (preset.type === "radial") setPosition("center")
  }, [])

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex-1 flex min-h-0">
        {/* Left Panel: Controls */}
        <div className="w-2/5 min-w-[280px] border-r border-border overflow-y-auto p-4 space-y-6">
          {/* Gradient Type */}
          <section className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Type</h3>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {GRADIENT_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
                    type === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {GRADIENT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </section>

          {/* Angle / Position */}
          {type === "linear" && (
            <section className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">Angle</h3>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={360}
                    value={angle}
                    onChange={(e) => setAngle(Math.max(0, Math.min(360, Number(e.target.value))))}
                    className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground text-center"
                  />
                  <span className="text-sm text-muted-foreground">deg</span>
                </div>
              </div>
            </section>
          )}

          {type === "radial" && (
            <section className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">Position</h3>
              <div className="grid grid-cols-3 gap-1">
                {RADIAL_POSITIONS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPosition(p.value)}
                    className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      position === p.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-accent"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          {type === "conic" && (
            <section className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">Start Angle</h3>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={360}
                    value={angle}
                    onChange={(e) => setAngle(Math.max(0, Math.min(360, Number(e.target.value))))}
                    className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground text-center"
                  />
                  <span className="text-sm text-muted-foreground">deg</span>
                </div>
              </div>
            </section>
          )}

          {/* Color Stops */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Color Stops</h3>
              <Button variant="outline" size="xs" onClick={addStop}>
                <PlusIcon className="size-3" />
                Add Stop
              </Button>
            </div>
            <div className="space-y-2">
              {stops.map((stop, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => updateStop(i, "color", e.target.value)}
                    className="size-8 rounded border border-input cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={stop.color}
                    onChange={(e) => updateStop(i, "color", e.target.value)}
                    className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground font-mono"
                  />
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={stop.position}
                      onChange={(e) => updateStop(i, "position", Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {stop.position}%
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeStop(i)}
                    disabled={stops.length <= 2}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <XIcon className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* Preset Gallery */}
          <section className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Presets</h3>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((preset) => {
                const previewCss = buildCssGradient(
                  preset.type,
                  preset.angle,
                  "center",
                  preset.stops,
                )
                return (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="group flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full aspect-square rounded-lg border border-border group-hover:ring-2 group-hover:ring-ring transition-shadow"
                      style={{ background: previewCss }}
                    />
                    <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                      {preset.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        {/* Right Panel: Preview & Export */}
        <div className="flex-1 flex flex-col min-w-0 p-4 gap-4">
          {/* Preview */}
          <div
            className="flex-1 rounded-xl border border-border min-h-[200px]"
            style={{ background: cssGradient }}
          />

          {/* Export: CSS */}
          <section className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">CSS</h3>
              <Button
                variant="outline"
                size="xs"
                onClick={() => copyToClipboard(cssCode, "css")}
              >
                {copied === "css" ? (
                  <CheckIcon className="size-3" />
                ) : (
                  <CopyIcon className="size-3" />
                )}
                {copied === "css" ? "Copied" : "Copy"}
              </Button>
            </div>
            <pre className="rounded-md border border-border bg-muted/50 p-3 text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-all">
              {cssCode}
            </pre>
          </section>

          {/* Export: Flutter */}
          <section className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Flutter / Dart</h3>
              <Button
                variant="outline"
                size="xs"
                onClick={() => copyToClipboard(flutterCode, "flutter")}
              >
                {copied === "flutter" ? (
                  <CheckIcon className="size-3" />
                ) : (
                  <CopyIcon className="size-3" />
                )}
                {copied === "flutter" ? "Copied" : "Copy"}
              </Button>
            </div>
            <pre className="rounded-md border border-border bg-muted/50 p-3 text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-all">
              {flutterCode}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}
