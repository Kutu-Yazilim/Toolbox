import { getContrastRatio, meetsWCAG_AA, meetsWCAG_AAA, getContrastTextColor } from "@/utils/colorUtils"
import type { PaletteColor } from "@/types/color"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { XIcon, CheckIcon, XCircleIcon } from "lucide-react"

interface ContrastCheckerProps {
  colors: PaletteColor[]
  onClose: () => void
}

export function ContrastChecker({ colors, onClose }: ContrastCheckerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Contrast Checker</h2>
            <p className="text-sm text-muted-foreground">WCAG 2.1 accessibility contrast ratios</p>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <XIcon className="size-4" />
          </Button>
        </div>

        {/* Contrast matrix */}
        <div className="flex-1 overflow-auto p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-xs font-medium text-muted-foreground text-left">
                    BG \ FG
                  </th>
                  {colors.map((c) => (
                    <th key={c.id} className="p-2">
                      <div
                        className="w-8 h-8 rounded-md mx-auto border border-border"
                        style={{ backgroundColor: c.hex }}
                        title={c.hex}
                      />
                    </th>
                  ))}
                  <th className="p-2">
                    <div className="w-8 h-8 rounded-md mx-auto border border-border bg-white" title="#FFFFFF" />
                  </th>
                  <th className="p-2">
                    <div className="w-8 h-8 rounded-md mx-auto border border-border bg-black" title="#000000" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {colors.map((bg) => (
                  <tr key={bg.id}>
                    <td className="p-2">
                      <div
                        className="w-8 h-8 rounded-md border border-border"
                        style={{ backgroundColor: bg.hex }}
                        title={bg.hex}
                      />
                    </td>
                    {colors.map((fg) => {
                      if (bg.id === fg.id) {
                        return (
                          <td key={fg.id} className="p-2 text-center">
                            <span className="text-xs text-muted-foreground">-</span>
                          </td>
                        )
                      }
                      const ratio = getContrastRatio(bg.hex, fg.hex)
                      const aa = meetsWCAG_AA(ratio)
                      const aaa = meetsWCAG_AAA(ratio)
                      return (
                        <td key={fg.id} className="p-2">
                          <ContrastCell ratio={ratio} aa={aa} aaa={aaa} bgHex={bg.hex} fgHex={fg.hex} />
                        </td>
                      )
                    })}
                    {/* White foreground */}
                    <td className="p-2">
                      <ContrastCell
                        ratio={getContrastRatio(bg.hex, "#FFFFFF")}
                        aa={meetsWCAG_AA(getContrastRatio(bg.hex, "#FFFFFF"))}
                        aaa={meetsWCAG_AAA(getContrastRatio(bg.hex, "#FFFFFF"))}
                        bgHex={bg.hex}
                        fgHex="#FFFFFF"
                      />
                    </td>
                    {/* Black foreground */}
                    <td className="p-2">
                      <ContrastCell
                        ratio={getContrastRatio(bg.hex, "#000000")}
                        aa={meetsWCAG_AA(getContrastRatio(bg.hex, "#000000"))}
                        aaa={meetsWCAG_AAA(getContrastRatio(bg.hex, "#000000"))}
                        bgHex={bg.hex}
                        fgHex="#000000"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckIcon className="size-3.5 text-green-500" />
              <span>AAA (7:1+)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckIcon className="size-3.5 text-yellow-500" />
              <span>AA (4.5:1+)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircleIcon className="size-3.5 text-destructive" />
              <span>Fail (&lt;4.5:1)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ContrastCell({
  ratio,
  aa,
  aaa,
  bgHex,
  fgHex,
}: {
  ratio: number
  aa: boolean
  aaa: boolean
  bgHex: string
  fgHex: string
}) {
  return (
    <div
      className={cn(
        "rounded-md p-1.5 text-center min-w-[48px]",
        aaa ? "ring-1 ring-green-500/30" : aa ? "ring-1 ring-yellow-500/30" : "ring-1 ring-destructive/30"
      )}
      style={{ backgroundColor: bgHex }}
    >
      <div className="text-[10px] font-bold" style={{ color: fgHex }}>
        Aa
      </div>
      <div className="text-[9px] font-mono" style={{ color: getContrastTextColor(bgHex) }}>
        {ratio.toFixed(1)}
      </div>
      <div className="mt-0.5">
        {aaa ? (
          <CheckIcon className="size-3 mx-auto text-green-500" />
        ) : aa ? (
          <CheckIcon className="size-3 mx-auto text-yellow-500" />
        ) : (
          <XCircleIcon className="size-3 mx-auto text-destructive" />
        )}
      </div>
    </div>
  )
}
