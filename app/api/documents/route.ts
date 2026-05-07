import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { DocumentType, DocumentUpdate } from '@/types/database'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const tab    = searchParams.get('tab')    ?? 'all'
  const search = searchParams.get('search') ?? ''
  const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '50', 10), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0',  10), 0)

  let query = supabase
    .from('documents')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (tab !== 'all') {
    query = query.eq('document_type', tab as DocumentType)
  }

  if (search.trim()) {
    query = query.textSearch('search_vector', search.trim(), {
      config: 'german',
      type: 'plain',
    })
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ documents: data ?? [], total: count ?? 0 })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Strip read-only / identity fields then cast to typed Update shape
  const { id: _id, user_id: _uid, cost_per_month: _gen, content_hash: _hash, ...rest } = body as Record<string, unknown>
  const updates = rest as unknown as DocumentUpdate

  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ document: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Fetch file_path before deleting (RLS ensures this is the user's document)
  const { data: doc } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', id)
    .single()

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  // Clean up storage file (best-effort)
  await supabase.storage.from('documents').remove([doc.file_path])

  return NextResponse.json({ ok: true })
}
