import { type Preset } from "@/components/shared/PresetsDrawer"

export const BASE64_FILE_PRESETS: Preset[] = [
  {
    name: "Tiny PNG (1x1 red pixel)",
    category: "Images",
    description: "Minimal PNG image for testing",
    content: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  },
  {
    name: "SVG Circle",
    category: "Images",
    description: "Simple SVG with a circle",
    content: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iIzMzOTlmZiIvPjwvc3ZnPg==",
  },
  {
    name: "Plain Text File",
    category: "Text",
    description: "Simple text content",
    content: "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==",
  },
  {
    name: "JSON File",
    category: "Text",
    description: "JSON object as a file",
    content: "data:application/json;base64,eyJuYW1lIjoiVGVzdCIsInZhbHVlIjoxMjN9",
  },
]
