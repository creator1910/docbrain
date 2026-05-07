export type {
  Database,
  DocumentRow,
  DocumentInsert,
  DocumentUpdate,
  DocumentStatus,
  DocumentType,
  BillingFrequency,
} from './database'

// ─── Domain aliases ───────────────────────────────────────────────────────────

// The canonical in-app Document type — matches database row
export type { DocumentRow as Document } from './database'

// ─── Extraction types ─────────────────────────────────────────────────────────

export interface ConfidenceScores {
  document_type?: number
  provider?: number
  summary?: number
  start_date?: number
  end_date?: number
  status?: number
  canonical_cost?: number
  billing_frequency?: number
  [key: string]: number | undefined
}

// Structured output from Claude's extraction step.
// All fields are nullable — Claude may not be able to extract every field.
export interface ExtractionResult {
  document_type: import('./database').DocumentType | null
  provider: string | null
  summary: string | null
  start_date: string | null  // ISO 8601 date: YYYY-MM-DD
  end_date: string | null
  status: import('./database').DocumentStatus
  canonical_cost: number | null
  billing_frequency: import('./database').BillingFrequency | null
  extras: Record<string, unknown>
  confidence: ConfidenceScores
}

// Confidence thresholds — drives UI rendering
export const CONFIDENCE = {
  HIGH: 0.8,    // display normally
  MEDIUM: 0.6,  // amber highlight — prompt for confirmation
  // < 0.6      // show blank — prompt for manual entry
} as const

// Upload / extraction pipeline state
export type UploadState =
  | 'idle'
  | 'selecting'
  | 'uploading'
  | 'extracting'
  | 'review'
  | 'confirmed'
  | 'upload_failed'
  | 'extraction_failed'
  | 'extraction_timeout'

// Batch extraction queue item
export interface BatchItem {
  file: File
  uploadedPath?: string
  state: UploadState
  result?: ExtractionResult
  error?: string
}
