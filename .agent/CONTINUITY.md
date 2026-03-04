[PLANS]
- 2026-02-20T19:08Z [USER] Fix Tree input behavior so pressing `Tab` inserts indentation in the textarea instead of moving browser focus.

[DECISIONS]
- 2026-02-20T19:08Z [CODE] Implement `onKeyDown` on the Tree input textarea to intercept `Tab`, call `preventDefault()`, and insert two spaces via `setRangeText(...)`.
- 2026-02-20T19:08Z [CODE] Keep `Shift+Tab` untouched to preserve standard backward focus navigation.

[PROGRESS]
- 2026-02-20T19:08Z [CODE] Updated `/Users/utkualpturen/Developer/KutuYazılım/Projects/kutu-tree/src/components/tree/TreeCreator.tsx` with `handleInputKeyDown` and wired it to textarea `onKeyDown`.
- 2026-02-20T19:08Z [TOOL] Validation run: `npm run build` passed.

[DISCOVERIES]
- 2026-02-20T19:08Z [TOOL] `.agent/CONTINUITY.md` did not exist before this task (`UNCONFIRMED` whether it existed previously outside current workspace snapshot).
- 2026-02-20T19:08Z [TOOL] `npm run lint` fails due pre-existing issues unrelated to this task in board/color/json/regex/ui files.
- 2026-02-20T19:08Z [TOOL] Primary references confirm `KeyboardEvent.preventDefault()` and textarea range APIs are the standard way to override default `Tab` focus behavior.

[OUTCOMES]
- 2026-02-20T19:08Z [CODE] Tree input now inserts indentation when `Tab` is pressed.
- 2026-02-20T19:08Z [ASSUMPTION] Two spaces are the intended indent width, matching the existing Tree example input style.
