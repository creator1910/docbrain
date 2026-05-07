-- ─────────────────────────────────────────────────────────────────────────────
-- Paperwork Second Brain — Initial Schema
-- Run via: supabase db push (after supabase init + linking project)
-- Supabase region: eu-central-1
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Documents ───────────────────────────────────────────────────────────────

CREATE TABLE documents (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path          text        NOT NULL,         -- Supabase Storage path: {userId}/{uuid}.pdf
  original_name      text,                         -- uploaded filename, for display only
  extracted_at       timestamptz,

  -- Core extracted fields
  document_type      text,                         -- Versicherung | Vertrag | Behörde | Gehalt | Bank | Sonstige
  provider           text,                         -- Allianz, Finanzamt Berlin, Deutsche Bank, etc.
  summary            text,                         -- 1-sentence German summary from Claude
  start_date         date,
  end_date           date,
  status             text        NOT NULL DEFAULT 'unknown',  -- active | inactive | unknown

  -- Cost — nullable (Behörde letters, salary slips have no recurring cost)
  -- Store the canonical figure as quoted in the document, plus the billing cadence.
  -- cost_per_month is derived from these two fields.
  canonical_cost     numeric(10, 2),               -- amount as stated in document
  billing_frequency  text,                         -- monthly | annually | one_time | null

  -- Computed: normalised monthly cost for totals and sorting
  cost_per_month     numeric(10, 2) GENERATED ALWAYS AS (
    CASE billing_frequency
      WHEN 'monthly'   THEN canonical_cost
      WHEN 'annually'  THEN round(canonical_cost / 12, 2)
      ELSE NULL
    END
  ) STORED,

  -- Flexible metadata — provider-specific or category-specific extra fields
  extras             jsonb       NOT NULL DEFAULT '{}'::jsonb,

  -- Per-field confidence scores from Claude (0.0–1.0)
  -- e.g. {"provider": 0.95, "canonical_cost": 0.71, "end_date": 0.58}
  confidence         jsonb       NOT NULL DEFAULT '{}'::jsonb,

  -- Full-text search index (updated by trigger, German dictionary)
  search_vector      tsvector,

  -- SHA-256 of uploaded file bytes; used for duplicate detection
  content_hash       text,

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ─── Constraints ─────────────────────────────────────────────────────────────

ALTER TABLE documents ADD CONSTRAINT documents_status_check
  CHECK (status IN ('active', 'inactive', 'unknown'));

ALTER TABLE documents ADD CONSTRAINT documents_document_type_check
  CHECK (document_type IS NULL OR document_type IN (
    'Versicherung', 'Vertrag', 'Behörde', 'Gehalt', 'Bank', 'Sonstige'
  ));

ALTER TABLE documents ADD CONSTRAINT documents_billing_frequency_check
  CHECK (billing_frequency IS NULL OR billing_frequency IN (
    'monthly', 'annually', 'one_time'
  ));

ALTER TABLE documents ADD CONSTRAINT documents_canonical_cost_check
  CHECK (canonical_cost IS NULL OR (canonical_cost >= 0 AND canonical_cost < 100000));

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_documents_user_id      ON documents (user_id);
CREATE INDEX idx_documents_search       ON documents USING GIN (search_vector);
CREATE INDEX idx_documents_content_hash ON documents (content_hash);
CREATE INDEX idx_documents_type         ON documents (document_type);
CREATE INDEX idx_documents_status       ON documents (status);
CREATE INDEX idx_documents_created_at   ON documents (created_at DESC);

-- ─── Full-text search trigger ────────────────────────────────────────────────
-- German dictionary: handles umlauts + compound word stemming
-- (Versicherung → versicher, Haftpflicht → haftpflicht)

CREATE OR REPLACE FUNCTION documents_search_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('german',
      coalesce(NEW.document_type, '') || ' ' ||
      coalesce(NEW.provider,      '') || ' ' ||
      coalesce(NEW.summary,       '') || ' ' ||
      coalesce(NEW.original_name, '') || ' ' ||
      coalesce(NEW.extras::text,  '')
    );
  RETURN NEW;
END
$$;

CREATE TRIGGER documents_search_trigger
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION documents_search_update();

-- ─── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$$;

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Each user can only read/write their own rows.
-- NEVER disable RLS on this table.

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_select ON documents
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY documents_insert ON documents
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY documents_update ON documents
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY documents_delete ON documents
  FOR DELETE USING (user_id = auth.uid());

-- ─── Storage ──────────────────────────────────────────────────────────────────
-- Configure in Supabase dashboard → Storage → New bucket:
--   Name:    documents
--   Public:  OFF  ← CRITICAL — private bucket, signed URLs only
--   Allowed MIME types: application/pdf, image/jpeg, image/png, image/heic
--   Max file size: 100 MB
--
-- Storage RLS policies (run in SQL editor after creating the bucket):

/*
CREATE POLICY "Users can upload their own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read their own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
*/
