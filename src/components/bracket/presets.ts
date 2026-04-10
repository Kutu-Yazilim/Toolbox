import { type Preset } from "@/components/shared/PresetsDrawer"

export const BRACKET_PRESETS: Preset[] = [
  {
    name: "8-Player Tournament",
    category: "Tournament",
    description: "Standard 8-player single elimination",
    content: JSON.stringify({
      participants: "Alpha\nBravo\nCharlie\nDelta\nEcho\nFoxtrot\nGolf\nHotel",
    }),
  },
  {
    name: "16-Player Tournament",
    category: "Tournament",
    description: "Large 16-player bracket",
    content: JSON.stringify({
      participants: "Player 1\nPlayer 2\nPlayer 3\nPlayer 4\nPlayer 5\nPlayer 6\nPlayer 7\nPlayer 8\nPlayer 9\nPlayer 10\nPlayer 11\nPlayer 12\nPlayer 13\nPlayer 14\nPlayer 15\nPlayer 16",
    }),
  },
  {
    name: "4-Player Quick",
    category: "Tournament",
    description: "Quick 4-player semifinals",
    content: JSON.stringify({
      participants: "Team A\nTeam B\nTeam C\nTeam D",
    }),
  },
  {
    name: "Game Night (6 Players)",
    category: "Casual",
    description: "6-player bracket with byes",
    content: JSON.stringify({
      participants: "Alice\nBob\nCharlie\nDiana\nEve\nFrank",
    }),
  },
]
