import { type Preset } from "@/components/shared/PresetsDrawer"

export const FAKE_DATA_PRESETS: Preset[] = [
  {
    name: "User Profiles",
    category: "Common",
    description: "Name, email, phone, and address",
    content: JSON.stringify([
      { key: "name", type: "fullName" },
      { key: "email", type: "email" },
      { key: "phone", type: "phone" },
      { key: "address", type: "address" },
    ]),
  },
  {
    name: "Employee Directory",
    category: "Business",
    description: "Employee with company and job info",
    content: JSON.stringify([
      { key: "name", type: "fullName" },
      { key: "email", type: "email" },
      { key: "company", type: "company" },
      { key: "jobTitle", type: "jobTitle" },
      { key: "phone", type: "phone" },
    ]),
  },
  {
    name: "API Mock Data",
    category: "Development",
    description: "UUID, URL, IP, and dates for API testing",
    content: JSON.stringify([
      { key: "id", type: "uuid" },
      { key: "url", type: "url" },
      { key: "ip", type: "ip" },
      { key: "createdAt", type: "date" },
      { key: "active", type: "boolean" },
    ]),
  },
  {
    name: "Location Data",
    category: "Common",
    description: "City, country, and zip code",
    content: JSON.stringify([
      { key: "city", type: "city" },
      { key: "country", type: "country" },
      { key: "zipCode", type: "zipCode" },
      { key: "address", type: "address" },
    ]),
  },
]
