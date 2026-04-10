import { type Preset } from "@/components/shared/PresetsDrawer"

export const UNIT_CONVERTER_PRESETS: Preset[] = [
  {
    name: "Miles to Kilometers",
    category: "Length",
    description: "1 mile in km",
    content: JSON.stringify({ category: "length", from: "mi", to: "km", value: "1" }),
  },
  {
    name: "Pounds to Kilograms",
    category: "Weight",
    description: "1 pound in kg",
    content: JSON.stringify({ category: "weight", from: "lb", to: "kg", value: "1" }),
  },
  {
    name: "Fahrenheit to Celsius",
    category: "Temperature",
    description: "Body temperature (98.6 F)",
    content: JSON.stringify({ category: "temperature", from: "f", to: "c", value: "98.6" }),
  },
  {
    name: "GB to MB",
    category: "Data",
    description: "1 GB in megabytes",
    content: JSON.stringify({ category: "data", from: "GB", to: "MB", value: "1" }),
  },
  {
    name: "Hours to Minutes",
    category: "Time",
    description: "Convert hours to minutes",
    content: JSON.stringify({ category: "time", from: "h", to: "min", value: "1" }),
  },
]
