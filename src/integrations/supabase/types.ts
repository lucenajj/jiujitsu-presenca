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
      academies: {
        Row: {
          id: string
          owner_name: string
          name: string
          cnpj: string
          street: string
          neighborhood: string
          zip_code: string
          phone: string
          email: string
          user_id: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          owner_name: string
          name: string
          cnpj: string
          street: string
          neighborhood: string
          zip_code: string
          phone: string
          email: string
          user_id?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          owner_name?: string
          name?: string
          cnpj?: string
          street?: string
          neighborhood?: string
          zip_code?: string
          phone?: string
          email?: string
          user_id?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      attendance: {
        Row: {
          class_id: string
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          student_ids: string[]
          academy_id: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          created_by?: string | null
          date: string
          id?: string
          student_ids: string[]
          academy_id?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          student_ids?: string[]
          academy_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string | null
          day_of_week: Database["public"]["Enums"]["weekday"][]
          id: string
          instructor: string
          level: Database["public"]["Enums"]["class_level"]
          name: string
          time_end: string
          time_start: string
          updated_at: string | null
          user_id: string | null
          academy_id: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: Database["public"]["Enums"]["weekday"][]
          id?: string
          instructor: string
          level?: Database["public"]["Enums"]["class_level"]
          name: string
          time_end: string
          time_start: string
          updated_at?: string | null
          user_id?: string | null
          academy_id?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: Database["public"]["Enums"]["weekday"][]
          id?: string
          instructor?: string
          level?: Database["public"]["Enums"]["class_level"]
          name?: string
          time_end?: string
          time_start?: string
          updated_at?: string | null
          user_id?: string | null
          academy_id?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          belt: Database["public"]["Enums"]["belt_level"]
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          registration_date: string | null
          status: string
          stripes: number
          updated_at: string | null
          classes_per_week: number
          classes_attended: number
          last_promotion_date: string
          academy_id: string | null
        }
        Insert: {
          belt?: Database["public"]["Enums"]["belt_level"]
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          registration_date?: string | null
          status?: string
          stripes?: number
          updated_at?: string | null
          classes_per_week?: number
          classes_attended?: number
          last_promotion_date?: string
          academy_id?: string | null
        }
        Update: {
          belt?: Database["public"]["Enums"]["belt_level"]
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          registration_date?: string | null
          status?: string
          stripes?: number
          updated_at?: string | null
          classes_per_week?: number
          classes_attended?: number
          last_promotion_date?: string
          academy_id?: string | null
        }
        Relationships: []
      }
      user_academies: {
        Row: {
          id: string
          user_id: string
          academy_id: string
          role: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          academy_id: string
          role?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          academy_id?: string
          role?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_academies_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_academies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_auth: {
        Args: {
          email: string
          password: string
          user_data: Json
        }
        Returns: string
      }
      create_user_profile: {
        Args: {
          user_id: string
          user_email: string
          user_full_name: string
          user_role: string
        }
        Returns: Json
      }
      delete_user_auth: {
        Args: {
          user_id: string
        }
        Returns: undefined
      }
      exec_sql: {
        Args: {
          sql: string
        }
        Returns: Json
      }
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      update_user_auth: {
        Args: {
          user_id: string
          new_email?: string
          new_password?: string
          user_data?: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      belt_level: "white" | "blue" | "purple" | "brown" | "black"
      class_level: "beginner" | "intermediate" | "advanced" | "all"
      document_status:
        | "draft"
        | "pending"
        | "approved"
        | "canceled"
        | "completed"
      document_type: "quote" | "sale"
      weekday:
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
        | "sunday"
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

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
