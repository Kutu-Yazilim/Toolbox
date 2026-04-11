"use client"

interface ContextMenuPosition {
  x: number
  y: number
}

interface ContextMenuAction {
  label: string
  shortcut?: string
  disabled?: boolean
  onClick: () => void
}

interface ContextMenuSection {
  items: ContextMenuAction[]
}

interface ContextMenuProps {
  position: ContextMenuPosition
  sections: ContextMenuSection[]
  onClose: () => void
}

export function ContextMenu({ position, sections, onClose }: ContextMenuProps) {
  return (
    <div
      className="fixed z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[180px] text-sm"
      style={{ left: position.x, top: position.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {sections.map((section, sectionIdx) => (
        <div key={sectionIdx}>
          {sectionIdx > 0 && <ContextMenuSeparator />}
          {section.items.map((item) => (
            <ContextMenuItem
              key={item.label}
              label={item.label}
              shortcut={item.shortcut}
              disabled={item.disabled}
              onClick={() => {
                item.onClick()
                onClose()
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function ContextMenuItem({
  label,
  shortcut,
  disabled,
  onClick,
}: {
  label: string
  shortcut?: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-accent disabled:opacity-40 disabled:pointer-events-none transition-colors"
      disabled={disabled}
      onClick={onClick}
    >
      <span>{label}</span>
      {shortcut && (
        <span className="text-xs text-muted-foreground ml-4">{shortcut}</span>
      )}
    </button>
  )
}

function ContextMenuSeparator() {
  return <div className="h-px bg-border my-1" />
}
