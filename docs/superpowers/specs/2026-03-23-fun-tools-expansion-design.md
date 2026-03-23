# Fun Tools Expansion Design

## Overview

Expand the Fun category from 2 tools (Wheel of Fate, Coin Flip) to 11 tools. A mix of practical decision-making tools and lighthearted silly tools, all client-side with no dependencies.

**Target audience:** Anyone who needs to make a decision or just wants a quick distraction.

**Architecture:** Same as all other tools — component in `src/components/<name>/`, entry in `toolRegistry.ts`, lazy route in `router.tsx`. No new categories or dependencies.

---

## Practical Decision Makers (5 tools)

### Dice Roller
- Dice types: d4, d6, d8, d10, d12, d20, d100 (segmented selector)
- Roll multiple dice at once (1-20 count)
- 3D-style rolling animation (CSS transform/transition on dice faces)
- Show each die result + total sum
- Roll history (last 20 rolls) with timestamp
- Modifier input (+N/-N added to total)
- "Roll" button + spacebar shortcut

### Random Number Generator
- Min/max range inputs (default 1-100)
- Generate single number or batch (1-1000)
- No-repeat toggle (for batch mode)
- Sort output option
- Large animated number display for single rolls
- Copy results
- Simple bar chart showing distribution for large batches

### Team Shuffler
- Textarea to paste names (one per line)
- Number of teams input (2-20)
- "Shuffle" button with animation (names fly to their teams)
- Results shown as team cards with colored headers
- Re-shuffle button
- Export as text (copy to clipboard)
- Handle odd numbers gracefully (some teams get +1)

### Bracket Generator
- Input: list of names/teams (2-64 participants)
- Auto-pad to next power of 2 with "BYE" slots
- Randomize seeding button
- Visual bracket display (SVG or CSS grid)
- Click match to select winner → advances to next round
- Reset bracket / re-seed
- Single elimination format
- Export bracket as PNG (html-to-image)

### Random Picker
- Textarea to paste items (one per line)
- "Pick" button → dramatic card-flip reveal animation
- Show picked item large and centered
- "Pick Again" button
- Without-replacement toggle (grays out picked items)
- History of picks
- "Reset" to restore all items

## Pure Silly (4 tools)

### Magic 8-Ball
- Classic 8-ball graphic (CSS/SVG circle with triangle window)
- Text input for your question
- "Shake" button or click the ball → shake animation → reveal answer
- 20 classic responses (10 positive, 5 neutral, 5 negative)
- Custom response list mode (paste your own responses)
- History of questions + answers

### Rock Paper Scissors
- Three large hand emoji/icon buttons (rock/paper/scissors)
- Click to play → animated reveal of computer's choice
- Result: Win/Lose/Draw with color flash
- Running score: You vs Computer
- Win streak counter
- Best of N mode (best of 3, 5, 7)
- Reset stats

### Would You Rather
- Shows a "Would you rather..." prompt with two options (A vs B)
- Click to vote → show percentage split (stored in localStorage across sessions)
- "Next" button for new prompt
- ~50 built-in prompts (mix of funny, thought-provoking, absurd)
- Custom prompt creator (stored in localStorage)
- Category filter: funny, deep, gross, impossible

### Decision Maker
- Text input for a yes/no question
- "Decide" button → over-the-top dramatic sequence:
  1. Screen dims
  2. Drumroll sound effect (optional, toggle)
  3. Spotlight narrows
  4. Answer reveals with confetti animation (CSS particles)
- Answer: YES or NO (50/50 random)
- History of decisions
- "Sounds" toggle (off by default — respect user peace)

---

## Dependencies

None. All tools use:
- CSS animations for visual effects
- Canvas API for confetti (Decision Maker)
- html-to-image (already installed) for Bracket PNG export
- localStorage for Would You Rather votes and custom prompts

## Total Tool Count After

Fun category: 2 existing + 9 new = 11 tools
Project total: 74 existing + 9 new = 83 tools across 10 categories
