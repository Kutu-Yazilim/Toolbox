"use client"

// ── Constants ──────────────────────────────────────────────────

const TEXT_COLOR_PRESETS = [
  "#1e1e1e",
  "#e03131",
  "#2f9e44",
  "#1971c2",
  "#f08c00",
  "#6741d9",
  "#0c8599",
  "#e8590c",
]

const COLOR_DOT_SIZE = 16

// ── Props ──────────────────────────────────────────────────────

interface RichTextToolbarProps {
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
  textColor: string
  onToggleBold: () => void
  onToggleItalic: () => void
  onToggleUnderline: () => void
  onToggleStrikethrough: () => void
  onTextColorChange: (color: string) => void
}

// ── Toggle Button ──────────────────────────────────────────────

interface FormatButtonProps {
  active: boolean
  onClick: () => void
  label: string
  className?: string
}

function FormatButton({ active, onClick, label, className }: FormatButtonProps) {
  return (
    <button
      className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-colors ${
        active ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:bg-accent/50"
      } ${className ?? ""}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}

// ── Component ──────────────────────────────────────────────────

export default function RichTextToolbar({
  bold,
  italic,
  underline,
  strikethrough,
  textColor,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onToggleStrikethrough,
  onTextColorChange,
}: RichTextToolbarProps) {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {/* Format toggles */}
      <FormatButton active={bold} onClick={onToggleBold} label="B" className="font-bold" />
      <FormatButton active={italic} onClick={onToggleItalic} label="I" className="italic" />
      <FormatButton active={underline} onClick={onToggleUnderline} label="U" className="underline" />
      <FormatButton active={strikethrough} onClick={onToggleStrikethrough} label="S" className="line-through" />

      {/* Separator */}
      <div className="w-px h-5 bg-border mx-1" />

      {/* Text color presets */}
      <div className="flex items-center gap-1">
        {TEXT_COLOR_PRESETS.map((color) => (
          <button
            key={color}
            className={`rounded-full border transition-transform hover:scale-110 ${
              textColor === color ? "border-foreground ring-1 ring-foreground/30" : "border-border"
            }`}
            style={{
              width: COLOR_DOT_SIZE,
              height: COLOR_DOT_SIZE,
              backgroundColor: color,
            }}
            onClick={() => onTextColorChange(color)}
            type="button"
            title={color}
          />
        ))}
      </div>
    </div>
  )
}
