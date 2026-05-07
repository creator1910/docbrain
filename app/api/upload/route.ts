import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { extractDocument } from '@/lib/extraction'
import type { Json, DocumentInsert } from '@/types/database'

// Max file size: 25 MB (safe for both local and Vercel deployments)
// For files > 25 MB, compress the PDF before uploading.
const MAX_BYTES = 25 * 1024 * 1024

const MAGIC: Record<string, { mime: string; ext: string }> = {
  '25504446': { mime: 'application/pdf', ext: 'pdf' },  // %PDF
  'ffd8ffe0': { mime: 'image/jpeg',      ext: 'jpg' },
  'ffd8ffe1': { mime: 'image/jpeg',      ext: 'jpg' },
  'ffd8ffe2': { mime: 'image/jpeg',      ext: 'jpg' },
  'ffd8ffdb': { mime: 'image/jpeg',      ext: 'jpg' },
  '89504e47': { mime: 'image/png',       ext: 'png' },
}

function detectMime(buf: Buffer) {
  const hex = buf.subarray(0, 4).toString('hex').toLowerCase()
  return MAGIC[hex] ?? null
}

export const maxDuration = 100  // allow up to 90s extraction + buffer

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File exceeds ${MAX_BYTES / 1024 / 1024} MB limit. Compress the PDF and try again.` },
      { status: 413 },
    )
  }

  const bytes = await file.arrayBuffer()
  const buf   = Buffer.from(bytes)
  const detected = detectMime(buf)

  if (!detected) {
    return NextResponse.json(
      { error: 'Unsupported file type. Upload a PDF or JPEG/PNG image.' },
      { status: 415 },
    )
  }

  const contentHash = createHash('sha256').update(buf).digest('hex')

  // Duplicate detection
  const { data: existing } = await supabase
    .from('documents')
    .select('id')
    .eq('content_hash', contentHash)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'Dieses Dokument wurde bereits hochgeladen.', existing_id: existing.id },
      { status: 409 },
    )
  }

  // Storage path is always server-generated — never derived from user input
  const storagePath = `${user.id}/${randomUUID()}.${detected.ext}`

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, buf, { contentType: detected.mime, upsert: false })

  if (uploadError) {
    console.error('[upload] Storage error', { userId: user.id, error: uploadError.message })
    return NextResponse.json({ error: 'Upload fehlgeschlagen. Bitte erneut versuchen.' }, { status: 500 })
  }

  // Extraction — timeout after 90s; save with empty fields if it fails
  let extraction = null
  let extractionFailed = false
  try {
    const signal = AbortSignal.timeout(90_000)
    extraction = await Promise.race([
      extractDocument(buf, detected.mime as 'application/pdf' | 'image/jpeg' | 'image/png'),
      new Promise<never>((_, reject) => signal.addEventListener('abort', () => reject(new Error('timeout')))),
    ])
  } catch (err) {
    extractionFailed = true
    console.error('[upload] Extraction error', { userId: user.id, error: String(err) })
  }

  // Build typed insert — extraction fields cast to Json for jsonb columns
  const insertData: DocumentInsert = {
    user_id:       user.id,
    file_path:     storagePath,
    original_name: file.name,
    extracted_at:  extraction ? new Date().toISOString() : null,
    content_hash:  contentHash,
    ...(extraction
      ? {
          document_type:     extraction.document_type,
          provider:          extraction.provider,
          summary:           extraction.summary,
          start_date:        extraction.start_date,
          end_date:          extraction.end_date,
          status:            extraction.status,
          canonical_cost:    extraction.canonical_cost,
          billing_frequency: extraction.billing_frequency,
          extras:            extraction.extras as Json,
          confidence:        extraction.confidence as Json,
        }
      : {}),
  }

  // Insert record
  const { data: doc, error: insertError } = await supabase
    .from('documents')
    .insert(insertData)
    .select()
    .single()

  if (insertError) {
    // Roll back the storage upload
    await supabase.storage.from('documents').remove([storagePath])
    console.error('[upload] DB insert error', { userId: user.id, error: insertError.message })
    return NextResponse.json({ error: 'Dokument konnte nicht gespeichert werden.' }, { status: 500 })
  }

  return NextResponse.json(
    { document: doc, extraction_failed: extractionFailed },
    { status: 201 },
  )
}
