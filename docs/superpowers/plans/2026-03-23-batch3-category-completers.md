# Batch 3: Category Completers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 20 tools to deepen existing categories and complete the new Security and Image Tools categories.

**Architecture:** Each tool follows existing component/registry/router pattern. Two new categories need route groups: Image Tools. One new dependency: `asn1js` for Certificate Decoder.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide icons, Monaco Editor (existing), html-to-image (existing), qr-code-styling (existing), jszip (existing).

**Spec:** `docs/superpowers/specs/2026-03-23-tool-expansion-design.md` — Batch 3 section.

---

## Tasks Overview (20 tools, grouped by category)

### Design (3 tools)
- Task 1: Gradient Generator (CSS + Flutter export)
- Task 2: Box Shadow Generator (CSS + Flutter export)
- Task 3: SVG Icon Editor (Lucide icons)

### Network (2 tools)
- Task 4: SSL Certificate Checker (needs backend — stub with demo mode)
- Task 5: HTTP Headers Inspector (needs backend — stub with demo mode)

### Dev Tools (3 tools)
- Task 6: .env Editor
- Task 7: Git Command Builder
- Task 8: Code Screenshot

### Security (4 tools)
- Task 9: Encryption Tool
- Task 10: Certificate Decoder
- Task 11: TOTP Generator
- Task 12: CSP Header Builder

### Image Tools (8 tools — new category)
- Task 13: Image Tools category setup + Image Resizer
- Task 14: Image Cropper
- Task 15: Image Compressor
- Task 16: Format Converter
- Task 17: Color Picker from Image
- Task 18: Placeholder Image
- Task 19: Image to Base64
- Task 20: Favicon Generator
