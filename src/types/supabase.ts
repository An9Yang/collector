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
          created_at: string
          is_read: boolean
          content: string | null
          cover_image: string | null
          user_id: string
        }
        Insert: {
          id?: string
          url: string
          title: string
          summary: string
          source: 'wechat' | 'linkedin' | 'reddit' | 'other'
          created_at?: string
          is_read?: boolean
          content?: string | null
          cover_image?: string | null
          user_id: string
        }
        Update: {
          id?: string
          url?: string
          title?: string
          summary?: string
          source?: 'wechat' | 'linkedin' | 'reddit' | 'other'
          created_at?: string
          is_read?: boolean
          content?: string | null
          cover_image?: string | null
          user_id?: string
        }
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
  }
}