// This file is generated by running: npx supabase gen types typescript --local

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
      collections: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          icon: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string
          icon?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          icon?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      article_collections: {
        Row: {
          id: string
          article_id: string
          collection_id: string
          added_at: string
        }
        Insert: {
          id?: string
          article_id: string
          collection_id: string
          added_at?: string
        }
        Update: {
          id?: string
          article_id?: string
          collection_id?: string
          added_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_collections_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
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
