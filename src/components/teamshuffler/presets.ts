import { type Preset } from "@/components/shared/PresetsDrawer"

export const TEAM_SHUFFLER_PRESETS: Preset[] = [
  {
    name: "Hackathon Teams",
    category: "Work",
    description: "12 participants into 3 teams",
    content: JSON.stringify({
      names: "Alice\nBob\nCharlie\nDiana\nEve\nFrank\nGrace\nHank\nIvy\nJack\nKaren\nLeo",
      teamCount: 3,
    }),
  },
  {
    name: "Game Night Pairs",
    category: "Games",
    description: "8 players into 4 pairs",
    content: JSON.stringify({
      names: "Player 1\nPlayer 2\nPlayer 3\nPlayer 4\nPlayer 5\nPlayer 6\nPlayer 7\nPlayer 8",
      teamCount: 4,
    }),
  },
  {
    name: "Classroom Groups",
    category: "Education",
    description: "20 students into 5 groups",
    content: JSON.stringify({
      names: "Student 1\nStudent 2\nStudent 3\nStudent 4\nStudent 5\nStudent 6\nStudent 7\nStudent 8\nStudent 9\nStudent 10\nStudent 11\nStudent 12\nStudent 13\nStudent 14\nStudent 15\nStudent 16\nStudent 17\nStudent 18\nStudent 19\nStudent 20",
      teamCount: 5,
    }),
  },
  {
    name: "Two Teams",
    category: "Games",
    description: "Split group into 2 teams",
    content: JSON.stringify({
      names: "Alice\nBob\nCharlie\nDiana\nEve\nFrank",
      teamCount: 2,
    }),
  },
]
