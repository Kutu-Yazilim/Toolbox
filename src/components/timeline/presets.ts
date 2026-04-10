import { type Preset } from "@/components/shared/PresetsDrawer"

export const PRIORITY_TIMELINE_PRESETS: Preset[] = [
  {
    name: "Software Sprint",
    category: "Development",
    description: "Typical 2-week sprint plan",
    content: JSON.stringify([
      { title: "Sprint Planning", priority: 1, workload: 1, workloadUnit: "days", color: "#3b82f6" },
      { title: "Feature Development", priority: 2, workload: 1, workloadUnit: "weeks", color: "#10b981" },
      { title: "Code Review", priority: 3, workload: 2, workloadUnit: "days", color: "#f59e0b" },
      { title: "QA Testing", priority: 3, workload: 3, workloadUnit: "days", color: "#ef4444" },
      { title: "Deploy & Monitor", priority: 4, workload: 1, workloadUnit: "days", color: "#8b5cf6" },
    ]),
  },
  {
    name: "Product Launch",
    category: "Marketing",
    description: "Product launch timeline",
    content: JSON.stringify([
      { title: "Market Research", priority: 1, workload: 2, workloadUnit: "weeks", color: "#3b82f6" },
      { title: "Content Creation", priority: 2, workload: 1, workloadUnit: "weeks", color: "#10b981" },
      { title: "PR & Outreach", priority: 2, workload: 1, workloadUnit: "weeks", color: "#f59e0b" },
      { title: "Launch Day", priority: 3, workload: 1, workloadUnit: "days", color: "#ef4444" },
    ]),
  },
  {
    name: "Simple Three-Phase",
    category: "General",
    description: "Plan, execute, review",
    content: JSON.stringify([
      { title: "Planning", priority: 1, workload: 1, workloadUnit: "weeks", color: "#3b82f6" },
      { title: "Execution", priority: 2, workload: 2, workloadUnit: "weeks", color: "#10b981" },
      { title: "Review", priority: 3, workload: 3, workloadUnit: "days", color: "#f59e0b" },
    ]),
  },
]

export const DATE_TIMELINE_PRESETS: Preset[] = [
  {
    name: "Web Project",
    category: "Development",
    description: "Full web development cycle",
    content: JSON.stringify([
      { title: "Design", daysFromNow: 0, duration: 7, color: "#3b82f6" },
      { title: "Frontend", daysFromNow: 5, duration: 14, color: "#10b981" },
      { title: "Backend", daysFromNow: 5, duration: 14, color: "#f59e0b" },
      { title: "Integration", daysFromNow: 18, duration: 5, color: "#ef4444" },
      { title: "Launch", daysFromNow: 23, duration: 2, color: "#8b5cf6" },
    ]),
  },
  {
    name: "Event Planning",
    category: "General",
    description: "Conference or event timeline",
    content: JSON.stringify([
      { title: "Venue Booking", daysFromNow: 0, duration: 5, color: "#3b82f6" },
      { title: "Speaker Invites", daysFromNow: 3, duration: 14, color: "#10b981" },
      { title: "Marketing", daysFromNow: 10, duration: 20, color: "#f59e0b" },
      { title: "Event Day", daysFromNow: 30, duration: 1, color: "#ef4444" },
    ]),
  },
  {
    name: "MVP Development",
    category: "Development",
    description: "Minimal viable product phases",
    content: JSON.stringify([
      { title: "Research & Planning", daysFromNow: 0, duration: 5, color: "#3b82f6" },
      { title: "Core Features", daysFromNow: 5, duration: 21, color: "#10b981" },
      { title: "Testing", daysFromNow: 24, duration: 7, color: "#f59e0b" },
      { title: "Beta Release", daysFromNow: 31, duration: 3, color: "#8b5cf6" },
    ]),
  },
]
