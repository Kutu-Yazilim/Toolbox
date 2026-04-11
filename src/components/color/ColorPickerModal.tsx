"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { XIcon } from "lucide-react"
import { HslWheelPicker } from "@/components/color/HslWheelPicker"
import { HsvSquarePicker } from "@/components/color/HsvSquarePicker"
import { RgbWheelPicker } from "@/components/color/RgbWheelPicker"
import { DirectInputPicker } from "@/components/color/DirectInputPicker"
import { getContrastTextColor } from "@/utils/colorUtils"

interface ColorPickerModalProps {
    hex: string
    onApply: (hex: string) => void
    onClose: () => void
}

export function ColorPickerModal({ hex, onApply, onClose }: ColorPickerModalProps) {
    const [selectedHex, setSelectedHex] = useState(hex)

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90%]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 h-10 border-b border-border flex-shrink-0">
                    <span className="text-sm font-medium text-foreground">Color Picker</span>
                    <Button variant="ghost" size="xs" onClick={onClose}>
                        <XIcon className="h-3 w-3" />
                    </Button>
                </div>

                {/* Preview Swatch */}
                <div
                    className="mx-4 mt-4 h-16 rounded-md border border-border flex items-center justify-center text-sm font-mono font-medium"
                    style={{ backgroundColor: selectedHex, color: getContrastTextColor(selectedHex) }}
                >
                    {selectedHex}
                </div>

                {/* Tabs */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4">
                    <Tabs defaultValue="hsl-wheel">
                        <TabsList className="w-full">
                            <TabsTrigger value="hsl-wheel" className="text-xs">HSL Wheel</TabsTrigger>
                            <TabsTrigger value="hsv-square" className="text-xs">HSV Square</TabsTrigger>
                            <TabsTrigger value="rgb-wheel" className="text-xs">RGB Wheel</TabsTrigger>
                            <TabsTrigger value="inputs" className="text-xs">Inputs</TabsTrigger>
                        </TabsList>

                        <TabsContent value="hsl-wheel" className="mt-3">
                            <HslWheelPicker hex={selectedHex} onChange={setSelectedHex} />
                        </TabsContent>
                        <TabsContent value="hsv-square" className="mt-3">
                            <HsvSquarePicker hex={selectedHex} onChange={setSelectedHex} />
                        </TabsContent>
                        <TabsContent value="rgb-wheel" className="mt-3">
                            <RgbWheelPicker hex={selectedHex} onChange={setSelectedHex} />
                        </TabsContent>
                        <TabsContent value="inputs" className="mt-3">
                            <DirectInputPicker hex={selectedHex} onChange={setSelectedHex} />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-4 h-12 border-t border-border flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <span className="text-xs">Cancel</span>
                    </Button>
                    <Button variant="default" size="sm" onClick={() => onApply(selectedHex)}>
                        <span className="text-xs">Apply</span>
                    </Button>
                </div>
            </div>
        </div>
    )
}
