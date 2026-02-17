# Step 1: JSON / YAML Formatter & Diff

## Goal
A split-panel tool for formatting, validating, and diffing JSON. Monaco editor does all the heavy lifting — we wire it up with format/minify/diff controls.

## Files to Create
- `src/components/json/JsonFormatter.tsx` — main component

## Architecture
- **Single-panel mode (default):** Monaco editor, full height. Paste JSON, auto-validate on change.
- **Diff mode (toggle):** Monaco DiffEditor, left = original, right = modified. User pastes into both.
- **Toolbar:** Format (pretty-print) | Minify | Copy | Download | Toggle Diff mode
- **Error display:** Absolute-positioned overlay at bottom of editor (same pattern as DB editor fix) — shows line/column of JSON syntax error.
- **Indent control:** 2-space / 4-space / tab toggle.

## Key Decisions
- No external deps needed — `JSON.parse` + `JSON.stringify` for formatting, Monaco's built-in DiffEditor for diff.
- YAML support deferred — keeps scope tight. JSON only for now.
- No Card wrappers — flat panel layout matching the visual style we're going for.

## State
```
json: string                 // current editor content
error: string | null         // parse error message
indentSize: 2 | 4           // formatting indent
diffMode: boolean            // single vs diff view
diffOriginal: string         // left side of diff
diffModified: string         // right side of diff
copied: boolean              // copy feedback
```

## Behavior
1. On every keystroke → try `JSON.parse()` → show/clear error overlay
2. "Format" button → parse + stringify with indent → replace editor content
3. "Minify" button → parse + stringify with no indent → replace editor content
4. "Diff" toggle → switch between Editor and DiffEditor
5. Copy/Download work on current content

## Estimated Size
~180-220 lines
