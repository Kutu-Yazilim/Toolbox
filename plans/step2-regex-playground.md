# Step 2: Regex Playground

## Goal
Live regex testing with pattern input, flags, test string, match highlighting, and capture group extraction. The developer's regex101 replacement.

## Files to Create
- `src/components/regex/RegexPlayground.tsx` — main component

## Architecture
- **Top bar:** Regex input field with `/pattern/` visual wrapper + flag checkboxes (g, i, m, s, u)
- **Main area:** Textarea (or Monaco) for the test string. Matches highlighted inline.
- **Bottom panel:** Match results — list of all matches with index, value, and named/numbered capture groups.
- **Error display:** If regex is invalid, show error inline next to the pattern input (not an overlay).

## Key Decisions
- Pure JS `RegExp` — no library needed.
- Use a textarea with a highlight overlay for match visualization (simpler than Monaco markers).
- Actually, better approach: Use two overlapping layers — a `<div>` with highlighted spans behind a transparent `<textarea>`. Classic regex highlighter pattern.
- Flags as small toggle buttons (g i m s u) — each clickable to toggle.

## State
```
pattern: string              // regex pattern (without delimiters)
flags: string                // combined flags like "gi"
testString: string           // user input to test against
matches: RegExpMatchArray[]  // all match results
error: string | null         // regex syntax error
```

## Behavior
1. On pattern or flags change → try `new RegExp(pattern, flags)` → catch for invalid
2. On test string change → re-run regex → extract all matches
3. Highlight matches in the test string display
4. Show match table: index, full match, groups
5. Common patterns dropdown (email, URL, IP, phone, date) as quick-start

## Estimated Size
~250-300 lines
