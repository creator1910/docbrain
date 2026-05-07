# DocBrain — Paperwork Second Brain

A private document intelligence app that extracts, organises, and surfaces the key facts buried in your paperwork — contracts, insurance policies, salary slips, government letters — using Claude AI.

Upload a PDF. Claude reads it and fills in the fields: document type, provider, cost, dates, status. You review uncertain values. Everything is stored securely and searchable.

---

## Features

- **AI extraction** — Claude reads uploaded PDFs and extracts structured fields (type, provider, cost, dates, status, summary)
- **Confidence flags** — uncertain values are highlighted for manual review; confirmed fields revert to normal styling
- **Cost overview** — canonical costs normalised to monthly figures for an at-a-glance total
- **Full-text search** — German-language tsvector index with umlaut and compound-word stemming
- **Duplicate detection** — SHA-256 content hash prevents re-uploading the same file
- **Tab navigation** — filter documents by category: Versicherung, Vertrag, Behörde, Gehalt, Bank, Sonstige
- **Private by design** — all files stored in a private Supabase bucket; signed URLs only, never public

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | Supabase Postgres (EU — `eu-central-1`) |
| Auth | Supabase Auth (email; Apple/Google OAuth) |
| Storage | Supabase Storage (private bucket) |
| AI | Anthropic Claude API (`@anthropic-ai/sdk`) |

---

## Project Structure

```
app/
  (auth)/login/        # Login page + server actions
  api/
    documents/         # GET documents list
    upload/            # POST upload + Claude extraction
  auth/callback/       # Supabase OAuth callback
  documents/           # Main document list page
    _components/       # DocumentList, UploadModal
components/
  header-bar.tsx       # Top navigation bar
db/
  schema.sql           # Full Postgres schema with RLS
lib/
  extraction.ts        # Claude extraction logic
  supabase/
    client.ts          # Browser Supabase client
    server.ts          # Server-side Supabase client (cookie-based)
types/
  database.ts          # Generated Supabase types
  index.ts             # Shared app types
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (EU region recommended)
- An [Anthropic](https://console.anthropic.com) API key

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-secret-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ANTHROPIC_API_KEY=<anthropic-api-key>
```

### 3. Set up the database

Run the schema against your Supabase project:

```bash
# Via Supabase CLI
supabase db push

# Or paste db/schema.sql directly into the Supabase SQL editor
```

### 4. Create the storage bucket

In the Supabase dashboard → Storage → New bucket:

- **Name**: `documents`
- **Public**: OFF (private bucket — signed URLs only)
- **Allowed MIME types**: `application/pdf`, `image/jpeg`, `image/png`, `image/heic`
- **Max file size**: 100 MB

Then run the storage RLS policies from the bottom of `db/schema.sql`.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database Schema

The `documents` table stores everything extracted from each file:

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner (FK → `auth.users`) |
| `file_path` | text | Supabase Storage path: `{userId}/{uuid}.pdf` |
| `document_type` | text | Versicherung / Vertrag / Behörde / Gehalt / Bank / Sonstige |
| `provider` | text | e.g. Allianz, Finanzamt Berlin, Deutsche Bank |
| `summary` | text | One-sentence German summary from Claude |
| `start_date` / `end_date` | date | Contract/policy validity period |
| `status` | text | `active` / `inactive` / `unknown` |
| `canonical_cost` | numeric | Amount as stated in the document |
| `billing_frequency` | text | `monthly` / `annually` / `one_time` |
| `cost_per_month` | numeric | Computed — normalised monthly figure |
| `confidence` | jsonb | Per-field Claude confidence scores (0.0–1.0) |
| `extras` | jsonb | Provider-specific or category-specific extra fields |
| `content_hash` | text | SHA-256 of file bytes (duplicate detection) |

Row Level Security is enabled on all tables. Every query is scoped to `auth.uid()`.

---

## Security

- **Private storage bucket** — files are never publicly accessible; all URLs are server-signed with a short TTL
- **RLS on all tables** — users can only read and write their own rows
- **MIME validation** — magic bytes checked on upload, not just file extension
- **Output sanitization** — all Claude-extracted content is sanitized before storage or rendering
- **Rate limiting** — extraction endpoint is rate-limited per user
- **No secrets in the browser** — `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` are server-only; Supabase anon key is the only credential exposed to the client

---

## Design System

Industrial / utilitarian aesthetic — "serious software for serious paperwork."

| Token | Value |
|-------|-------|
| UI font | Barlow |
| Headers / chips | Barlow Condensed 700, UPPERCASE |
| Numbers / dates | IBM Plex Mono |
| Page background | `#F7F6F3` warm cream |
| Header bar | `#1A1A1A` charcoal |
| Accent | `#D97706` amber — active tabs + warnings only |
| Border radius | Near-flat: 3px chips / 4px inputs / 6px modals |
| Dark mode bg | `#1C1917` warm dark |

Full spec: [`DESIGN.md`](DESIGN.md)

---

## License

Private — all rights reserved.
