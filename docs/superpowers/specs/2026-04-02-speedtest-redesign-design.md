# Speed Test Redesign — Design Spec

## Overview

Redesign the speed test tool with a premium visual overhaul, fix speed calculation accuracy, and add SEO content (FAQ + blog post).

## Problem Statement

1. **Visual quality**: The current gauge looks crude — misaligned arcs, overlapping text, basic styling. Needs a premium, speedtest.net-caliber look.
2. **Inaccurate results**: Current code uses a simple average across all chunks (including slow warm-up). Cloudflare's official tool uses the 90th percentile, which explains result discrepancy.
3. **Missing SEO content**: No FAQ or blog post exists for the speed test tool, unlike other network tools.

## Decisions

| Decision | Choice |
|---|---|
| Overall style | Modern dashboard hybrid — gauge hero + live area chart |
| Chart type | Recharts AreaChart, X-axis = time elapsed |
| Gauge design | Neon arc with gradient glow, needle, value below pivot |
| Results layout | Redesigned 2x2 stat cards |
| Theme support | Dark and light mode via existing theme system |
| FAQ/Blog tone | Mixed — accessible FAQ, deeper blog |
| Speed calculation | 90th percentile (matching Cloudflare methodology) |
| Architecture approach | Instrument existing fetch loops with per-chunk callbacks |

## Speed Calculation Fix

### Current (broken)

Accumulates total bytes and total time across all chunks, computes a single average:

```
speed = (totalBytes * 8) / (elapsedSeconds * 1_000_000)
```

This includes slow warm-up chunks (100KB, 500KB) that don't saturate the connection, dragging the result down.

### New (90th percentile)

Each chunk records its own speed as an independent sample:

```
chunkSpeed = (chunkBytes * 8) / (chunkElapsedSeconds * 1_000_000)
samples.push(chunkSpeed)
```

Final result = 90th percentile of samples array:

```
samples.sort((a, b) => a - b)
result = samples[Math.floor(0.9 * (samples.length - 1))]
```

This filters out slow initial chunks and matches Cloudflare's methodology.

## Architecture & Data Flow

The test engine emits timestamped samples that feed the gauge, chart, and final calculation simultaneously:

```
Test Engine (fetch loops)
  |
  |-- onSample({ timestamp, speed, phase })
  |     |
  |     |-> Gauge (needle position = latest speed)
  |     |-> Area Chart (append data point)
  |     |-> Samples array (for percentile calc)
  |
  |-- onPhaseComplete({ phase, samples })
        |
        |-> Compute 90th percentile -> final result
```

### Component Decomposition

The current monolithic 427-line `SpeedTest.tsx` is split into focused components:

| Component | File | Responsibility |
|---|---|---|
| `SpeedTest` | `SpeedTest.tsx` | Orchestrator — state, test phases, samples storage |
| `SpeedGauge` | `SpeedGauge.tsx` | SVG neon arc gauge, props: `value`, `maxValue` |
| `SpeedChart` | `SpeedChart.tsx` | Recharts AreaChart, props: `data` array of `{time, speed, phase}` |
| `StatCard` | `StatCard.tsx` | Single result metric, props: value, label, rating |
| `ResultsGrid` | `ResultsGrid.tsx` | 2x2 grid of StatCards, props: full results object |

All files live under `src/components/speedtest/`.

## UI Layout

### Running State (top to bottom)

1. **Phase indicator** — small pill badge: "Measuring Latency" / "Download" / "Upload"
2. **Neon Arc Gauge** (hero) — large, centered. Needle animates smoothly to current chunk speed. Value + "Mbps" displayed below pivot point.
3. **Live Area Chart** — time elapsed on X-axis, Mbps on Y-axis. Download phase = emerald fill, upload phase = violet fill. Grows in real-time as samples arrive.
4. **Progress bar** — thin bar below chart showing overall test completion percentage.

### Complete State

1. **Gauge** — freezes at final download speed
2. **Chart** — full history of both phases, vertical divider line between download and upload
3. **Results Grid** — 2x2 stat cards:
   - Download (emerald) | Upload (violet)
   - Ping (blue) | Jitter (amber)
   - Each card: icon, label, value, unit, quality badge (Excellent/Good/Fair/Poor)
4. **Action buttons** — "Test Again" and "Reset"

## Gauge Design

Neon arc style inspired by speedtest.net:

- **Arc**: Semicircular, gradient from red (0) through amber, green, to cyan (max). SVG `linearGradient` with glow filter (`feGaussianBlur` + `feMerge`).
- **Track**: Dark muted arc behind the gradient as background.
- **Needle**: Thin white line from center pivot to arc edge, with subtle glow. Smooth CSS/SVG transition on position changes.
- **Pivot**: Small cyan dot at center bottom.
- **Value**: Large bold number + "Mbps" label positioned below the pivot — never overlapping the needle or arc.
- **Scale**: Tick marks along the arc exterior, labels at 0 / mid / max.
- **Auto-scale**: `maxValue` adjusts based on measured speeds (100, 250, 500, 1000 Mbps tiers).

### Theme Adaptation

- **Dark mode**: Dark background, bright gradient arcs with full glow filters, light text.
- **Light mode**: Light gray background, vibrant arc gradient with subtler glow, dark text, cards use light borders instead of glow effects.

Both modes use existing CSS variables (`--background`, `--foreground`, `--card`, etc.) from `globals.css`.

## FAQ Content

Added to `toolFaqs.ts` under `toolId: "speed-test"`. 10 questions targeting non-technical users:

1. What does this speed test measure?
2. How accurate is this test?
3. Why are my results different from other speed test websites?
4. What is a good internet speed?
5. What's the difference between download and upload speed?
6. What are ping and jitter?
7. Why is my internet slower than what I'm paying for?
8. How can I improve my internet speed?
9. Does this test work on mobile devices?
10. How often should I test my speed?

## Blog Post Content

Added to `blogPosts.ts` under `toolId: "speed-test"`. Semi-technical deep dive.

- **Title**: "How Internet Speed Tests Work: A Complete Guide"
- **Sections**:
  - What Is an Internet Speed Test?
  - How to Use Speed Test in ToolBox (step-by-step)
  - Understanding Your Results (download, upload, ping, jitter explained)
  - Why Different Speed Tests Give Different Results (percentile vs average, server proximity, methodology)
  - Factors That Affect Your Internet Speed (hardware, WiFi, congestion, ISP throttling)
  - Tips for Getting Accurate Speed Test Results
- **Target keywords**: "internet speed test", "how speed tests work", "download vs upload speed", "what is good internet speed", "why is my internet slow"

## Out of Scope

- Loaded latency measurement (testing latency under bandwidth load)
- Packet loss detection (requires WebRTC/TURN server)
- AIM quality scores (streaming/gaming/video ratings)
- Result history / comparison over time
- Server location / ISP detection display
