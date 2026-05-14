export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      community_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      community_comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      community_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_notifications: {
        Row: {
          actor_id: string
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          actor_id: string
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      community_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      companion_moods: {
        Row: {
          companion_id: string
          id: string
          intensity: number
          mood: string
          updated_at: string
          user_id: string
        }
        Insert: {
          companion_id: string
          id?: string
          intensity?: number
          mood?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          companion_id?: string
          id?: string
          intensity?: number
          mood?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      companion_overrides: {
        Row: {
          agreeableness: number | null
          ambition: number | null
          companion_id: string
          description: string | null
          empathy: number | null
          enabled: boolean
          hidden_goal: string | null
          id: string
          name: string | null
          neon_color: string | null
          neuroticism: number | null
          sarcasm: number | null
          tagline: string | null
          trust_threshold: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          agreeableness?: number | null
          ambition?: number | null
          companion_id: string
          description?: string | null
          empathy?: number | null
          enabled?: boolean
          hidden_goal?: string | null
          id?: string
          name?: string | null
          neon_color?: string | null
          neuroticism?: number | null
          sarcasm?: number | null
          tagline?: string | null
          trust_threshold?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          agreeableness?: number | null
          ambition?: number | null
          companion_id?: string
          description?: string | null
          empathy?: number | null
          enabled?: boolean
          hidden_goal?: string | null
          id?: string
          name?: string | null
          neon_color?: string | null
          neuroticism?: number | null
          sarcasm?: number | null
          tagline?: string | null
          trust_threshold?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          companion_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          companion_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          companion_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          companion_id: string
          created_at: string
          entry: string
          id: string
          user_id: string
          visible: boolean
        }
        Insert: {
          companion_id: string
          created_at?: string
          entry: string
          id?: string
          user_id: string
          visible?: boolean
        }
        Update: {
          companion_id?: string
          created_at?: string
          entry?: string
          id?: string
          user_id?: string
          visible?: boolean
        }
        Relationships: []
      }
      memories: {
        Row: {
          companion_id: string
          created_at: string
          id: string
          keyword: string
          summary: string
          user_id: string
          weight: number
        }
        Insert: {
          companion_id: string
          created_at?: string
          id?: string
          keyword: string
          summary: string
          user_id: string
          weight?: number
        }
        Update: {
          companion_id?: string
          created_at?: string
          id?: string
          keyword?: string
          summary?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          mood: string | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          mood?: string | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          mood?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned: boolean
          bio: string | null
          country: string | null
          created_at: string
          id: string
          is_adult: boolean
          last_seen: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          banned?: boolean
          bio?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_adult?: boolean
          last_seen?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          banned?: boolean
          bio?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_adult?: boolean
          last_seen?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      trust_scores: {
        Row: {
          companion_id: string
          id: string
          last_interaction: string | null
          score: number
          total_messages: number
          total_time_minutes: number
          user_id: string
        }
        Insert: {
          companion_id: string
          id?: string
          last_interaction?: string | null
          score?: number
          total_messages?: number
          total_time_minutes?: number
          user_id: string
        }
        Update: {
          companion_id?: string
          id?: string
          last_interaction?: string | null
          score?: number
          total_messages?: number
          total_time_minutes?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_wallpaper_settings: {
        Row: {
          id: string
          is_global: boolean
          target_user_id: string | null
          updated_at: string
          updated_by: string | null
          wallpaper_id: string | null
        }
        Insert: {
          id?: string
          is_global?: boolean
          target_user_id?: string | null
          updated_at?: string
          updated_by?: string | null
          wallpaper_id?: string | null
        }
        Update: {
          id?: string
          is_global?: boolean
          target_user_id?: string | null
          updated_at?: string
          updated_by?: string | null
          wallpaper_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_wallpaper_settings_wallpaper_id_fkey"
            columns: ["wallpaper_id"]
            isOneToOne: false
            referencedRelation: "wallpapers"
            referencedColumns: ["id"]
          },
        ]
      }
      wallpaper_collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      wallpapers: {
        Row: {
          accent_color: string | null
          collection_id: string | null
          created_at: string
          gradient: string | null
          id: string
          image_url: string | null
          kind: string
          name: string
          preset: string | null
          primary_color: string | null
        }
        Insert: {
          accent_color?: string | null
          collection_id?: string | null
          created_at?: string
          gradient?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          name: string
          preset?: string | null
          primary_color?: string | null
        }
        Update: {
          accent_color?: string | null
          collection_id?: string | null
          created_at?: string
          gradient?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          name?: string
          preset?: string | null
          primary_color?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallpapers_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "wallpaper_collections"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
