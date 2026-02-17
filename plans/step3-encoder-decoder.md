# Step 3: JWT / Base64 / URL Encoder-Decoder

## Goal
A multi-mode encoding/decoding utility. Three tools in one tab, switchable via sub-tabs.

## Files to Create
- `src/components/encoder/EncoderDecoder.tsx` — main component with sub-tab switching
- `src/utils/encoderUtils.ts` — pure utility functions for encoding/decoding

## Architecture
- **Sub-tabs at top:** Base64 | URL | JWT
- **Each sub-tab has:** Input textarea → Action buttons → Output textarea
- **Bidirectional:** Encode button and Decode button between input/output. Or auto-detect direction.

### Base64 Mode
- Input text → Encode → Base64 string (and reverse)
- Handle Unicode properly via `TextEncoder`/`TextDecoder`

### URL Mode
- Input text → `encodeURIComponent` / `encodeURI` → Encoded string
- Toggle between `encodeURIComponent` (strict) and `encodeURI` (loose)

### JWT Mode
- Paste a JWT token → auto-decode and show:
  - **Header** (formatted JSON, syntax-highlighted)
  - **Payload** (formatted JSON, syntax-highlighted)
  - **Expiry info**: "Expires at: {date}" / "Expired {timeago}" / "No expiry"
  - **Signature** (raw base64, not decoded — just displayed)
- This is decode-only (encoding JWTs requires a secret — out of scope)

## Key Decisions
- No external deps — all encoding/decoding is native browser APIs
- JWT decode is just base64url decode of the two parts (header.payload.signature split by `.`)
- For JWT payload display, use Monaco in read-only mode for nice JSON highlighting
- Keep it simple: no validation of JWT signatures (would need server-side)

## State
```
mode: "base64" | "url" | "jwt"
input: string
output: string
error: string | null
// URL-specific
urlEncodeMode: "component" | "uri"
// JWT-specific
jwtHeader: string | null
jwtPayload: string | null
jwtExpiry: { date: Date, expired: boolean } | null
```

## Estimated Size
- EncoderDecoder.tsx: ~280-350 lines
- encoderUtils.ts: ~80-100 lines
