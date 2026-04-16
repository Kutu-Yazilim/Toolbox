import { type Preset } from "@/components/shared/PresetsDrawer"
import { DEFAULT_BUILDER_STATE, type BuilderState } from "./promptTypes"

function preset(builder: Partial<BuilderState>): BuilderState {
    return { ...DEFAULT_BUILDER_STATE, ...builder, examples: builder.examples ?? [] }
}

export const PROMPT_FORGE_PRESETS: Preset[] = [
    {
        name: "Fix a specific bug",
        category: "Bug Fixes",
        description: "Target a known bug with files, repro, and acceptance test",
        content: JSON.stringify(
            preset({
                intent: "fix",
                task: "Users are intermittently logged out mid-session when multiple tabs refresh at once — stop the race condition in the session cache",
                context:
                    "The session cache is written concurrently by tab-refresh handlers. Occasionally one tab's write clobbers another's, which invalidates the shared session token and logs the user out unexpectedly.",
                prior:
                    "Ruled out Redis locking (works correctly in isolation).\nReviewed middleware/session.ts — it only reads, not the source of the clobber.",
                files:
                    "src/lib/session-cache.ts\nsrc/middleware/session.ts (context only, do not modify)",
                constraints:
                    "Do not change the public API of SessionCache\nDo not add new dependencies\nExisting session tests must still pass unmodified",
                successCriteria:
                    "Two concurrent writes 10ms apart do not produce a lost-update\nAll existing tests in session-cache.test.ts still pass\nAdd one new test covering the concurrent-write scenario",
                scope: "minimal",
                autonomy: "proceed",
            }),
        ),
    },
    {
        name: "Implement a new feature",
        category: "Features",
        description: "Greenfield feature with clear acceptance criteria",
        content: JSON.stringify(
            preset({
                intent: "implement",
                task: "Add a 'copy as cURL' button to the API request panel that generates an executable curl command from the current request state",
                context:
                    "Developers frequently need to share an API call via chat or docs. Today they hand-build the curl string, which is error-prone with headers and bodies.",
                files:
                    "src/components/api/ApiRequestBuilder.tsx\nsrc/components/api/curlExporter.ts (create this)",
                constraints:
                    "Keep the new exporter pure (no React) so it's unit-testable\nEscape header and body values correctly for POSIX shells\nDo not bundle any new dependencies — use the existing utilities",
                successCriteria:
                    "Button appears next to the existing Send button\nClicking it copies a valid curl command to the clipboard\nGenerated command round-trips: running it produces the same HTTP request\nNew unit tests cover header escaping and JSON body handling",
                scope: "standard",
                autonomy: "proceed",
            }),
        ),
    },
    {
        name: "Refactor for clarity",
        category: "Refactor",
        description: "Tighten a function without changing behavior",
        content: JSON.stringify(
            preset({
                intent: "refactor",
                task: "Refactor buildCommand() in GitCommandBuilder.tsx to use a small dispatch table per operation instead of the current chain of if-branches",
                context:
                    "buildCommand has grown to ~90 lines with per-operation special-casing. New operations require scanning the whole function to figure out where to inject logic.",
                files: "src/components/gitbuilder/GitCommandBuilder.tsx",
                constraints:
                    "Preserve exact output for every existing operation — no user-visible behavior change\nDo not touch the React component, only the helper function\nKeep the file as a single module; do not split it up",
                successCriteria:
                    "All 10 operations produce identical strings for identical inputs\nLine count of buildCommand drops below 40\nNo new top-level exports",
                scope: "minimal",
                autonomy: "proceed",
            }),
        ),
    },
    {
        name: "Investigate / research only",
        category: "Research",
        description: "Read-only exploration with written findings",
        content: JSON.stringify(
            preset({
                intent: "investigate",
                task: "Figure out why the json-to-types tool produces duplicate interface names when the input JSON has the same object shape appearing under different keys",
                context:
                    "A user reported that pasting { a: {x:1}, b: {x:1} } produces two interfaces named the same, which is invalid TypeScript. I want to understand the root cause before deciding on a fix.",
                files:
                    "src/components/jsontypes/JsonToTypes.tsx\nsrc/components/jsontypes/typeInference.ts",
                constraints: "Do not change any code. This is a diagnosis, not a fix.",
                successCriteria:
                    "Produce a written explanation of the root cause\nIdentify the exact line(s) where deduplication should happen\nList 2–3 options for fixing it with tradeoffs",
                outputFormat: "Markdown with sections: Root cause, Location, Options",
                scope: "minimal",
                autonomy: "proceed",
            }),
        ),
    },
    {
        name: "Write tests",
        category: "Testing",
        description: "Cover an existing module with focused tests",
        content: JSON.stringify(
            preset({
                intent: "test",
                task: "Write unit tests for toSlug() in SlugGenerator.tsx, covering transliteration, separator handling, and edge cases",
                context:
                    "The slug helper is used across the app but has zero test coverage. We've had three bug reports in the last quarter that tests would have caught.",
                files:
                    "src/components/slug/SlugGenerator.tsx (source)\nsrc/components/slug/toSlug.test.ts (create this)",
                constraints:
                    "Use the existing test runner (Vitest) and no new dependencies\nDo not modify toSlug() itself",
                successCriteria:
                    "Cover: Turkish/German/French/Polish/Czech/Scandinavian transliteration, hyphen + underscore separators, empty input, leading/trailing separators, numerics\nAll new tests pass\nCoverage of toSlug reaches ≥95%",
                scope: "standard",
                autonomy: "proceed",
            }),
        ),
    },
    {
        name: "Code review (find issues)",
        category: "Review",
        description: "Surface bugs and risks in a pending change",
        content: JSON.stringify(
            preset({
                persona:
                    "You are a senior engineer reviewing a pull request. Your job is coverage: find every issue, even low-confidence ones, so a human reviewer can filter.",
                intent: "review",
                task: "Review the pending changes on the current branch for correctness, security, and maintainability issues",
                context:
                    "This PR touches authentication flow. I want a thorough review before merge. Our bar is: anything that could cause incorrect behavior, a test failure, or a misleading result. Nits about style are out of scope.",
                files: "Run `git diff main...HEAD` to see the change set",
                constraints:
                    "Do not rewrite the code; only surface findings\nReport every issue regardless of confidence, so a downstream filter can rank",
                successCriteria:
                    "For each finding: file, line range, severity (high/med/low), confidence, description, suggested direction\nGroup findings by severity",
                outputFormat:
                    "Markdown table grouped by severity with columns: File:line, Confidence, Description, Suggestion",
                scope: "comprehensive",
                autonomy: "confirm",
            }),
        ),
    },
    {
        name: "Performance optimization",
        category: "Performance",
        description: "Target a measurable bottleneck",
        content: JSON.stringify(
            preset({
                intent: "optimize",
                task: "Reduce the first-paint time of the ChartBuilder component — currently ~850ms on mid-range hardware, we want under 300ms",
                context:
                    "Chart.js is eagerly imported at module load, which blocks the main bundle. The component is only shown inside a tool that 10% of users visit, so the cost is wasted on everyone else.",
                files:
                    "src/components/chartbuilder/ChartBuilder.tsx\nsrc/app/[category]/[tool]/client.tsx (for dynamic import)",
                constraints:
                    "Do not regress the fully-loaded UX: hover, tooltip, and export must still work\nKeep the existing API of the component unchanged\nNo new dependencies",
                successCriteria:
                    "First paint under 300ms measured via performance.mark\nMain bundle size drops by at least 100KB gzipped\nAll existing chart interactions still work",
                scope: "standard",
                autonomy: "proceed",
            }),
        ),
    },
    {
        name: "Docs / explain code",
        category: "Documentation",
        description: "Produce developer-facing documentation",
        content: JSON.stringify(
            preset({
                intent: "document",
                task: "Write a README section explaining how the useShareableUrl hook works, with a small example and the URL format it produces",
                context:
                    "New contributors keep reinventing URL state handling because they don't know the hook exists. We want a discoverable 'State sharing' section in the README.",
                files:
                    "src/hooks/useShareableUrl.ts\nREADME.md (target)",
                constraints:
                    "Keep it under 60 lines of markdown\nNo marketing tone — this is a dev doc\nDo not change hook behavior",
                successCriteria:
                    "Explains: what it does, why LZ-String is used, the #s= hash format, and the restore lifecycle\nIncludes one minimal code sample under 15 lines",
                outputFormat: "Markdown ready to paste into README.md under a ## State sharing heading",
                scope: "minimal",
                autonomy: "proceed",
            }),
        ),
    },
]
