export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      words: {
        Row: {
          id: string
          full_word: string
          mask: string
          level: number
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          full_word: string
          mask: string
          level?: number
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_word?: string
          mask?: string
          level?: number
          is_public?: boolean
          created_at?: string
        }
      }
      progress: {
        Row: {
          id: string
          device_id: string
          word_id: string
          mistakes: Json
          correct_count: number
          last_attempt: string
        }
        Insert: {
          id?: string
          device_id: string
          word_id: string
          mistakes?: Json
          correct_count?: number
          last_attempt?: string
        }
        Update: {
          id?: string
          device_id?: string
          word_id?: string
          mistakes?: Json
          correct_count?: number
          last_attempt?: string
        }
      }
      word_groups: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      word_group_items: {
        Row: {
          id: string
          word_id: string
          group_id: string
          sort_order: number
          added_at: string
        }
        Insert: {
          id?: string
          word_id: string
          group_id: string
          sort_order?: number
          added_at?: string
        }
        Update: {
          id?: string
          word_id?: string
          group_id?: string
          sort_order?: number
          added_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'word_group_items_word_id_fkey'
            columns: ['word_id']
            isOneToOne: false
            referencedRelation: 'words'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'word_group_items_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'word_groups'
            referencedColumns: ['id']
          },
        ]
      }
    }
  }
}
