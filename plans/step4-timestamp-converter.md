# Step 4: Timestamp / Date Converter

## Goal
Bidirectional conversion between unix timestamps and human-readable dates, with timezone support, relative time, and a live clock.

## Files to Create
- `src/components/timestamp/TimestampConverter.tsx` — main component

## Architecture
- **Live clock banner:** Current time ticking in real-time, showing Unix timestamp + formatted date side by side. Small, unobtrusive, always visible at top.
- **Input section:** Single smart input — auto-detects whether you typed a unix timestamp (number) or a date string, and converts to the other.
- **Output grid:** Shows the converted value in ALL formats simultaneously:
  - Unix timestamp (seconds)
  - Unix timestamp (milliseconds)
  - ISO 8601
  - UTC string
  - Local string (user's timezone)
  - Relative time ("3 hours ago", "in 2 days")
  - Day of week, week number, day of year
- **Quick buttons:** "Now", "+1h", "+1d", "+1w", "-1h", "-1d" for quick offset
- **Timezone selector:** Dropdown to preview the same moment in different timezones (uses `Intl.DateTimeFormat`)

## Key Decisions
- No external date library (no moment/dayjs) — native `Date` + `Intl` APIs cover everything we need
- Relative time via `Intl.RelativeTimeFormat`
- Timezone list from `Intl.supportedValuesOf('timeZone')` (available in modern browsers)
- Auto-detection: if input is all digits and length <= 13, treat as timestamp. Otherwise try `new Date(input)`.

## State
```
input: string                          // raw user input
parsedDate: Date | null                // successfully parsed date
error: string | null                   // parse error
selectedTimezone: string               // e.g. "America/New_York"
now: Date                              // ticking current time (via setInterval)
```

## Behavior
1. On input change → detect format → parse → update all output formats
2. Live clock updates every second via `setInterval`
3. Quick buttons set input to formatted timestamp
4. Timezone dropdown reformats the "Local string" output
5. Copy button on each output row

## Estimated Size
~250-300 lines
