export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      cafe_members: {
        Row: {
          active: boolean;
          cafe_id: string;
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["cafe_role"];
          user_id: string;
        };
        Insert: {
          active?: boolean;
          cafe_id: string;
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["cafe_role"];
          user_id: string;
        };
        Update: {
          active?: boolean;
          cafe_id?: string;
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["cafe_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cafe_members_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          },
        ];
      };
      cafes: {
        Row: {
          address: string | null;
          created_at: string;
          hours: Json;
          id: string;
          name: string;
          reviews_url: string | null;
          reward_description: string;
          slug: string;
          stamps_required: number;
          tagline: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          hours?: Json;
          id?: string;
          name: string;
          reviews_url?: string | null;
          reward_description?: string;
          slug: string;
          stamps_required?: number;
          tagline?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          hours?: Json;
          id?: string;
          name?: string;
          reviews_url?: string | null;
          reward_description?: string;
          slug?: string;
          stamps_required?: number;
          tagline?: string | null;
        };
        Relationships: [];
      };
      loyalty_cards: {
        Row: {
          cafe_id: string;
          code: string;
          created_at: string;
          customer_id: string;
          id: string;
          rewards_available: number;
          stamps: number;
          updated_at: string;
        };
        Insert: {
          cafe_id: string;
          code: string;
          created_at?: string;
          customer_id: string;
          id?: string;
          rewards_available?: number;
          stamps?: number;
          updated_at?: string;
        };
        Update: {
          cafe_id?: string;
          code?: string;
          created_at?: string;
          customer_id?: string;
          id?: string;
          rewards_available?: number;
          stamps?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "loyalty_cards_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      purchases: {
        Row: {
          amount: number;
          cafe_id: string;
          card_id: string;
          created_at: string;
          customer_id: string;
          employee_id: string;
          id: string;
          idempotency_key: string;
          verification: string;
        };
        Insert: {
          amount: number;
          cafe_id: string;
          card_id: string;
          created_at?: string;
          customer_id: string;
          employee_id: string;
          id?: string;
          idempotency_key: string;
          verification?: string;
        };
        Update: {
          amount?: number;
          cafe_id?: string;
          card_id?: string;
          created_at?: string;
          customer_id?: string;
          employee_id?: string;
          id?: string;
          idempotency_key?: string;
          verification?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchases_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchases_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "loyalty_cards";
            referencedColumns: ["id"];
          },
        ];
      };
      redemptions: {
        Row: {
          cafe_id: string;
          card_id: string;
          created_at: string;
          customer_id: string;
          employee_id: string;
          id: string;
          idempotency_key: string;
        };
        Insert: {
          cafe_id: string;
          card_id: string;
          created_at?: string;
          customer_id: string;
          employee_id: string;
          id?: string;
          idempotency_key: string;
        };
        Update: {
          cafe_id?: string;
          card_id?: string;
          created_at?: string;
          customer_id?: string;
          employee_id?: string;
          id?: string;
          idempotency_key?: string;
        };
        Relationships: [
          {
            foreignKeyName: "redemptions_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "redemptions_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "loyalty_cards";
            referencedColumns: ["id"];
          },
        ];
      };
      stamp_events: {
        Row: {
          cafe_id: string;
          card_id: string;
          created_at: string;
          customer_id: string;
          employee_id: string;
          id: string;
          purchase_id: string;
          reward_earned: boolean;
          stamps_after: number;
        };
        Insert: {
          cafe_id: string;
          card_id: string;
          created_at?: string;
          customer_id: string;
          employee_id: string;
          id?: string;
          purchase_id: string;
          reward_earned?: boolean;
          stamps_after: number;
        };
        Update: {
          cafe_id?: string;
          card_id?: string;
          created_at?: string;
          customer_id?: string;
          employee_id?: string;
          id?: string;
          purchase_id?: string;
          reward_earned?: boolean;
          stamps_after?: number;
        };
        Relationships: [
          {
            foreignKeyName: "stamp_events_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stamp_events_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "loyalty_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stamp_events_purchase_id_fkey";
            columns: ["purchase_id"];
            isOneToOne: true;
            referencedRelation: "purchases";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_card_code: { Args: never; Returns: string };
      is_cafe_owner: { Args: { _cafe_id: string }; Returns: boolean };
      is_cafe_staff: { Args: { _cafe_id: string }; Returns: boolean };
      is_staff_of_customer: { Args: { _customer_id: string }; Returns: boolean };
      join_cafe: {
        Args: { _cafe_id: string };
        Returns: {
          cafe_id: string;
          code: string;
          created_at: string;
          customer_id: string;
          id: string;
          rewards_available: number;
          stamps: number;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "loyalty_cards";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      redeem_reward: {
        Args: { _cafe_id: string; _card_code: string; _idempotency_key: string };
        Returns: Json;
      };
      register_purchase: {
        Args: {
          _amount: number;
          _cafe_id: string;
          _card_code: string;
          _idempotency_key: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      cafe_role: "owner" | "employee";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      cafe_role: ["owner", "employee"],
    },
  },
} as const;
