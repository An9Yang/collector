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
      articles: {
        Row: {
          id: string
          url: string
          title: string
          summary: string
          source: 'wechat' | 'linkedin' | 'reddit' | 'other'
          content: string | null
          cover_image: string | null
          tags: string[] | null
          is_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          url: string
          title: string
          summary: string
          source: 'wechat' | 'linkedin' | 'reddit' | 'other'
          content?: string | null
          cover_image?: string | null
          tags?: string[] | null
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          url?: string
          title?: string
          summary?: string
          source?: 'wechat' | 'linkedin' | 'reddit' | 'other'
          content?: string | null
          cover_image?: string | null
          tags?: string[] | null
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
