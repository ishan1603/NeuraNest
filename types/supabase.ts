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
      companions: {
        Row: {
          id: string
          created_at: string
          name: string
          subject: string
          topic: string
          voice: string
          style: string
          duration: number
          author: string
          is_public: boolean
          language: string
          remix_of: string | null
          session_count: number
          rating_avg: number
          rating_count: number
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          subject: string
          topic: string
          voice: string
          style: string
          duration?: number
          author?: string
          is_public?: boolean
          language?: string
          remix_of?: string | null
          session_count?: number
          rating_avg?: number
          rating_count?: number
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          subject?: string
          topic?: string
          voice?: string
          style?: string
          duration?: number
          author?: string
          is_public?: boolean
          language?: string
          remix_of?: string | null
          session_count?: number
          rating_avg?: number
          rating_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "companions_remix_of_fkey"
            columns: ["remix_of"]
            isOneToOne: false
            referencedRelation: "companions"
            referencedColumns: ["id"]
          }
        ]
      }
      session_history: {
        Row: {
          id: string
          created_at: string
          companion_id: string | null
          user_id: string
          status: 'in_progress' | 'finalizing' | 'completed' | 'abandoned'
          started_at: string
          ended_at: string | null
          duration_seconds: number | null
          max_duration_seconds: number | null
          vapi_call_id: string | null
          ended_reason: string | null
          cost: number | null
          transcript: Json | null
          transcript_source: string | null
          insights: Json | null
          insights_status: 'none' | 'pending' | 'ready' | 'failed' | 'skipped'
        }
        Insert: {
          id?: string
          created_at?: string
          companion_id?: string | null
          user_id?: string
          status?: 'in_progress' | 'finalizing' | 'completed' | 'abandoned'
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          max_duration_seconds?: number | null
          vapi_call_id?: string | null
          ended_reason?: string | null
          cost?: number | null
          transcript?: Json | null
          transcript_source?: string | null
          insights?: Json | null
          insights_status?: 'none' | 'pending' | 'ready' | 'failed' | 'skipped'
        }
        Update: {
          id?: string
          created_at?: string
          companion_id?: string | null
          user_id?: string
          status?: 'in_progress' | 'finalizing' | 'completed' | 'abandoned'
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          max_duration_seconds?: number | null
          vapi_call_id?: string | null
          ended_reason?: string | null
          cost?: number | null
          transcript?: Json | null
          transcript_source?: string | null
          insights?: Json | null
          insights_status?: 'none' | 'pending' | 'ready' | 'failed' | 'skipped'
        }
        Relationships: [
          {
            foreignKeyName: "session_history_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "companions"
            referencedColumns: ["id"]
          }
        ]
      }
      bookmarks: {
        Row: {
          id: string
          created_at: string
          companion_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          companion_id?: string | null
          user_id?: string
        }
        Update: {
          id?: string
          created_at?: string
          companion_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "companions"
            referencedColumns: ["id"]
          }
        ]
      }
      companion_ratings: {
        Row: {
          companion_id: string
          user_id: string
          rating: number
          created_at: string
          updated_at: string
        }
        Insert: {
          companion_id: string
          user_id?: string
          rating: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          companion_id?: string
          user_id?: string
          rating?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companion_ratings_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "companions"
            referencedColumns: ["id"]
          }
        ]
      }
      flashcards: {
        Row: {
          id: string
          created_at: string
          user_id: string
          session_id: string | null
          companion_id: string | null
          front: string
          back: string
          ease_factor: number
          interval_days: number
          repetitions: number
          lapses: number
          due_at: string
          last_reviewed_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id?: string
          session_id?: string | null
          companion_id?: string | null
          front: string
          back: string
          ease_factor?: number
          interval_days?: number
          repetitions?: number
          lapses?: number
          due_at?: string
          last_reviewed_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          session_id?: string | null
          companion_id?: string | null
          front?: string
          back?: string
          ease_factor?: number
          interval_days?: number
          repetitions?: number
          lapses?: number
          due_at?: string
          last_reviewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "companions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_history"
            referencedColumns: ["id"]
          }
        ]
      }
      quiz_attempts: {
        Row: {
          id: string
          created_at: string
          user_id: string
          session_id: string
          score: number
          total: number
          answers: Json
        }
        Insert: {
          id?: string
          created_at?: string
          user_id?: string
          session_id: string
          score: number
          total: number
          answers?: Json
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          session_id?: string
          score?: number
          total?: number
          answers?: Json
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_history"
            referencedColumns: ["id"]
          }
        ]
      }
      documents: {
        Row: {
          id: string
          created_at: string
          user_id: string
          companion_id: string | null
          name: string
          mime_type: string | null
          size_bytes: number | null
          chunk_count: number
          status: 'processing' | 'ready' | 'failed'
          error: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id?: string
          companion_id?: string | null
          name: string
          mime_type?: string | null
          size_bytes?: number | null
          chunk_count?: number
          status?: 'processing' | 'ready' | 'failed'
          error?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          companion_id?: string | null
          name?: string
          mime_type?: string | null
          size_bytes?: number | null
          chunk_count?: number
          status?: 'processing' | 'ready' | 'failed'
          error?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "companions"
            referencedColumns: ["id"]
          }
        ]
      }
      document_chunks: {
        Row: {
          id: string
          document_id: string
          user_id: string
          companion_id: string | null
          chunk_index: number
          content: string
          embedding: string
        }
        Insert: {
          id?: string
          document_id: string
          user_id?: string
          companion_id?: string | null
          chunk_index: number
          content: string
          embedding: string
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string
          companion_id?: string | null
          chunk_index?: number
          content?: string
          embedding?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "companions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_document_chunks: {
        Args: {
          query_embedding: string
          p_companion_id?: string | null
          match_count?: number
          p_user_id?: string
        }
        Returns: {
          id: string
          content: string
          document_name: string
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never
