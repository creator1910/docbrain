# Paperwork Second Brain — Claude Code Instructions

## Stack

- **Framework**: Next.js (App Router)
- **Database**: Supabase (EU region — `eu-central-1`)
- **AI**: Claude API (document extraction + summarization)
- **Auth**: Supabase Auth (email; Apple/Google OAuth before external users)
- **Storage**: Supabase Storage (private bucket, server-signed URLs only)
- **Language**: TypeScript throughout

## Design System

Full spec: `DESIGN.md`

**Aesthetic: Industrial / Utilitarian** — "This is serious software for serious paperwork."

| Concern | Decision |
|---------|----------|
| UI font | Barlow (all weights) |
| Condensed / headers | Barlow Condensed 700, UPPERCASE |
| Numbers / dates | IBM Plex Mono 400–500 |
| Page background | #F7F6F3 (warm cream) |
| Header bar | #1A1A1A (charcoal) |
| Accent | #D97706 amber — active tabs + warnings only |
| Status | #15803D green — aktiv chip only |
| Border radius | Near-flat: 3px chips / 4px inputs / 6px modals / 0px rows |
| Dark mode bg | #1C1917 (warm dark, not cool black) |

**Canonical reference screen**: `~/.gstack/projects/unnamed/designs/document-list-20260502/variant-E.html`

When building any new screen, match the visual weight and spacing of that reference file.

## Architecture Rules

- All file operations go through server-side API routes — never expose Supabase keys to the browser
- RLS enabled on all tables; every query is scoped to `auth.uid()`
- Private storage bucket only — generate signed URLs server-side with short TTL
- MIME validation on upload: check magic bytes, not just extension
- Sanitize all Claude-extracted output before storing or rendering
- Rate-limit the extraction endpoint (per-user, not global)

## Security Findings (addressed in plan)

Report: `C:\Vibing\unnamed\.gstack\security-reports\2026-05-02-113000.json`
- CRITICAL: private bucket (addressed — architecture uses private bucket)
- HIGH: MIME validation, path traversal, RLS enforcement, prompt injection guard
- MEDIUM: API cost cap, output sanitization, rate limiting, DSGVO erasure

## Plan File

`~/.gstack/projects/unnamed/ceo-plans/2026-05-02-paperwork-brain-design.md`

Contains full architecture spec, UI spec, security spec, and implementation lanes.

## Implementation Lanes (sequence)

1. **Lane A** — Schema + Supabase: `schema.sql`, `supabase.ts`, `types/`
2. **Lane B** (parallel after A) — Extraction engine: upload API route + Claude extraction + correction UI
3. **Lane C** (parallel after A) — UI shell: document list + tabs + search

## Skill Routing

When the user's request matches an available skill, invoke it via the Skill tool.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
