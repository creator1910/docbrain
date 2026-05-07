import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HeaderBar } from '@/components/header-bar'
import { DocumentList } from './_components/document-list'
import type { DocumentRow, DocumentType } from '@/types/database'

interface Props {
  searchParams: Promise<{ tab?: string; search?: string }>
}

const TABS = [
  { key: 'all',           label: 'Alle' },
  { key: 'Versicherung',  label: 'Versicherungen' },
  { key: 'Vertrag',       label: 'Verträge' },
  { key: 'Behörde',       label: 'Behörde' },
  { key: 'Bank',          label: 'Bank' },
  { key: 'Gehalt',        label: 'Gehalt' },
  { key: 'Sonstige',      label: 'Sonstiges' },
]

export default async function DocumentsPage({ searchParams }: Props) {
  const { tab = 'all', search = '' } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch documents with optional type filter
  let query = supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (tab !== 'all') {
    query = query.eq('document_type', tab as DocumentType)
  }

  const { data: documents } = await query

  // Count per tab for badges
  const { data: counts } = await supabase
    .from('documents')
    .select('document_type')

  const tabCounts: Record<string, number> = { all: counts?.length ?? 0 }
  for (const row of counts ?? []) {
    const t = row.document_type ?? 'Sonstige'
    tabCounts[t] = (tabCounts[t] ?? 0) + 1
  }

  return (
    <>
      <HeaderBar />
      <DocumentList
        documents={documents as DocumentRow[] ?? []}
        tabs={TABS}
        tabCounts={tabCounts}
        activeTab={tab}
        initialSearch={search}
      />
    </>
  )
}
