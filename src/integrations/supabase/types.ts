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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      capital_calls: {
        Row: {
          amount_per_share: number
          created_at: string
          created_by: string
          description: string | null
          due_date: string
          id: string
          offering_id: string
          status: Database["public"]["Enums"]["capital_call_status"] | null
          title: string
        }
        Insert: {
          amount_per_share: number
          created_at?: string
          created_by: string
          description?: string | null
          due_date: string
          id?: string
          offering_id: string
          status?: Database["public"]["Enums"]["capital_call_status"] | null
          title: string
        }
        Update: {
          amount_per_share?: number
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string
          id?: string
          offering_id?: string
          status?: Database["public"]["Enums"]["capital_call_status"] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "capital_calls_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "investment_offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_screening_documents: {
        Row: {
          created_at: string
          expiry_date: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screening_date: string
          screening_provider: string | null
          screening_reference: string | null
          screening_type: string
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          uploaded_by: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screening_date?: string
          screening_provider?: string | null
          screening_reference?: string | null
          screening_type: string
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          uploaded_by: string
          user_id: string
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screening_date?: string
          screening_provider?: string | null
          screening_reference?: string | null
          screening_type?: string
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          uploaded_by?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          description: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_path: string
          file_size: number | null
          id: string
          is_public: boolean | null
          mime_type: string | null
          offering_id: string | null
          title: string
          uploaded_by: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_path: string
          file_size?: number | null
          id?: string
          is_public?: boolean | null
          mime_type?: string | null
          offering_id?: string | null
          title: string
          uploaded_by: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          file_path?: string
          file_size?: number | null
          id?: string
          is_public?: boolean | null
          mime_type?: string | null
          offering_id?: string | null
          title?: string
          uploaded_by?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "investment_offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_offerings: {
        Row: {
          address: string | null
          base_fee: number | null
          capital_gain_success_fee: number | null
          closing_date: string | null
          coc_year_1: number | null
          coc_year_2: number | null
          coc_year_3: number | null
          coc_year_4: number | null
          coc_year_5: number | null
          coc_year_6: number | null
          coc_year_7: number | null
          created_at: string
          created_by: string
          description: string | null
          disregard_user_levels: boolean | null
          distribution_overview: string | null
          enable_source_wealth_screen: boolean | null
          expected_return: string | null
          id: string
          image_url: string | null
          investment_term: string | null
          investment_type: string
          lister_name: string | null
          location: string | null
          marketing_sales_fee: number | null
          maximum_investment: number | null
          minimum_investment: number
          other_published: boolean | null
          product_name: string | null
          published_private_wealth: boolean | null
          published_wealth_migrate: boolean | null
          raised_amount: number | null
          status: Database["public"]["Enums"]["investment_status"] | null
          structure_fee: number | null
          success_fee: number | null
          target_amount: number
          targeted_avg_coc: number | null
          targeted_irr: number | null
          tax_adjusted_cg: number | null
          tax_adjusted_em: number | null
          tax_fee_adjusted_coc: number | null
          tax_fee_adjusted_irr: number | null
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          base_fee?: number | null
          capital_gain_success_fee?: number | null
          closing_date?: string | null
          coc_year_1?: number | null
          coc_year_2?: number | null
          coc_year_3?: number | null
          coc_year_4?: number | null
          coc_year_5?: number | null
          coc_year_6?: number | null
          coc_year_7?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          disregard_user_levels?: boolean | null
          distribution_overview?: string | null
          enable_source_wealth_screen?: boolean | null
          expected_return?: string | null
          id?: string
          image_url?: string | null
          investment_term?: string | null
          investment_type: string
          lister_name?: string | null
          location?: string | null
          marketing_sales_fee?: number | null
          maximum_investment?: number | null
          minimum_investment: number
          other_published?: boolean | null
          product_name?: string | null
          published_private_wealth?: boolean | null
          published_wealth_migrate?: boolean | null
          raised_amount?: number | null
          status?: Database["public"]["Enums"]["investment_status"] | null
          structure_fee?: number | null
          success_fee?: number | null
          target_amount: number
          targeted_avg_coc?: number | null
          targeted_irr?: number | null
          tax_adjusted_cg?: number | null
          tax_adjusted_em?: number | null
          tax_fee_adjusted_coc?: number | null
          tax_fee_adjusted_irr?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          base_fee?: number | null
          capital_gain_success_fee?: number | null
          closing_date?: string | null
          coc_year_1?: number | null
          coc_year_2?: number | null
          coc_year_3?: number | null
          coc_year_4?: number | null
          coc_year_5?: number | null
          coc_year_6?: number | null
          coc_year_7?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          disregard_user_levels?: boolean | null
          distribution_overview?: string | null
          enable_source_wealth_screen?: boolean | null
          expected_return?: string | null
          id?: string
          image_url?: string | null
          investment_term?: string | null
          investment_type?: string
          lister_name?: string | null
          location?: string | null
          marketing_sales_fee?: number | null
          maximum_investment?: number | null
          minimum_investment?: number
          other_published?: boolean | null
          product_name?: string | null
          published_private_wealth?: boolean | null
          published_wealth_migrate?: boolean | null
          raised_amount?: number | null
          status?: Database["public"]["Enums"]["investment_status"] | null
          structure_fee?: number | null
          success_fee?: number | null
          target_amount?: number
          targeted_avg_coc?: number | null
          targeted_irr?: number | null
          tax_adjusted_cg?: number | null
          tax_adjusted_em?: number | null
          tax_fee_adjusted_coc?: number | null
          tax_fee_adjusted_irr?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      investment_updates: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          is_important: boolean | null
          offering_id: string
          title: string
          update_type: string | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_important?: boolean | null
          offering_id: string
          title: string
          update_type?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_important?: boolean | null
          offering_id?: string
          title?: string
          update_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_updates_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "investment_offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      offering_documents: {
        Row: {
          created_at: string
          description: string | null
          document_category: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_required: boolean | null
          mime_type: string | null
          offering_id: string
          title: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_category: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_required?: boolean | null
          mime_type?: string | null
          offering_id: string
          title: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_category?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_required?: boolean | null
          mime_type?: string | null
          offering_id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "offering_documents_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "investment_offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      offering_media: {
        Row: {
          created_at: string
          display_order: number | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          id: string
          media_type: string
          mime_type: string | null
          offering_id: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          media_type: string
          mime_type?: string | null
          offering_id: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          media_type?: string
          mime_type?: string | null
          offering_id?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offering_media_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "investment_offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      offering_milestones: {
        Row: {
          created_at: string
          description: string
          id: string
          milestone_date: string
          milestone_order: number
          offering_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          milestone_date: string
          milestone_order: number
          offering_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          milestone_date?: string
          milestone_order?: number
          offering_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offering_milestones_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "investment_offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          address_verified: boolean | null
          annual_income: number | null
          city: string | null
          compliance_notes: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          employer: string | null
          financial_verified: boolean | null
          first_name: string | null
          id: string
          identity_verified: boolean | null
          investor_classification:
            | Database["public"]["Enums"]["investor_classification"]
            | null
          is_accredited: boolean | null
          is_pep: boolean | null
          kyc_verified: boolean | null
          last_name: string | null
          nationality: string | null
          net_worth: number | null
          next_review_date: string | null
          occupation: string | null
          pep_details: string | null
          pep_screened: boolean | null
          pep_screening_date: string | null
          phone: string | null
          place_of_birth: string | null
          risk_rating: Database["public"]["Enums"]["risk_rating"] | null
          sanctions_clear: boolean | null
          sanctions_screened: boolean | null
          sanctions_screening_date: string | null
          source_of_wealth:
            | Database["public"]["Enums"]["source_of_wealth"][]
            | null
          state: string | null
          updated_at: string
          verification_completed_at: string | null
          verification_level: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          address_verified?: boolean | null
          annual_income?: number | null
          city?: string | null
          compliance_notes?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          employer?: string | null
          financial_verified?: boolean | null
          first_name?: string | null
          id: string
          identity_verified?: boolean | null
          investor_classification?:
            | Database["public"]["Enums"]["investor_classification"]
            | null
          is_accredited?: boolean | null
          is_pep?: boolean | null
          kyc_verified?: boolean | null
          last_name?: string | null
          nationality?: string | null
          net_worth?: number | null
          next_review_date?: string | null
          occupation?: string | null
          pep_details?: string | null
          pep_screened?: boolean | null
          pep_screening_date?: string | null
          phone?: string | null
          place_of_birth?: string | null
          risk_rating?: Database["public"]["Enums"]["risk_rating"] | null
          sanctions_clear?: boolean | null
          sanctions_screened?: boolean | null
          sanctions_screening_date?: string | null
          source_of_wealth?:
            | Database["public"]["Enums"]["source_of_wealth"][]
            | null
          state?: string | null
          updated_at?: string
          verification_completed_at?: string | null
          verification_level?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          address_verified?: boolean | null
          annual_income?: number | null
          city?: string | null
          compliance_notes?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          employer?: string | null
          financial_verified?: boolean | null
          first_name?: string | null
          id?: string
          identity_verified?: boolean | null
          investor_classification?:
            | Database["public"]["Enums"]["investor_classification"]
            | null
          is_accredited?: boolean | null
          is_pep?: boolean | null
          kyc_verified?: boolean | null
          last_name?: string | null
          nationality?: string | null
          net_worth?: number | null
          next_review_date?: string | null
          occupation?: string | null
          pep_details?: string | null
          pep_screened?: boolean | null
          pep_screening_date?: string | null
          phone?: string | null
          place_of_birth?: string | null
          risk_rating?: Database["public"]["Enums"]["risk_rating"] | null
          sanctions_clear?: boolean | null
          sanctions_screened?: boolean | null
          sanctions_screening_date?: string | null
          source_of_wealth?:
            | Database["public"]["Enums"]["source_of_wealth"][]
            | null
          state?: string | null
          updated_at?: string
          verification_completed_at?: string | null
          verification_level?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          zip_code?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          investment_id: string | null
          reference_number: string | null
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          investment_id?: string | null
          reference_number?: string | null
          transaction_date?: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          investment_id?: string | null
          reference_number?: string | null
          transaction_date?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "user_investments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_investments: {
        Row: {
          created_at: string
          id: string
          investment_amount: number
          investment_date: string
          offering_id: string
          shares: number | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          investment_amount: number
          investment_date?: string
          offering_id: string
          shares?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          investment_amount?: number
          investment_date?: string
          offering_id?: string
          shares?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_investments_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "investment_offerings"
            referencedColumns: ["id"]
          },
        ]
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
      verification_documents: {
        Row: {
          created_at: string
          document_type: Database["public"]["Enums"]["verification_document_type"]
          expiry_date: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_expired: boolean | null
          mime_type: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          title: string
          updated_at: string
          user_id: string
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          created_at?: string
          document_type: Database["public"]["Enums"]["verification_document_type"]
          expiry_date?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_expired?: boolean | null
          mime_type?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          title: string
          updated_at?: string
          user_id: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["verification_document_type"]
          expiry_date?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_expired?: boolean | null
          mime_type?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_history: {
        Row: {
          change_reason: string | null
          changed_by: string
          created_at: string
          document_id: string | null
          id: string
          new_status: Database["public"]["Enums"]["verification_status"]
          notes: string | null
          previous_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          user_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_by: string
          created_at?: string
          document_id?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["verification_status"]
          notes?: string | null
          previous_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          user_id: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string
          created_at?: string
          document_id?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["verification_status"]
          notes?: string | null
          previous_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          user_id?: string
        }
        Relationships: []
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
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "investor" | "manager"
      capital_call_status: "pending" | "completed" | "overdue"
      document_type:
        | "offering_document"
        | "legal_agreement"
        | "financial_report"
        | "tax_document"
        | "update"
      investment_status: "draft" | "active" | "closed" | "cancelled"
      investor_classification:
        | "retail"
        | "sophisticated"
        | "high_net_worth"
        | "institutional"
      risk_rating: "low" | "medium" | "high"
      source_of_wealth:
        | "employment"
        | "business_ownership"
        | "inheritance"
        | "property_sale"
        | "investment_gains"
        | "pension"
        | "gift"
        | "other"
      transaction_type: "contribution" | "distribution" | "fee" | "expense"
      verification_document_type:
        | "passport"
        | "national_id"
        | "driving_license"
        | "proof_of_address"
        | "bank_statement"
        | "income_verification"
        | "source_of_wealth"
        | "pep_declaration"
        | "sophisticated_investor_cert"
        | "professional_qualification"
      verification_status:
        | "pending"
        | "in_progress"
        | "approved"
        | "rejected"
        | "expired"
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
      app_role: ["admin", "investor", "manager"],
      capital_call_status: ["pending", "completed", "overdue"],
      document_type: [
        "offering_document",
        "legal_agreement",
        "financial_report",
        "tax_document",
        "update",
      ],
      investment_status: ["draft", "active", "closed", "cancelled"],
      investor_classification: [
        "retail",
        "sophisticated",
        "high_net_worth",
        "institutional",
      ],
      risk_rating: ["low", "medium", "high"],
      source_of_wealth: [
        "employment",
        "business_ownership",
        "inheritance",
        "property_sale",
        "investment_gains",
        "pension",
        "gift",
        "other",
      ],
      transaction_type: ["contribution", "distribution", "fee", "expense"],
      verification_document_type: [
        "passport",
        "national_id",
        "driving_license",
        "proof_of_address",
        "bank_statement",
        "income_verification",
        "source_of_wealth",
        "pep_declaration",
        "sophisticated_investor_cert",
        "professional_qualification",
      ],
      verification_status: [
        "pending",
        "in_progress",
        "approved",
        "rejected",
        "expired",
      ],
    },
  },
} as const
