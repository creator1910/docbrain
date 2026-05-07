// Regenerate this file after schema changes:
//   npx supabase gen types typescript --local > types/database.ts
// Manual stub — kept in sync with db/schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
          id:                string
          user_id:           string
          file_path:         string
          original_name:     string | null
          extracted_at:      string | null
          document_type:     'Versicherung' | 'Vertrag' | 'Behörde' | 'Gehalt' | 'Bank' | 'Sonstige' | null
          provider:          string | null
          summary:           string | null
          start_date:        string | null
          end_date:          string | null
          status:            'active' | 'inactive' | 'unknown'
          canonical_cost:    number | null
          billing_frequency: 'monthly' | 'annually' | 'one_time' | null
          cost_per_month:    number | null    // GENERATED column — never writable
          extras:            Json
          confidence:        Json
          content_hash:      string | null
          created_at:        string
          updated_at:        string
        }
        Insert: {
          id?:                string
          user_id:            string
          file_path:          string
          original_name?:     string | null
          extracted_at?:      string | null
          document_type?:     'Versicherung' | 'Vertrag' | 'Behörde' | 'Gehalt' | 'Bank' | 'Sonstige' | null
          provider?:          string | null
          summary?:           string | null
          start_date?:        string | null
          end_date?:          string | null
          status?:            'active' | 'inactive' | 'unknown'
          canonical_cost?:    number | null
          billing_frequency?: 'monthly' | 'annually' | 'one_time' | null
          // cost_per_month is GENERATED — omit from Insert
          extras?:            Json
          confidence?:        Json
          content_hash?:      string | null
          created_at?:        string
          updated_at?:        string
        }
        Update: {
          file_path?:         string
          original_name?:     string | null
          extracted_at?:      string | null
          document_type?:     'Versicherung' | 'Vertrag' | 'Behörde' | 'Gehalt' | 'Bank' | 'Sonstige' | null
          provider?:          string | null
          summary?:           string | null
          start_date?:        string | null
          end_date?:          string | null
          status?:            'active' | 'inactive' | 'unknown'
          canonical_cost?:    number | null
          billing_frequency?: 'monthly' | 'annually' | 'one_time' | null
          extras?:            Json
          confidence?:        Json
          content_hash?:      string | null
        }
        Relationships: [
          {
            foreignKeyName: 'documents_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ── Convenience types ─────────────────────────────────────

export type DocumentRow       = Database['public']['Tables']['documents']['Row']
export type DocumentInsert    = Database['public']['Tables']['documents']['Insert']
export type DocumentUpdate    = Database['public']['Tables']['documents']['Update']

export type DocumentStatus    = 'active' | 'inactive' | 'unknown'
export type DocumentType      = 'Versicherung' | 'Vertrag' | 'Behörde' | 'Gehalt' | 'Bank' | 'Sonstige'
export type BillingFrequency  = 'monthly' | 'annually' | 'one_time'
