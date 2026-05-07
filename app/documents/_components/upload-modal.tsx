'use client'

import { useRef, useState, useCallback } from 'react'
import type { DocumentRow } from '@/types'
import type { Json } from '@/types/database'
import { CONFIDENCE } from '@/types'
import styles from './upload-modal.module.css'

function confScore(conf: Json, field: string): number {
  if (conf && typeof conf === 'object' && !Array.isArray(conf)) {
    const val = (conf as Record<string, unknown>)[field]
    if (typeof val === 'number') return val
  }
  return 1
}

interface Props {
  onClose:   () => void
  onSuccess: (doc: DocumentRow) => void
}

type Phase = 'pick' | 'uploading' | 'extracting' | 'review' | 'done' | 'error'

export function UploadModal({ onClose, onSuccess }: Props) {
  const [phase, setPhase]       = useState<Phase>('pick')
  const [file,  setFile]        = useState<File | null>(null)
  const [isDragOver, setDragOver] = useState(false)
  const [progress, setProgress] = useState(0)
  const [doc, setDoc]           = useState<DocumentRow | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [edits, setEdits]       = useState<Partial<DocumentRow>>({})
  const [saving, setSaving]     = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Drag and drop ────────────────────────────────────────
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(true)
  }, [])
  const onDragLeave = useCallback(() => setDragOver(false), [])
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) pickFile(f)
  }, [])

  function pickFile(f: File) {
    setFile(f)
    upload(f)
  }

  // ── Upload ───────────────────────────────────────────────
  async function upload(f: File) {
    setPhase('uploading')
    setProgress(0)

    const formData = new FormData()
    formData.append('file', f)

    // Simulate upload progress (XHR gives real progress; fetch doesn't)
    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 15, 85))
    }, 200)

    let json: { document?: DocumentRow; extraction_failed?: boolean; error?: string }
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      clearInterval(progressInterval)
      setProgress(100)
      json = await res.json()

      if (!res.ok) {
        setErrorMsg(json.error ?? 'Upload fehlgeschlagen.')
        setPhase('error')
        return
      }
    } catch {
      clearInterval(progressInterval)
      setErrorMsg('Netzwerkfehler. Bitte erneut versuchen.')
      setPhase('error')
      return
    }

    if (!json.document) { setErrorMsg('Kein Dokument zurückgegeben.'); setPhase('error'); return }

    setPhase('extracting')

    // Extraction already happened server-side; simulate brief review delay
    await new Promise(r => setTimeout(r, 600))

    setDoc(json.document)
    setEdits({})
    setPhase('review')
  }

  // ── Confirm edits ────────────────────────────────────────
  async function confirmAndClose() {
    if (!doc) return
    setSaving(true)

    if (Object.keys(edits).length > 0) {
      try {
        const res = await fetch(`/api/documents?id=${doc.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(edits),
        })
        if (res.ok) {
          const json = await res.json()
          onSuccess(json.document ?? doc)
        } else {
          onSuccess(doc)
        }
      } catch {
        onSuccess(doc)
      }
    } else {
      onSuccess(doc)
    }

    setSaving(false)
    onClose()
  }

  function fieldConfidence(field: string) {
    return doc ? confScore(doc.confidence, field) : 1
  }

  function isUncertain(field: string) {
    return fieldConfidence(field) < CONFIDENCE.HIGH
  }

  function fieldValue<K extends keyof DocumentRow>(field: K): DocumentRow[K] {
    return (edits[field] !== undefined ? edits[field] : doc?.[field]) as DocumentRow[K]
  }

  function setEdit<K extends keyof DocumentRow>(field: K, value: DocumentRow[K]) {
    setEdits(prev => ({ ...prev, [field]: value }))
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Dokument hochladen">
        <div className={styles.header}>
          <span className={styles.title}>
            {phase === 'pick'       && 'Dokument hochladen'}
            {phase === 'uploading'  && 'Wird hochgeladen…'}
            {phase === 'extracting' && 'Claude liest…'}
            {phase === 'review'     && 'Felder prüfen'}
            {phase === 'error'      && 'Fehler'}
          </span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Schließen">×</button>
        </div>

        <div className={styles.body}>
          {/* ── Pick phase ── */}
          {phase === 'pick' && (
            <div
              className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ''}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
            >
              <div className={styles.dropIcon}>↑</div>
              <p className={styles.dropTitle}>PDF hier ablegen</p>
              <p className={styles.dropSub}>oder klicken zum Auswählen · max. 25 MB</p>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                hidden
                onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f) }}
              />
            </div>
          )}

          {/* ── Upload progress ── */}
          {phase === 'uploading' && (
            <div className={styles.progressWrap}>
              <p className={styles.progressFilename}>{file?.name}</p>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
              <p className={styles.progressLabel}>{progress}%</p>
            </div>
          )}

          {/* ── Extracting ── */}
          {phase === 'extracting' && (
            <div className={styles.extractingWrap}>
              <div className={styles.spinner} />
              <p className={styles.extractingText}>Claude liest dein Dokument…</p>
              <p className={styles.extractingSub}>Das dauert normalerweise 5–30 Sekunden.</p>
            </div>
          )}

          {/* ── Review ── */}
          {phase === 'review' && doc && (
            <div className={styles.reviewWrap}>
              {doc.extracted_at === null && (
                <p className={styles.reviewWarn}>
                  Extraktion fehlgeschlagen — bitte Felder manuell ausfüllen.
                </p>
              )}
              <div className={styles.fields}>
                <ReviewField
                  label="Dokumenttyp"
                  uncertain={isUncertain('document_type')}
                  hint={isUncertain('document_type') ? 'Bitte bestätigen' : undefined}
                >
                  <select
                    className={`${styles.input} ${isUncertain('document_type') ? styles.inputWarn : ''}`}
                    value={String(fieldValue('document_type') ?? '')}
                    onChange={e => setEdit('document_type', e.target.value as DocumentRow['document_type'])}
                  >
                    <option value="">— bitte wählen —</option>
                    {['Versicherung','Vertrag','Behörde','Gehalt','Bank','Sonstige'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </ReviewField>

                <ReviewField
                  label="Anbieter"
                  uncertain={isUncertain('provider')}
                  hint={isUncertain('provider') ? `Konfidenz ${Math.round(fieldConfidence('provider') * 100)}%` : undefined}
                >
                  <input
                    className={`${styles.input} ${isUncertain('provider') ? styles.inputWarn : ''}`}
                    value={String(fieldValue('provider') ?? '')}
                    onChange={e => setEdit('provider', e.target.value)}
                    placeholder="z.B. Allianz, Finanzamt Berlin"
                  />
                </ReviewField>

                <ReviewField
                  label="Betrag / Monat (€)"
                  uncertain={isUncertain('canonical_cost')}
                  hint={isUncertain('canonical_cost') ? 'Betrag unsicher — bitte bestätigen' : undefined}
                >
                  <div className={styles.costRow}>
                    <input
                      className={`${styles.input} ${styles.inputMono} ${isUncertain('canonical_cost') ? styles.inputWarn : ''}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={fieldValue('canonical_cost') ?? ''}
                      onChange={e => setEdit('canonical_cost', e.target.value ? Number(e.target.value) : null)}
                      placeholder="0,00"
                    />
                    <select
                      className={styles.input}
                      value={String(fieldValue('billing_frequency') ?? '')}
                      onChange={e => setEdit('billing_frequency', (e.target.value || null) as DocumentRow['billing_frequency'])}
                    >
                      <option value="">—</option>
                      <option value="monthly">monatlich</option>
                      <option value="annually">jährlich</option>
                      <option value="one_time">einmalig</option>
                    </select>
                  </div>
                </ReviewField>

                <ReviewField label="Zusammenfassung" uncertain={isUncertain('summary')}>
                  <input
                    className={`${styles.input} ${isUncertain('summary') ? styles.inputWarn : ''}`}
                    value={String(fieldValue('summary') ?? '')}
                    onChange={e => setEdit('summary', e.target.value)}
                    placeholder="Ein Satz über das Dokument"
                  />
                </ReviewField>

                <div className={styles.fieldRow}>
                  <ReviewField label="Gültig ab" uncertain={isUncertain('start_date')}>
                    <input
                      className={`${styles.input} ${isUncertain('start_date') ? styles.inputWarn : ''}`}
                      type="date"
                      value={String(fieldValue('start_date') ?? '')}
                      onChange={e => setEdit('start_date', e.target.value || null)}
                    />
                  </ReviewField>
                  <ReviewField label="Gültig bis" uncertain={isUncertain('end_date')}>
                    <input
                      className={`${styles.input} ${isUncertain('end_date') ? styles.inputWarn : ''}`}
                      type="date"
                      value={String(fieldValue('end_date') ?? '')}
                      onChange={e => setEdit('end_date', e.target.value || null)}
                    />
                  </ReviewField>
                </div>

                <ReviewField label="Status" uncertain={false}>
                  <select
                    className={styles.input}
                    value={String(fieldValue('status') ?? 'unknown')}
                    onChange={e => setEdit('status', e.target.value as DocumentRow['status'])}
                  >
                    <option value="active">Aktiv</option>
                    <option value="inactive">Inaktiv</option>
                    <option value="unknown">Unbekannt</option>
                  </select>
                </ReviewField>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {phase === 'error' && (
            <div className={styles.errorWrap}>
              <p className={styles.errorMsg}>{errorMsg}</p>
              <button
                className={styles.btnSecondary}
                onClick={() => { setPhase('pick'); setFile(null); setProgress(0) }}
              >
                Erneut versuchen
              </button>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {phase === 'review' && (
          <div className={styles.footer}>
            <button className={styles.btnSecondary} onClick={onClose} disabled={saving}>
              Abbrechen
            </button>
            <button
              className={styles.btnPrimary}
              onClick={confirmAndClose}
              disabled={saving}
            >
              {saving ? 'Wird gespeichert…' : 'Bestätigen & speichern'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── ReviewField ───────────────────────────────────────────

interface ReviewFieldProps {
  label:     string
  uncertain: boolean
  hint?:     string
  children:  React.ReactNode
}

function ReviewField({ label, uncertain, hint, children }: ReviewFieldProps) {
  return (
    <div className={styles.fieldGroup}>
      <label className={`${styles.fieldLabel} ${uncertain ? styles.fieldLabelWarn : ''}`}>
        {label}
        {uncertain && <span className={styles.fieldWarnBadge}>?</span>}
      </label>
      {children}
      {hint && <p className={styles.fieldHint}>{hint}</p>}
    </div>
  )
}
