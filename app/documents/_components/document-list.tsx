'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { Json } from '@/types/database'
import { useState, useCallback, useMemo, useTransition } from 'react'
import type { DocumentRow } from '@/types'
import { UploadModal } from './upload-modal'
import styles from './document-list.module.css'

interface Tab {
  key: string
  label: string
}

interface Props {
  documents:     DocumentRow[]
  tabs:          Tab[]
  tabCounts:     Record<string, number>
  activeTab:     string
  initialSearch: string
}

export function DocumentList({ documents, tabs, tabCounts, activeTab, initialSearch }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [docs, setDocs]             = useState(documents)
  const [search, setSearch]         = useState(initialSearch)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [sortCol, setSortCol]       = useState<keyof DocumentRow | null>(null)
  const [sortDir, setSortDir]       = useState<'asc' | 'desc'>('asc')

  const navigate = useCallback(
    (tab?: string, q?: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (tab !== undefined) tab === 'all' ? params.delete('tab') : params.set('tab', tab)
      if (q   !== undefined) q.trim()      ? params.set('search', q.trim()) : params.delete('search')
      startTransition(() => router.push(`${pathname}?${params.toString()}`))
    },
    [pathname, router, searchParams],
  )

  // Client-side search filter (instant, no round-trip)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return docs
    return docs.filter(
      d =>
        d.document_type?.toLowerCase().includes(q) ||
        d.provider?.toLowerCase().includes(q) ||
        d.summary?.toLowerCase().includes(q) ||
        d.original_name?.toLowerCase().includes(q),
    )
  }, [docs, search])

  // Client-side sort
  const sorted = useMemo(() => {
    if (!sortCol) return filtered
    return [...filtered].sort((a, b) => {
      const av = a[sortCol] ?? ''
      const bv = b[sortCol] ?? ''
      const cmp = String(av).localeCompare(String(bv), 'de')
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortCol, sortDir])

  function toggleSort(col: keyof DocumentRow) {
    if (sortCol === col) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('asc') }
  }

  const totalCostPerMonth = docs
    .reduce((sum, d) => sum + (d.cost_per_month ?? 0), 0)
    .toFixed(2)
    .replace('.', ',')

  function handleNewDocument(doc: DocumentRow) {
    setDocs(prev => [doc, ...prev])
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' })
    if (res.ok) setDocs(prev => prev.filter(d => d.id !== id))
  }

  return (
    <>
      {/* ── Sub-nav tabs ── */}
      <nav className={styles.subNav}>
        {tabs.map(t => (
          <button
            key={t.key}
            className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
            onClick={() => navigate(t.key)}
          >
            {t.label}
            {tabCounts[t.key] ? (
              <span className={styles.tabCount}>{tabCounts[t.key]}</span>
            ) : null}
          </button>
        ))}
      </nav>

      {/* ── Main ── */}
      <main className={styles.main}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon} aria-hidden>⌕</span>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Suchen nach Anbieter, Typ, Schlagwort …"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') navigate(undefined, search) }}
              aria-label="Dokumente suchen"
            />
          </div>
          <span className={styles.countLabel}>
            {sorted.length} {sorted.length === 1 ? 'Dokument' : 'Dokumente'}
            {Number(totalCostPerMonth) > 0 && ` · ${totalCostPerMonth} €/Mo`}
          </span>
          <button
            className={styles.btnAdd}
            onClick={() => setUploadOpen(true)}
            aria-label="Dokument hochladen"
          >
            + Dokument
          </button>
        </div>

        {/* Table */}
        {sorted.length === 0 ? (
          <EmptyState onUpload={() => setUploadOpen(true)} hasSearch={search.trim().length > 0} />
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <SortTh label="Dokumenttyp"   col="document_type"  style={{ width: '26%' }} sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                <SortTh label="Anbieter"       col="provider"       style={{ width: '20%' }} sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                <SortTh label="€ / Mo"         col="cost_per_month" style={{ width: '11%' }} sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                <SortTh label="ab Datum"       col="start_date"     style={{ width: '13%' }} sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                <th className={styles.th} style={{ width: '10%' }}>Status</th>
                <th className={styles.th}>Zusammenfassung</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(doc => (
                <DocumentRow key={doc.id} doc={doc} onDelete={handleDelete} />
              ))}
            </tbody>
          </table>
        )}
      </main>

      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onSuccess={handleNewDocument}
        />
      )}
    </>
  )
}

// ── SortTh ──────────────────────────────────────────────────────────────────

interface SortThProps {
  label:    string
  col:      keyof DocumentRow
  style?:   React.CSSProperties
  sortCol:  keyof DocumentRow | null
  sortDir:  'asc' | 'desc'
  onSort:   (col: keyof DocumentRow) => void
}

function SortTh({ label, col, style, sortCol, sortDir, onSort }: SortThProps) {
  const active = sortCol === col
  return (
    <th
      className={`${styles.th} ${active ? styles.thSorted : ''}`}
      style={style}
      onClick={() => onSort(col)}
    >
      {label}
      {active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
    </th>
  )
}

// ── DocumentRow ──────────────────────────────────────────────────────────────

function DocumentRow({ doc, onDelete }: { doc: DocumentRow; onDelete: (id: string) => Promise<void> }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  async function doDelete() {
    setDeleting(true)
    await onDelete(doc.id)
  }

  const hasUncertainCost =
    doc.cost_per_month !== null &&
    confScore(doc.confidence, 'canonical_cost') < 0.8

  const formattedCost =
    doc.cost_per_month !== null
      ? doc.cost_per_month.toFixed(2).replace('.', ',')
      : '—'

  const formattedDate = doc.start_date
    ? new Date(doc.start_date).toLocaleDateString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      })
    : '—'

  return (
    <tr className={styles.row}>
      <td className={styles.td}>
        <span className={styles.docType}>{doc.document_type ?? '—'}</span>
      </td>
      <td className={styles.td}>
        <span className={styles.provider}>{doc.provider ?? '—'}</span>
      </td>
      <td className={styles.td}>
        {hasUncertainCost ? (
          <span className={styles.costWarn}>
            <span className={`${styles.cost} ${styles.costAmber}`}>{formattedCost}</span>
            <span className={styles.warnIcon} title="Betrag unsicher — bitte bestätigen">!</span>
          </span>
        ) : (
          <span className={styles.cost}>{formattedCost}</span>
        )}
      </td>
      <td className={styles.td}>
        <span className={styles.date}>{formattedDate}</span>
      </td>
      <td className={styles.td}>
        <StatusChip status={doc.status} />
      </td>
      <td className={styles.td}>
        <div className={styles.summaryCell}>
          <span className={styles.summary}>{doc.summary ?? ''}</span>
          {doc.extracted_at === null && (
            <span className={styles.needsReview}>Felder ausfüllen →</span>
          )}
          {!confirming ? (
            <button
              className={styles.deleteBtn}
              onClick={() => setConfirming(true)}
              aria-label="Dokument löschen"
            >×</button>
          ) : (
            <span className={styles.deleteConfirm}>
              <button
                className={styles.deleteBtnConfirm}
                onClick={doDelete}
                disabled={deleting}
              >{deleting ? '…' : 'Löschen'}</button>
              <button
                className={styles.deleteBtnCancel}
                onClick={() => setConfirming(false)}
                disabled={deleting}
              >Abbrechen</button>
            </span>
          )}
        </div>
      </td>
    </tr>
  )
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    active:   { cls: styles.chipAktiv,     label: 'Aktiv' },
    inactive: { cls: styles.chipInaktiv,   label: 'Inaktiv' },
    unknown:  { cls: styles.chipUnbekannt, label: 'Unbekannt' },
  }
  const { cls, label } = map[status] ?? map.unknown
  return <span className={`${styles.chip} ${cls}`}>{label}</span>
}

function confScore(conf: Json, field: string): number {
  if (conf && typeof conf === 'object' && !Array.isArray(conf)) {
    const val = (conf as Record<string, unknown>)[field]
    if (typeof val === 'number') return val
  }
  return 1
}

function EmptyState({ onUpload, hasSearch }: { onUpload: () => void; hasSearch: boolean }) {
  return (
    <div className={styles.empty}>
      <p className={styles.emptyTitle}>
        {hasSearch ? 'Keine Ergebnisse gefunden.' : 'Dein digitaler Ordner ist leer.'}
      </p>
      {!hasSearch && (
        <>
          <p className={styles.emptySub}>
            Lade dein erstes Dokument hoch. PDF, bis 25 MB.
          </p>
          <button className={styles.btnAddLarge} onClick={onUpload}>
            Dokument hochladen
          </button>
        </>
      )}
    </div>
  )
}
