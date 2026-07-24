export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      agencies: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          name: string;
          slug: string;
          status: Database["public"]["Enums"]["workspace_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name: string;
          slug: string;
          status?: Database["public"]["Enums"]["workspace_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          status?: Database["public"]["Enums"]["workspace_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_agencies__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      agency_members: {
        Row: {
          agency_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          profile_id: string;
          role_id: string;
          status: Database["public"]["Enums"]["membership_status"];
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          profile_id: string;
          role_id: string;
          status?: Database["public"]["Enums"]["membership_status"];
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          profile_id?: string;
          role_id?: string;
          status?: Database["public"]["Enums"]["membership_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_agency_members__agency_id";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_agency_members__agency_id_role_id";
            columns: ["agency_id", "role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["agency_id", "id"];
          },
          {
            foreignKeyName: "fk_agency_members__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_agency_members__profile_id";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          agency_id: string;
          client_id: string | null;
          correlation_id: string | null;
          created_at: string;
          created_by: string | null;
          id: number;
          ip_address: unknown;
          metadata: Json;
          resource_id: string | null;
          resource_type: string;
          user_agent: string | null;
        };
        Insert: {
          action: string;
          agency_id: string;
          client_id?: string | null;
          correlation_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: never;
          ip_address?: unknown;
          metadata?: Json;
          resource_id?: string | null;
          resource_type: string;
          user_agent?: string | null;
        };
        Update: {
          action?: string;
          agency_id?: string;
          client_id?: string | null;
          correlation_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: never;
          ip_address?: unknown;
          metadata?: Json;
          resource_id?: string | null;
          resource_type?: string;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_audit_logs__agency_id";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_audit_logs__agency_id_client_id";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
          {
            foreignKeyName: "fk_audit_logs__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      client_members: {
        Row: {
          agency_id: string;
          client_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          profile_id: string;
          role_id: string;
          status: Database["public"]["Enums"]["membership_status"];
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          client_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          profile_id: string;
          role_id: string;
          status?: Database["public"]["Enums"]["membership_status"];
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          client_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          profile_id?: string;
          role_id?: string;
          status?: Database["public"]["Enums"]["membership_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_client_members__agency_id_client_id";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
          {
            foreignKeyName: "fk_client_members__agency_id_client_id_role_id";
            columns: ["agency_id", "client_id", "role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_client_members__agency_id_profile_id";
            columns: ["agency_id", "profile_id"];
            isOneToOne: false;
            referencedRelation: "agency_members";
            referencedColumns: ["agency_id", "profile_id"];
          },
          {
            foreignKeyName: "fk_client_members__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_client_members__profile_id";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          agency_id: string;
          archived_at: string | null;
          archived_by: string | null;
          country_code: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          industry: string | null;
          language_code: string | null;
          legal_name: string | null;
          logo_url: string | null;
          name: string;
          objectives: string[];
          slug: string;
          status: Database["public"]["Enums"]["workspace_status"];
          timezone: string | null;
          updated_at: string;
          website_url: string | null;
        };
        Insert: {
          agency_id: string;
          archived_at?: string | null;
          archived_by?: string | null;
          country_code?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          industry?: string | null;
          language_code?: string | null;
          legal_name?: string | null;
          logo_url?: string | null;
          name: string;
          objectives?: string[];
          slug: string;
          status?: Database["public"]["Enums"]["workspace_status"];
          timezone?: string | null;
          updated_at?: string;
          website_url?: string | null;
        };
        Update: {
          agency_id?: string;
          archived_at?: string | null;
          archived_by?: string | null;
          country_code?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          industry?: string | null;
          language_code?: string | null;
          legal_name?: string | null;
          logo_url?: string | null;
          name?: string;
          objectives?: string[];
          slug?: string;
          status?: Database["public"]["Enums"]["workspace_status"];
          timezone?: string | null;
          updated_at?: string;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_clients__agency_id";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_clients__archived_by";
            columns: ["archived_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_clients__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      onboarding_answer_history: {
        Row: {
          agency_id: string;
          answer_data: Json;
          answer_id: string;
          changed_at: string;
          changed_by: string;
          client_id: string;
          id: number;
          is_complete: boolean;
          previous_answer_data: Json | null;
          previous_is_complete: boolean | null;
          revision: number;
          section_key: Database["public"]["Enums"]["onboarding_section_key"];
          session_id: string;
        };
        Insert: {
          agency_id: string;
          answer_data: Json;
          answer_id: string;
          changed_at?: string;
          changed_by: string;
          client_id: string;
          id?: never;
          is_complete: boolean;
          previous_answer_data?: Json | null;
          previous_is_complete?: boolean | null;
          revision: number;
          section_key: Database["public"]["Enums"]["onboarding_section_key"];
          session_id: string;
        };
        Update: {
          agency_id?: string;
          answer_data?: Json;
          answer_id?: string;
          changed_at?: string;
          changed_by?: string;
          client_id?: string;
          id?: never;
          is_complete?: boolean;
          previous_answer_data?: Json | null;
          previous_is_complete?: boolean | null;
          revision?: number;
          section_key?: Database["public"]["Enums"]["onboarding_section_key"];
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_onboarding_answer_history__agency_id_client_id_answer_id";
            columns: ["agency_id", "client_id", "answer_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_answers";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_onboarding_answer_history__agency_id_client_id_session_id";
            columns: ["agency_id", "client_id", "session_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_sessions";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_onboarding_answer_history__changed_by";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      onboarding_answers: {
        Row: {
          agency_id: string;
          answer_data: Json;
          client_id: string;
          completed_at: string | null;
          created_at: string;
          created_by: string;
          id: string;
          is_complete: boolean;
          revision: number;
          section_key: Database["public"]["Enums"]["onboarding_section_key"];
          session_id: string;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          agency_id: string;
          answer_data?: Json;
          client_id: string;
          completed_at?: string | null;
          created_at?: string;
          created_by: string;
          id?: string;
          is_complete?: boolean;
          revision?: number;
          section_key: Database["public"]["Enums"]["onboarding_section_key"];
          session_id: string;
          updated_at?: string;
          updated_by: string;
        };
        Update: {
          agency_id?: string;
          answer_data?: Json;
          client_id?: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          is_complete?: boolean;
          revision?: number;
          section_key?: Database["public"]["Enums"]["onboarding_section_key"];
          session_id?: string;
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_onboarding_answers__agency_id_client_id_session_id";
            columns: ["agency_id", "client_id", "session_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_sessions";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_onboarding_answers__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_onboarding_answers__updated_by";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      onboarding_sessions: {
        Row: {
          agency_id: string;
          client_id: string;
          completed_at: string | null;
          completed_step_count: number;
          created_at: string;
          created_by: string;
          current_step: number;
          id: string;
          status: Database["public"]["Enums"]["onboarding_status"];
          updated_at: string;
          updated_by: string;
          validated_at: string | null;
          validated_by: string | null;
        };
        Insert: {
          agency_id: string;
          client_id: string;
          completed_at?: string | null;
          completed_step_count?: number;
          created_at?: string;
          created_by: string;
          current_step?: number;
          id?: string;
          status?: Database["public"]["Enums"]["onboarding_status"];
          updated_at?: string;
          updated_by: string;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Update: {
          agency_id?: string;
          client_id?: string;
          completed_at?: string | null;
          completed_step_count?: number;
          created_at?: string;
          created_by?: string;
          current_step?: number;
          id?: string;
          status?: Database["public"]["Enums"]["onboarding_status"];
          updated_at?: string;
          updated_by?: string;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_onboarding_sessions__agency_id_client_id";
            columns: ["agency_id", "client_id"];
            isOneToOne: true;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
          {
            foreignKeyName: "fk_onboarding_sessions__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_onboarding_sessions__updated_by";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_onboarding_sessions__validated_by";
            columns: ["validated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      permissions: {
        Row: {
          action: string;
          allowed_scopes: Database["public"]["Enums"]["role_scope"][];
          created_at: string;
          created_by: string | null;
          description: string;
          id: string;
          key: string;
          resource: string;
          updated_at: string;
        };
        Insert: {
          action: string;
          allowed_scopes?: Database["public"]["Enums"]["role_scope"][];
          created_at?: string;
          created_by?: string | null;
          description: string;
          id?: string;
          key: string;
          resource: string;
          updated_at?: string;
        };
        Update: {
          action?: string;
          allowed_scopes?: Database["public"]["Enums"]["role_scope"][];
          created_at?: string;
          created_by?: string | null;
          description?: string;
          id?: string;
          key?: string;
          resource?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_permissions__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          created_by: string | null;
          display_name: string | null;
          id: string;
          locale: string;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          display_name?: string | null;
          id: string;
          locale?: string;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          display_name?: string | null;
          id?: string;
          locale?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_profiles__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      role_permissions: {
        Row: {
          created_at: string;
          created_by: string | null;
          permission_id: string;
          role_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          permission_id: string;
          role_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          permission_id?: string;
          role_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_role_permissions__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_role_permissions__permission_id";
            columns: ["permission_id"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_role_permissions__role_id";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          agency_id: string;
          archived_at: string | null;
          client_id: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_system: boolean;
          name: string;
          scope: Database["public"]["Enums"]["role_scope"];
          slug: string;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          archived_at?: string | null;
          client_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_system?: boolean;
          name: string;
          scope: Database["public"]["Enums"]["role_scope"];
          slug: string;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          archived_at?: string | null;
          client_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_system?: boolean;
          name?: string;
          scope?: Database["public"]["Enums"]["role_scope"];
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_roles__agency_id";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_roles__agency_id_client_id";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
          {
            foreignKeyName: "fk_roles__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      strategy_artifacts: {
        Row: {
          agency_id: string;
          artifact_type: Database["public"]["Enums"]["strategy_artifact_type"];
          client_id: string;
          created_at: string;
          created_by: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          artifact_type: Database["public"]["Enums"]["strategy_artifact_type"];
          client_id: string;
          created_at?: string;
          created_by: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          artifact_type?: Database["public"]["Enums"]["strategy_artifact_type"];
          client_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_strategy_artifacts__agency_id_client_id";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
          {
            foreignKeyName: "fk_strategy_artifacts__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      strategy_evidence: {
        Row: {
          agency_id: string;
          archived_at: string | null;
          classification: Database["public"]["Enums"]["strategy_claim_status"];
          client_id: string;
          created_at: string;
          created_by: string;
          description: string;
          evidence_type: Database["public"]["Enums"]["strategy_evidence_type"];
          id: string;
          source_reference: string | null;
          source_url: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          archived_at?: string | null;
          classification: Database["public"]["Enums"]["strategy_claim_status"];
          client_id: string;
          created_at?: string;
          created_by: string;
          description: string;
          evidence_type: Database["public"]["Enums"]["strategy_evidence_type"];
          id?: string;
          source_reference?: string | null;
          source_url?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          archived_at?: string | null;
          classification?: Database["public"]["Enums"]["strategy_claim_status"];
          client_id?: string;
          created_at?: string;
          created_by?: string;
          description?: string;
          evidence_type?: Database["public"]["Enums"]["strategy_evidence_type"];
          id?: string;
          source_reference?: string | null;
          source_url?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_strategy_evidence__agency_id_client_id";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
          {
            foreignKeyName: "fk_strategy_evidence__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      strategy_version_evidence: {
        Row: {
          agency_id: string;
          client_id: string;
          created_at: string;
          created_by: string;
          evidence_id: string;
          version_id: string;
        };
        Insert: {
          agency_id: string;
          client_id: string;
          created_at?: string;
          created_by: string;
          evidence_id: string;
          version_id: string;
        };
        Update: {
          agency_id?: string;
          client_id?: string;
          created_at?: string;
          created_by?: string;
          evidence_id?: string;
          version_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_strategy_version_evidence__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_strategy_version_evidence__evidence";
            columns: ["agency_id", "client_id", "evidence_id"];
            isOneToOne: false;
            referencedRelation: "strategy_evidence";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_strategy_version_evidence__version";
            columns: ["agency_id", "client_id", "version_id"];
            isOneToOne: false;
            referencedRelation: "strategy_versions";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
        ];
      };
      strategy_versions: {
        Row: {
          agency_id: string;
          artifact_id: string;
          client_id: string;
          content: Json;
          created_at: string;
          created_by: string;
          framework: string;
          framework_version: string;
          id: string;
          status: Database["public"]["Enums"]["strategy_version_status"];
          updated_at: string;
          updated_by: string;
          validated_at: string | null;
          validated_by: string | null;
          version_number: number;
        };
        Insert: {
          agency_id: string;
          artifact_id: string;
          client_id: string;
          content?: Json;
          created_at?: string;
          created_by: string;
          framework: string;
          framework_version: string;
          id?: string;
          status?: Database["public"]["Enums"]["strategy_version_status"];
          updated_at?: string;
          updated_by: string;
          validated_at?: string | null;
          validated_by?: string | null;
          version_number: number;
        };
        Update: {
          agency_id?: string;
          artifact_id?: string;
          client_id?: string;
          content?: Json;
          created_at?: string;
          created_by?: string;
          framework?: string;
          framework_version?: string;
          id?: string;
          status?: Database["public"]["Enums"]["strategy_version_status"];
          updated_at?: string;
          updated_by?: string;
          validated_at?: string | null;
          validated_by?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_strategy_versions__agency_id_client_id_artifact_id";
            columns: ["agency_id", "client_id", "artifact_id"];
            isOneToOne: false;
            referencedRelation: "strategy_artifacts";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_strategy_versions__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_strategy_versions__updated_by";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_strategy_versions__validated_by";
            columns: ["validated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      targeting_profiles: {
        Row: {
          activated_at: string | null;
          activated_by: string | null;
          agency_id: string;
          archived_at: string | null;
          archived_by: string | null;
          client_id: string;
          created_at: string;
          created_by: string;
          id: string;
          lifecycle_status: Database["public"]["Enums"]["targeting_lifecycle_status"];
          name: string;
          profile_type: Database["public"]["Enums"]["targeting_profile_type"];
          updated_at: string;
        };
        Insert: {
          activated_at?: string | null;
          activated_by?: string | null;
          agency_id: string;
          archived_at?: string | null;
          archived_by?: string | null;
          client_id: string;
          created_at?: string;
          created_by: string;
          id?: string;
          lifecycle_status?: Database["public"]["Enums"]["targeting_lifecycle_status"];
          name: string;
          profile_type: Database["public"]["Enums"]["targeting_profile_type"];
          updated_at?: string;
        };
        Update: {
          activated_at?: string | null;
          activated_by?: string | null;
          agency_id?: string;
          archived_at?: string | null;
          archived_by?: string | null;
          client_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          lifecycle_status?: Database["public"]["Enums"]["targeting_lifecycle_status"];
          name?: string;
          profile_type?: Database["public"]["Enums"]["targeting_profile_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_targeting_profiles__activated_by";
            columns: ["activated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_targeting_profiles__agency_id_client_id";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
          {
            foreignKeyName: "fk_targeting_profiles__archived_by";
            columns: ["archived_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_targeting_profiles__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      targeting_versions: {
        Row: {
          agency_id: string;
          ai_execution_id: string | null;
          ai_model_id: string | null;
          ai_prompt_version: string | null;
          ai_skill_id: string | null;
          ai_skill_version: string | null;
          client_id: string;
          content: Json;
          created_at: string;
          created_by: string;
          id: string;
          input_tokens: number | null;
          origin: Database["public"]["Enums"]["targeting_version_origin"];
          output_tokens: number | null;
          pricing_version: string | null;
          profile_id: string;
          source_version_id: string | null;
          status: Database["public"]["Enums"]["targeting_version_status"];
          technical_cost_microusd: number | null;
          updated_at: string;
          updated_by: string;
          validated_at: string | null;
          validated_by: string | null;
          version_number: number;
        };
        Insert: {
          agency_id: string;
          ai_execution_id?: string | null;
          ai_model_id?: string | null;
          ai_prompt_version?: string | null;
          ai_skill_id?: string | null;
          ai_skill_version?: string | null;
          client_id: string;
          content: Json;
          created_at?: string;
          created_by: string;
          id?: string;
          input_tokens?: number | null;
          origin?: Database["public"]["Enums"]["targeting_version_origin"];
          output_tokens?: number | null;
          pricing_version?: string | null;
          profile_id: string;
          source_version_id?: string | null;
          status?: Database["public"]["Enums"]["targeting_version_status"];
          technical_cost_microusd?: number | null;
          updated_at?: string;
          updated_by: string;
          validated_at?: string | null;
          validated_by?: string | null;
          version_number: number;
        };
        Update: {
          agency_id?: string;
          ai_execution_id?: string | null;
          ai_model_id?: string | null;
          ai_prompt_version?: string | null;
          ai_skill_id?: string | null;
          ai_skill_version?: string | null;
          client_id?: string;
          content?: Json;
          created_at?: string;
          created_by?: string;
          id?: string;
          input_tokens?: number | null;
          origin?: Database["public"]["Enums"]["targeting_version_origin"];
          output_tokens?: number | null;
          pricing_version?: string | null;
          profile_id?: string;
          source_version_id?: string | null;
          status?: Database["public"]["Enums"]["targeting_version_status"];
          technical_cost_microusd?: number | null;
          updated_at?: string;
          updated_by?: string;
          validated_at?: string | null;
          validated_by?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_targeting_versions__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_targeting_versions__profile";
            columns: ["agency_id", "client_id", "profile_id"];
            isOneToOne: false;
            referencedRelation: "targeting_profiles";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_targeting_versions__source";
            columns: ["agency_id", "client_id", "source_version_id"];
            isOneToOne: false;
            referencedRelation: "targeting_versions";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_targeting_versions__updated_by";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_targeting_versions__validated_by";
            columns: ["validated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_agency_membership: {
        Args: { requested_membership_id: string };
        Returns: string;
      };
      archive_client: {
        Args: { requested_agency_id: string; requested_client_id: string };
        Returns: string;
      };
      assign_agency_member: {
        Args: {
          requested_agency_id: string;
          requested_profile_id: string;
          requested_role_id: string;
        };
        Returns: string;
      };
      assign_client_member: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_profile_id: string;
          requested_role_id: string;
        };
        Returns: string;
      };
      complete_client_onboarding: {
        Args: { requested_agency_id: string; requested_client_id: string };
        Returns: string;
      };
      create_agency: {
        Args: { requested_name: string; requested_slug: string };
        Returns: string;
      };
      create_ai_targeting_proposal: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_content: Json;
          requested_cost_microusd: number;
          requested_execution_id: string;
          requested_input_tokens: number;
          requested_model_id: string;
          requested_name: string;
          requested_output_tokens: number;
          requested_pricing_version: string;
          requested_profile_type: Database["public"]["Enums"]["targeting_profile_type"];
          requested_prompt_version: string;
          requested_skill_version: string;
        };
        Returns: string;
      };
      create_client: {
        Args: {
          requested_agency_id: string;
          requested_name: string;
          requested_slug: string;
        };
        Returns: string;
      };
      create_client_profile: {
        Args: {
          requested_agency_id: string;
          requested_country_code: string;
          requested_description: string;
          requested_industry: string;
          requested_language_code: string;
          requested_legal_name: string;
          requested_logo_url: string;
          requested_name: string;
          requested_objectives: string[];
          requested_slug: string;
          requested_status: Database["public"]["Enums"]["workspace_status"];
          requested_timezone: string;
          requested_website_url: string;
        };
        Returns: string;
      };
      create_offer_draft: {
        Args: {
          requested_agency_id: string;
          requested_artifact_id?: string;
          requested_client_id: string;
          requested_name?: string;
        };
        Returns: string;
      };
      create_positioning_draft: {
        Args: { requested_agency_id: string; requested_client_id: string };
        Returns: string;
      };
      create_strategy_evidence: {
        Args: {
          requested_agency_id: string;
          requested_classification: Database["public"]["Enums"]["strategy_claim_status"];
          requested_client_id: string;
          requested_description: string;
          requested_evidence_type: Database["public"]["Enums"]["strategy_evidence_type"];
          requested_source_reference?: string;
          requested_source_url?: string;
          requested_title: string;
        };
        Returns: string;
      };
      create_targeting_draft: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_name: string;
          requested_profile_type: Database["public"]["Enums"]["targeting_profile_type"];
          requested_source_profile_id?: string;
        };
        Returns: string;
      };
      create_targeting_version: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_profile_id: string;
          requested_profile_type: Database["public"]["Enums"]["targeting_profile_type"];
        };
        Returns: string;
      };
      save_offer_draft: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_content: Json;
          requested_name: string;
          requested_version_id: string;
        };
        Returns: string;
      };
      save_onboarding_step: {
        Args: {
          requested_agency_id: string;
          requested_answer_data: Json;
          requested_client_id: string;
          requested_current_step: number;
          requested_is_complete: boolean;
          requested_section_key: Database["public"]["Enums"]["onboarding_section_key"];
        };
        Returns: string;
      };
      save_positioning_draft: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_content: Json;
          requested_version_id: string;
        };
        Returns: string;
      };
      save_targeting_draft: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_content: Json;
          requested_name: string;
          requested_profile_type: Database["public"]["Enums"]["targeting_profile_type"];
          requested_version_id: string;
        };
        Returns: string;
      };
      select_active_agency: {
        Args: { requested_agency_id: string };
        Returns: string;
      };
      set_targeting_lifecycle: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_lifecycle_status: Database["public"]["Enums"]["targeting_lifecycle_status"];
          requested_profile_id: string;
          requested_profile_type: Database["public"]["Enums"]["targeting_profile_type"];
        };
        Returns: string;
      };
      update_client_profile: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_country_code: string;
          requested_description: string;
          requested_industry: string;
          requested_language_code: string;
          requested_legal_name: string;
          requested_logo_url: string;
          requested_name: string;
          requested_objectives: string[];
          requested_slug: string;
          requested_status: Database["public"]["Enums"]["workspace_status"];
          requested_timezone: string;
          requested_website_url: string;
        };
        Returns: string;
      };
      validate_client_onboarding: {
        Args: { requested_agency_id: string; requested_client_id: string };
        Returns: string;
      };
      validate_offer_version: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_version_id: string;
        };
        Returns: string;
      };
      validate_positioning_version: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_version_id: string;
        };
        Returns: string;
      };
      validate_targeting_version: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_profile_type: Database["public"]["Enums"]["targeting_profile_type"];
          requested_version_id: string;
        };
        Returns: string;
      };
    };
    Enums: {
      membership_status: "invited" | "active" | "suspended" | "removed";
      onboarding_section_key:
        | "company_information"
        | "products_services"
        | "current_offer"
        | "pricing"
        | "existing_customers"
        | "customer_cases"
        | "available_proofs"
        | "competitors"
        | "problems_solved"
        | "sales_process"
        | "target_markets"
        | "objectives"
        | "existing_channels"
        | "available_integrations";
      onboarding_status: "draft" | "completed" | "validated";
      role_scope: "agency" | "client";
      strategy_artifact_type: "positioning" | "offer";
      strategy_claim_status:
        "confirmed" | "inferred" | "hypothesis" | "missing";
      strategy_evidence_type:
        | "customer_case"
        | "testimonial"
        | "statistic"
        | "document"
        | "internal_data"
        | "authorization"
        | "other";
      strategy_version_status: "draft" | "validated";
      targeting_lifecycle_status: "inactive" | "active" | "archived";
      targeting_profile_type: "icp" | "persona";
      targeting_version_origin: "manual" | "ai_proposal" | "duplicate";
      targeting_version_status: "draft" | "validated";
      workspace_status:
        "draft" | "onboarding" | "active" | "paused" | "archived";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
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
      membership_status: ["invited", "active", "suspended", "removed"],
      onboarding_section_key: [
        "company_information",
        "products_services",
        "current_offer",
        "pricing",
        "existing_customers",
        "customer_cases",
        "available_proofs",
        "competitors",
        "problems_solved",
        "sales_process",
        "target_markets",
        "objectives",
        "existing_channels",
        "available_integrations",
      ],
      onboarding_status: ["draft", "completed", "validated"],
      role_scope: ["agency", "client"],
      strategy_artifact_type: ["positioning", "offer"],
      strategy_claim_status: ["confirmed", "inferred", "hypothesis", "missing"],
      strategy_evidence_type: [
        "customer_case",
        "testimonial",
        "statistic",
        "document",
        "internal_data",
        "authorization",
        "other",
      ],
      strategy_version_status: ["draft", "validated"],
      targeting_lifecycle_status: ["inactive", "active", "archived"],
      targeting_profile_type: ["icp", "persona"],
      targeting_version_origin: ["manual", "ai_proposal", "duplicate"],
      targeting_version_status: ["draft", "validated"],
      workspace_status: ["draft", "onboarding", "active", "paused", "archived"],
    },
  },
} as const;
