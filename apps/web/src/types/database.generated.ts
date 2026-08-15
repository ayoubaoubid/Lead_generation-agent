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
      analytics_daily_metrics: {
        Row: {
          agency_id: string;
          bounces: number;
          client_id: string;
          created_at: string;
          currency: string;
          delivered: number;
          emails_prepared: number;
          emails_sent: number;
          generated_at: string;
          id: string;
          leads: number;
          meetings: number;
          metric_date: string;
          opportunities: number;
          positive_replies: number;
          qualified_leads: number;
          replies: number;
          source_watermark: string;
          technical_cost_microusd: number;
          updated_at: string;
          won_sales: number;
          won_value_microunits: number;
        };
        Insert: {
          agency_id: string;
          bounces?: number;
          client_id: string;
          created_at?: string;
          currency?: string;
          delivered?: number;
          emails_prepared?: number;
          emails_sent?: number;
          generated_at?: string;
          id?: string;
          leads?: number;
          meetings?: number;
          metric_date: string;
          opportunities?: number;
          positive_replies?: number;
          qualified_leads?: number;
          replies?: number;
          source_watermark: string;
          technical_cost_microusd?: number;
          updated_at?: string;
          won_sales?: number;
          won_value_microunits?: number;
        };
        Update: {
          agency_id?: string;
          bounces?: number;
          client_id?: string;
          created_at?: string;
          currency?: string;
          delivered?: number;
          emails_prepared?: number;
          emails_sent?: number;
          generated_at?: string;
          id?: string;
          leads?: number;
          meetings?: number;
          metric_date?: string;
          opportunities?: number;
          positive_replies?: number;
          qualified_leads?: number;
          replies?: number;
          source_watermark?: string;
          technical_cost_microusd?: number;
          updated_at?: string;
          won_sales?: number;
          won_value_microunits?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_analytics_daily_metrics__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
        ];
      };
      async_task_runs: {
        Row: {
          actor_id: string | null;
          agency_id: string;
          attempt_count: number;
          client_id: string;
          completed_at: string | null;
          cost_currency: string;
          cost_microusd: number;
          error_class:
            Database["public"]["Enums"]["async_task_error_class"] | null;
          error_code: string | null;
          error_message_redacted: string | null;
          id: string;
          idempotency_key: string;
          metadata: Json;
          queued_at: string;
          resource_id: string;
          resource_type: string;
          result: Json | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["async_task_run_status"];
          task_id: string;
          trigger_run_id: string | null;
          updated_at: string;
        };
        Insert: {
          actor_id?: string | null;
          agency_id: string;
          attempt_count?: number;
          client_id: string;
          completed_at?: string | null;
          cost_currency?: string;
          cost_microusd?: number;
          error_class?:
            Database["public"]["Enums"]["async_task_error_class"] | null;
          error_code?: string | null;
          error_message_redacted?: string | null;
          id?: string;
          idempotency_key: string;
          metadata?: Json;
          queued_at?: string;
          resource_id: string;
          resource_type: string;
          result?: Json | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["async_task_run_status"];
          task_id: string;
          trigger_run_id?: string | null;
          updated_at?: string;
        };
        Update: {
          actor_id?: string | null;
          agency_id?: string;
          attempt_count?: number;
          client_id?: string;
          completed_at?: string | null;
          cost_currency?: string;
          cost_microusd?: number;
          error_class?:
            Database["public"]["Enums"]["async_task_error_class"] | null;
          error_code?: string | null;
          error_message_redacted?: string | null;
          id?: string;
          idempotency_key?: string;
          metadata?: Json;
          queued_at?: string;
          resource_id?: string;
          resource_type?: string;
          result?: Json | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["async_task_run_status"];
          task_id?: string;
          trigger_run_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_async_task_runs__actor";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_async_task_runs__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
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
      calendar_availability_rules: {
        Row: {
          active: boolean;
          agency_id: string;
          buffer_after_minutes: number;
          buffer_before_minutes: number;
          calendar_connection_id: string;
          client_id: string;
          created_at: string;
          created_by: string;
          end_time: string;
          id: string;
          start_time: string;
          timezone: string;
          updated_at: string;
          weekday: number;
        };
        Insert: {
          active?: boolean;
          agency_id: string;
          buffer_after_minutes?: number;
          buffer_before_minutes?: number;
          calendar_connection_id: string;
          client_id: string;
          created_at?: string;
          created_by: string;
          end_time: string;
          id?: string;
          start_time: string;
          timezone: string;
          updated_at?: string;
          weekday: number;
        };
        Update: {
          active?: boolean;
          agency_id?: string;
          buffer_after_minutes?: number;
          buffer_before_minutes?: number;
          calendar_connection_id?: string;
          client_id?: string;
          created_at?: string;
          created_by?: string;
          end_time?: string;
          id?: string;
          start_time?: string;
          timezone?: string;
          updated_at?: string;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_calendar_availability_rules__calendar";
            columns: ["agency_id", "client_id", "calendar_connection_id"];
            isOneToOne: false;
            referencedRelation: "calendar_connections";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_calendar_availability_rules__creator";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_connections: {
        Row: {
          agency_id: string;
          archived_at: string | null;
          client_id: string;
          created_at: string;
          created_by: string;
          credential_reference: string | null;
          external_calendar_reference: string;
          id: string;
          last_error_code: string | null;
          last_sync_at: string | null;
          provider: string;
          status: Database["public"]["Enums"]["calendar_connection_status"];
          timezone: string;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          archived_at?: string | null;
          client_id: string;
          created_at?: string;
          created_by: string;
          credential_reference?: string | null;
          external_calendar_reference: string;
          id?: string;
          last_error_code?: string | null;
          last_sync_at?: string | null;
          provider: string;
          status?: Database["public"]["Enums"]["calendar_connection_status"];
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          archived_at?: string | null;
          client_id?: string;
          created_at?: string;
          created_by?: string;
          credential_reference?: string | null;
          external_calendar_reference?: string;
          id?: string;
          last_error_code?: string | null;
          last_sync_at?: string | null;
          provider?: string;
          status?: Database["public"]["Enums"]["calendar_connection_status"];
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_calendar_connections__creator";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_calendar_connections__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
        ];
      };
      campaign_message_reviews: {
        Row: {
          agency_id: string;
          ai_execution_id: string | null;
          client_id: string;
          created_at: string;
          decision: Database["public"]["Enums"]["message_review_decision"];
          id: string;
          issues: Json;
          message_id: string;
          message_version_id: string;
          review_type: Database["public"]["Enums"]["message_review_type"];
          reviewed_by: string | null;
          reviewer_agent_id: string | null;
          reviewer_agent_version: string | null;
          reviewer_model_id: string | null;
          reviewer_prompt_version: string | null;
          reviewer_skill_id: string | null;
          reviewer_skill_version: string | null;
          scores: Json;
        };
        Insert: {
          agency_id: string;
          ai_execution_id?: string | null;
          client_id: string;
          created_at?: string;
          decision: Database["public"]["Enums"]["message_review_decision"];
          id?: string;
          issues?: Json;
          message_id: string;
          message_version_id: string;
          review_type: Database["public"]["Enums"]["message_review_type"];
          reviewed_by?: string | null;
          reviewer_agent_id?: string | null;
          reviewer_agent_version?: string | null;
          reviewer_model_id?: string | null;
          reviewer_prompt_version?: string | null;
          reviewer_skill_id?: string | null;
          reviewer_skill_version?: string | null;
          scores?: Json;
        };
        Update: {
          agency_id?: string;
          ai_execution_id?: string | null;
          client_id?: string;
          created_at?: string;
          decision?: Database["public"]["Enums"]["message_review_decision"];
          id?: string;
          issues?: Json;
          message_id?: string;
          message_version_id?: string;
          review_type?: Database["public"]["Enums"]["message_review_type"];
          reviewed_by?: string | null;
          reviewer_agent_id?: string | null;
          reviewer_agent_version?: string | null;
          reviewer_model_id?: string | null;
          reviewer_prompt_version?: string | null;
          reviewer_skill_id?: string | null;
          reviewer_skill_version?: string | null;
          scores?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "fk_campaign_message_reviews__message";
            columns: ["agency_id", "client_id", "message_id"];
            isOneToOne: false;
            referencedRelation: "campaign_messages";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_campaign_message_reviews__reviewed_by";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_campaign_message_reviews__version";
            columns: ["agency_id", "client_id", "message_version_id"];
            isOneToOne: false;
            referencedRelation: "campaign_message_versions";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
        ];
      };
      campaign_message_versions: {
        Row: {
          agency_id: string;
          ai_execution_id: string | null;
          approved_at: string | null;
          approved_by: string | null;
          body: string;
          call_to_action: string;
          client_id: string;
          created_at: string;
          created_by: string;
          format: Database["public"]["Enums"]["message_format"];
          generation_cost_microusd: number | null;
          generation_tokens: number | null;
          grounded_statements: Json;
          id: string;
          input_fingerprint: string;
          input_snapshot: Json;
          main_idea: string;
          message_id: string;
          missing_evidence: Json;
          origin: Database["public"]["Enums"]["message_version_origin"];
          rejected_at: string | null;
          rejected_by: string | null;
          skill_versions: Json;
          status: Database["public"]["Enums"]["campaign_message_status"];
          subject: string | null;
          submitted_for_review_at: string | null;
          submitted_for_review_by: string | null;
          updated_at: string;
          version_number: number;
          word_count: number;
        };
        Insert: {
          agency_id: string;
          ai_execution_id?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          body: string;
          call_to_action: string;
          client_id: string;
          created_at?: string;
          created_by: string;
          format: Database["public"]["Enums"]["message_format"];
          generation_cost_microusd?: number | null;
          generation_tokens?: number | null;
          grounded_statements?: Json;
          id?: string;
          input_fingerprint: string;
          input_snapshot?: Json;
          main_idea: string;
          message_id: string;
          missing_evidence?: Json;
          origin: Database["public"]["Enums"]["message_version_origin"];
          rejected_at?: string | null;
          rejected_by?: string | null;
          skill_versions: Json;
          status?: Database["public"]["Enums"]["campaign_message_status"];
          subject?: string | null;
          submitted_for_review_at?: string | null;
          submitted_for_review_by?: string | null;
          updated_at?: string;
          version_number: number;
          word_count: number;
        };
        Update: {
          agency_id?: string;
          ai_execution_id?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          body?: string;
          call_to_action?: string;
          client_id?: string;
          created_at?: string;
          created_by?: string;
          format?: Database["public"]["Enums"]["message_format"];
          generation_cost_microusd?: number | null;
          generation_tokens?: number | null;
          grounded_statements?: Json;
          id?: string;
          input_fingerprint?: string;
          input_snapshot?: Json;
          main_idea?: string;
          message_id?: string;
          missing_evidence?: Json;
          origin?: Database["public"]["Enums"]["message_version_origin"];
          rejected_at?: string | null;
          rejected_by?: string | null;
          skill_versions?: Json;
          status?: Database["public"]["Enums"]["campaign_message_status"];
          subject?: string | null;
          submitted_for_review_at?: string | null;
          submitted_for_review_by?: string | null;
          updated_at?: string;
          version_number?: number;
          word_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_campaign_message_versions__approved_by";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_campaign_message_versions__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_campaign_message_versions__message";
            columns: ["agency_id", "client_id", "message_id"];
            isOneToOne: false;
            referencedRelation: "campaign_messages";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_campaign_message_versions__rejected_by";
            columns: ["rejected_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_campaign_message_versions__submitted_by";
            columns: ["submitted_for_review_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      campaign_messages: {
        Row: {
          agency_id: string;
          campaign_id: string;
          campaign_prospect_id: string;
          client_id: string;
          created_at: string;
          created_by: string;
          current_version_id: string | null;
          id: string;
          sequence_step_id: string;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          campaign_id: string;
          campaign_prospect_id: string;
          client_id: string;
          created_at?: string;
          created_by: string;
          current_version_id?: string | null;
          id?: string;
          sequence_step_id: string;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          campaign_id?: string;
          campaign_prospect_id?: string;
          client_id?: string;
          created_at?: string;
          created_by?: string;
          current_version_id?: string | null;
          id?: string;
          sequence_step_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_campaign_messages__campaign";
            columns: ["agency_id", "client_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_campaign_messages__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_campaign_messages__current_version";
            columns: ["agency_id", "client_id", "current_version_id"];
            isOneToOne: false;
            referencedRelation: "campaign_message_versions";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_campaign_messages__prospect";
            columns: ["agency_id", "client_id", "campaign_prospect_id"];
            isOneToOne: false;
            referencedRelation: "campaign_prospects";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_campaign_messages__step";
            columns: ["agency_id", "client_id", "sequence_step_id"];
            isOneToOne: false;
            referencedRelation: "campaign_sequence_steps";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
        ];
      };
      campaign_personas: {
        Row: {
          agency_id: string;
          campaign_id: string;
          client_id: string;
          created_at: string;
          persona_id: string;
        };
        Insert: {
          agency_id: string;
          campaign_id: string;
          client_id: string;
          created_at?: string;
          persona_id: string;
        };
        Update: {
          agency_id?: string;
          campaign_id?: string;
          client_id?: string;
          created_at?: string;
          persona_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_campaign_personas__campaign";
            columns: ["agency_id", "client_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_campaign_personas__persona";
            columns: ["agency_id", "client_id", "persona_id"];
            isOneToOne: false;
            referencedRelation: "targeting_profiles";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
        ];
      };
      campaign_prospects: {
        Row: {
          agency_id: string;
          campaign_id: string;
          client_id: string;
          contact_id: string;
          created_at: string;
          id: string;
          lead_score_id: string | null;
          status: Database["public"]["Enums"]["campaign_prospect_status"];
          stop_reason:
            Database["public"]["Enums"]["campaign_stop_reason"] | null;
          stopped_at: string | null;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          campaign_id: string;
          client_id: string;
          contact_id: string;
          created_at?: string;
          id?: string;
          lead_score_id?: string | null;
          status?: Database["public"]["Enums"]["campaign_prospect_status"];
          stop_reason?:
            Database["public"]["Enums"]["campaign_stop_reason"] | null;
          stopped_at?: string | null;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          campaign_id?: string;
          client_id?: string;
          contact_id?: string;
          created_at?: string;
          id?: string;
          lead_score_id?: string | null;
          status?: Database["public"]["Enums"]["campaign_prospect_status"];
          stop_reason?:
            Database["public"]["Enums"]["campaign_stop_reason"] | null;
          stopped_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_campaign_prospects__campaign";
            columns: ["agency_id", "client_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_campaign_prospects__contact";
            columns: ["agency_id", "client_id", "contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_campaign_prospects__score";
            columns: ["agency_id", "client_id", "lead_score_id"];
            isOneToOne: false;
            referencedRelation: "lead_scores";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
        ];
      };
      campaign_sending_accounts: {
        Row: {
          agency_id: string;
          campaign_id: string;
          client_id: string;
          created_at: string;
          created_by: string;
          sending_account_id: string;
          weight: number;
        };
        Insert: {
          agency_id: string;
          campaign_id: string;
          client_id: string;
          created_at?: string;
          created_by?: string;
          sending_account_id: string;
          weight?: number;
        };
        Update: {
          agency_id?: string;
          campaign_id?: string;
          client_id?: string;
          created_at?: string;
          created_by?: string;
          sending_account_id?: string;
          weight?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_campaign_sending_accounts__account";
            columns: ["agency_id", "client_id", "sending_account_id"];
            isOneToOne: false;
            referencedRelation: "sending_accounts";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_campaign_sending_accounts__campaign";
            columns: ["agency_id", "client_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_campaign_sending_accounts__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      campaign_sequence_steps: {
        Row: {
          agency_id: string;
          client_id: string;
          conditions: Json;
          created_at: string;
          delay_minutes: number;
          id: string;
          sequence_id: string;
          step_order: number;
          step_type: Database["public"]["Enums"]["sequence_step_type"];
          stop_rules: Database["public"]["Enums"]["campaign_stop_reason"][];
          template_body: string | null;
          template_subject: string | null;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          client_id: string;
          conditions?: Json;
          created_at?: string;
          delay_minutes?: number;
          id?: string;
          sequence_id: string;
          step_order: number;
          step_type: Database["public"]["Enums"]["sequence_step_type"];
          stop_rules?: Database["public"]["Enums"]["campaign_stop_reason"][];
          template_body?: string | null;
          template_subject?: string | null;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          client_id?: string;
          conditions?: Json;
          created_at?: string;
          delay_minutes?: number;
          id?: string;
          sequence_id?: string;
          step_order?: number;
          step_type?: Database["public"]["Enums"]["sequence_step_type"];
          stop_rules?: Database["public"]["Enums"]["campaign_stop_reason"][];
          template_body?: string | null;
          template_subject?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_campaign_sequence_steps__sequence";
            columns: ["agency_id", "client_id", "sequence_id"];
            isOneToOne: false;
            referencedRelation: "campaign_sequences";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
        ];
      };
      campaign_sequences: {
        Row: {
          agency_id: string;
          campaign_id: string;
          client_id: string;
          created_at: string;
          created_by: string;
          id: string;
          is_active: boolean;
          name: string;
          updated_at: string;
          version_number: number;
        };
        Insert: {
          agency_id: string;
          campaign_id: string;
          client_id: string;
          created_at?: string;
          created_by: string;
          id?: string;
          is_active?: boolean;
          name: string;
          updated_at?: string;
          version_number?: number;
        };
        Update: {
          agency_id?: string;
          campaign_id?: string;
          client_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          updated_at?: string;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_campaign_sequences__campaign";
            columns: ["agency_id", "client_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_campaign_sequences__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      campaigns: {
        Row: {
          agency_id: string;
          approved_at: string | null;
          approved_by: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          channel: Database["public"]["Enums"]["outreach_channel"];
          client_id: string;
          completed_at: string | null;
          created_at: string;
          created_by: string;
          icp_id: string | null;
          id: string;
          name: string;
          objective: string;
          offer_id: string | null;
          paused_at: string | null;
          paused_by: string | null;
          schedule_rules: Json;
          scheduled_at: string | null;
          scheduled_by: string | null;
          scheduled_end_at: string | null;
          scheduled_start_at: string | null;
          segment_id: string | null;
          status: Database["public"]["Enums"]["campaign_status"];
          stop_rules: Database["public"]["Enums"]["campaign_stop_reason"][];
          submitted_at: string | null;
          submitted_by: string | null;
          target_metrics: Json;
          timezone: string;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          agency_id: string;
          approved_at?: string | null;
          approved_by?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          channel?: Database["public"]["Enums"]["outreach_channel"];
          client_id: string;
          completed_at?: string | null;
          created_at?: string;
          created_by: string;
          icp_id?: string | null;
          id?: string;
          name: string;
          objective: string;
          offer_id?: string | null;
          paused_at?: string | null;
          paused_by?: string | null;
          schedule_rules?: Json;
          scheduled_at?: string | null;
          scheduled_by?: string | null;
          scheduled_end_at?: string | null;
          scheduled_start_at?: string | null;
          segment_id?: string | null;
          status?: Database["public"]["Enums"]["campaign_status"];
          stop_rules?: Database["public"]["Enums"]["campaign_stop_reason"][];
          submitted_at?: string | null;
          submitted_by?: string | null;
          target_metrics?: Json;
          timezone: string;
          updated_at?: string;
          updated_by: string;
        };
        Update: {
          agency_id?: string;
          approved_at?: string | null;
          approved_by?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          channel?: Database["public"]["Enums"]["outreach_channel"];
          client_id?: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string;
          icp_id?: string | null;
          id?: string;
          name?: string;
          objective?: string;
          offer_id?: string | null;
          paused_at?: string | null;
          paused_by?: string | null;
          schedule_rules?: Json;
          scheduled_at?: string | null;
          scheduled_by?: string | null;
          scheduled_end_at?: string | null;
          scheduled_start_at?: string | null;
          segment_id?: string | null;
          status?: Database["public"]["Enums"]["campaign_status"];
          stop_rules?: Database["public"]["Enums"]["campaign_stop_reason"][];
          submitted_at?: string | null;
          submitted_by?: string | null;
          target_metrics?: Json;
          timezone?: string;
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_campaigns__approved_by";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_campaigns__cancelled_by";
            columns: ["cancelled_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_campaigns__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_campaigns__icp";
            columns: ["agency_id", "client_id", "icp_id"];
            isOneToOne: false;
            referencedRelation: "targeting_profiles";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_campaigns__offer";
            columns: ["agency_id", "client_id", "offer_id"];
            isOneToOne: false;
            referencedRelation: "strategy_artifacts";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_campaigns__paused_by";
            columns: ["paused_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_campaigns__scheduled_by";
            columns: ["scheduled_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_campaigns__segment";
            columns: ["agency_id", "client_id", "segment_id"];
            isOneToOne: false;
            referencedRelation: "segments";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_campaigns__submitted_by";
            columns: ["submitted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_campaigns__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
          {
            foreignKeyName: "fk_campaigns__updated_by";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      client_compliance_profiles: {
        Row: {
          agency_id: string;
          audience_type: Database["public"]["Enums"]["contact_audience_type"];
          channels: string[];
          client_id: string;
          configuration_status: string;
          countries: string[];
          created_at: string;
          created_by: string;
          id: string;
          legal_basis: string | null;
          legal_reviewed_at: string | null;
          legal_reviewed_by: string | null;
          purpose: string;
          retention_days: number | null;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          audience_type?: Database["public"]["Enums"]["contact_audience_type"];
          channels?: string[];
          client_id: string;
          configuration_status?: string;
          countries?: string[];
          created_at?: string;
          created_by: string;
          id?: string;
          legal_basis?: string | null;
          legal_reviewed_at?: string | null;
          legal_reviewed_by?: string | null;
          purpose: string;
          retention_days?: number | null;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          audience_type?: Database["public"]["Enums"]["contact_audience_type"];
          channels?: string[];
          client_id?: string;
          configuration_status?: string;
          countries?: string[];
          created_at?: string;
          created_by?: string;
          id?: string;
          legal_basis?: string | null;
          legal_reviewed_at?: string | null;
          legal_reviewed_by?: string | null;
          purpose?: string;
          retention_days?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_client_compliance_profiles__creator";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_client_compliance_profiles__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: true;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
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
      companies: {
        Row: {
          agency_id: string;
          annual_revenue: number | null;
          archived_at: string | null;
          archived_by: string | null;
          client_id: string;
          confidence_score: number | null;
          country_code: string | null;
          created_at: string;
          created_by: string;
          description: string | null;
          domain: string | null;
          employee_count: number | null;
          fact_status: Database["public"]["Enums"]["data_fact_status"];
          id: string;
          industry: string | null;
          name: string;
          normalized_name: string;
          revenue_currency: string | null;
          source_import_id: string | null;
          source_import_row_number: number | null;
          technologies: string[];
          updated_at: string;
          verification_status: Database["public"]["Enums"]["data_verification_status"];
          verified_at: string | null;
          verified_by: string | null;
          website_url: string | null;
        };
        Insert: {
          agency_id: string;
          annual_revenue?: number | null;
          archived_at?: string | null;
          archived_by?: string | null;
          client_id: string;
          confidence_score?: number | null;
          country_code?: string | null;
          created_at?: string;
          created_by: string;
          description?: string | null;
          domain?: string | null;
          employee_count?: number | null;
          fact_status?: Database["public"]["Enums"]["data_fact_status"];
          id?: string;
          industry?: string | null;
          name: string;
          normalized_name: string;
          revenue_currency?: string | null;
          source_import_id?: string | null;
          source_import_row_number?: number | null;
          technologies?: string[];
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["data_verification_status"];
          verified_at?: string | null;
          verified_by?: string | null;
          website_url?: string | null;
        };
        Update: {
          agency_id?: string;
          annual_revenue?: number | null;
          archived_at?: string | null;
          archived_by?: string | null;
          client_id?: string;
          confidence_score?: number | null;
          country_code?: string | null;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          domain?: string | null;
          employee_count?: number | null;
          fact_status?: Database["public"]["Enums"]["data_fact_status"];
          id?: string;
          industry?: string | null;
          name?: string;
          normalized_name?: string;
          revenue_currency?: string | null;
          source_import_id?: string | null;
          source_import_row_number?: number | null;
          technologies?: string[];
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["data_verification_status"];
          verified_at?: string | null;
          verified_by?: string | null;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_companies__archived_by";
            columns: ["archived_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_companies__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_companies__source_import";
            columns: ["agency_id", "client_id", "source_import_id"];
            isOneToOne: false;
            referencedRelation: "data_imports";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_companies__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
          {
            foreignKeyName: "fk_companies__verified_by";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      company_sources: {
        Row: {
          agency_id: string;
          client_id: string;
          collected_at: string;
          company_id: string;
          confidence_score: number | null;
          created_at: string;
          created_by: string;
          external_id: string | null;
          fact_status: Database["public"]["Enums"]["data_fact_status"];
          id: string;
          metadata: Json;
          provider: string | null;
          source_type: Database["public"]["Enums"]["entity_source_type"];
          source_url: string | null;
          updated_at: string;
          verification_status: Database["public"]["Enums"]["data_verification_status"];
        };
        Insert: {
          agency_id: string;
          client_id: string;
          collected_at: string;
          company_id: string;
          confidence_score?: number | null;
          created_at?: string;
          created_by: string;
          external_id?: string | null;
          fact_status?: Database["public"]["Enums"]["data_fact_status"];
          id?: string;
          metadata?: Json;
          provider?: string | null;
          source_type: Database["public"]["Enums"]["entity_source_type"];
          source_url?: string | null;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["data_verification_status"];
        };
        Update: {
          agency_id?: string;
          client_id?: string;
          collected_at?: string;
          company_id?: string;
          confidence_score?: number | null;
          created_at?: string;
          created_by?: string;
          external_id?: string | null;
          fact_status?: Database["public"]["Enums"]["data_fact_status"];
          id?: string;
          metadata?: Json;
          provider?: string | null;
          source_type?: Database["public"]["Enums"]["entity_source_type"];
          source_url?: string | null;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["data_verification_status"];
        };
        Relationships: [
          {
            foreignKeyName: "fk_company_sources__company";
            columns: ["agency_id", "client_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_company_sources__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_compliance_records: {
        Row: {
          agency_id: string;
          audience_type: Database["public"]["Enums"]["contact_audience_type"];
          client_id: string;
          collected_at: string;
          contact_id: string;
          country: string | null;
          created_at: string;
          created_by: string | null;
          evidence: Json;
          id: string;
          legal_basis: string | null;
          purpose: string;
          retain_until: string | null;
          source: string;
          source_url: string | null;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          audience_type?: Database["public"]["Enums"]["contact_audience_type"];
          client_id: string;
          collected_at: string;
          contact_id: string;
          country?: string | null;
          created_at?: string;
          created_by?: string | null;
          evidence?: Json;
          id?: string;
          legal_basis?: string | null;
          purpose: string;
          retain_until?: string | null;
          source: string;
          source_url?: string | null;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          audience_type?: Database["public"]["Enums"]["contact_audience_type"];
          client_id?: string;
          collected_at?: string;
          contact_id?: string;
          country?: string | null;
          created_at?: string;
          created_by?: string | null;
          evidence?: Json;
          id?: string;
          legal_basis?: string | null;
          purpose?: string;
          retain_until?: string | null;
          source?: string;
          source_url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_contact_compliance_records__contact";
            columns: ["agency_id", "client_id", "contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_contact_compliance_records__creator";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_sources: {
        Row: {
          agency_id: string;
          client_id: string;
          collected_at: string;
          confidence_score: number | null;
          contact_id: string;
          created_at: string;
          created_by: string;
          external_id: string | null;
          fact_status: Database["public"]["Enums"]["data_fact_status"];
          id: string;
          metadata: Json;
          provider: string | null;
          source_type: Database["public"]["Enums"]["entity_source_type"];
          source_url: string | null;
          updated_at: string;
          verification_status: Database["public"]["Enums"]["data_verification_status"];
        };
        Insert: {
          agency_id: string;
          client_id: string;
          collected_at: string;
          confidence_score?: number | null;
          contact_id: string;
          created_at?: string;
          created_by: string;
          external_id?: string | null;
          fact_status?: Database["public"]["Enums"]["data_fact_status"];
          id?: string;
          metadata?: Json;
          provider?: string | null;
          source_type: Database["public"]["Enums"]["entity_source_type"];
          source_url?: string | null;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["data_verification_status"];
        };
        Update: {
          agency_id?: string;
          client_id?: string;
          collected_at?: string;
          confidence_score?: number | null;
          contact_id?: string;
          created_at?: string;
          created_by?: string;
          external_id?: string | null;
          fact_status?: Database["public"]["Enums"]["data_fact_status"];
          id?: string;
          metadata?: Json;
          provider?: string | null;
          source_type?: Database["public"]["Enums"]["entity_source_type"];
          source_url?: string | null;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["data_verification_status"];
        };
        Relationships: [
          {
            foreignKeyName: "fk_contact_sources__contact";
            columns: ["agency_id", "client_id", "contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_contact_sources__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      contacts: {
        Row: {
          agency_id: string;
          archived_at: string | null;
          archived_by: string | null;
          client_id: string;
          company_id: string | null;
          confidence_score: number | null;
          country_code: string | null;
          created_at: string;
          created_by: string;
          department: string | null;
          email: string | null;
          fact_status: Database["public"]["Enums"]["data_fact_status"];
          first_name: string | null;
          full_name: string;
          id: string;
          job_title: string | null;
          last_name: string | null;
          linkedin_url: string | null;
          normalized_name: string;
          phone: string | null;
          seniority: string | null;
          source_import_id: string | null;
          source_import_row_number: number | null;
          updated_at: string;
          verification_status: Database["public"]["Enums"]["data_verification_status"];
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          agency_id: string;
          archived_at?: string | null;
          archived_by?: string | null;
          client_id: string;
          company_id?: string | null;
          confidence_score?: number | null;
          country_code?: string | null;
          created_at?: string;
          created_by: string;
          department?: string | null;
          email?: string | null;
          fact_status?: Database["public"]["Enums"]["data_fact_status"];
          first_name?: string | null;
          full_name: string;
          id?: string;
          job_title?: string | null;
          last_name?: string | null;
          linkedin_url?: string | null;
          normalized_name: string;
          phone?: string | null;
          seniority?: string | null;
          source_import_id?: string | null;
          source_import_row_number?: number | null;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["data_verification_status"];
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          agency_id?: string;
          archived_at?: string | null;
          archived_by?: string | null;
          client_id?: string;
          company_id?: string | null;
          confidence_score?: number | null;
          country_code?: string | null;
          created_at?: string;
          created_by?: string;
          department?: string | null;
          email?: string | null;
          fact_status?: Database["public"]["Enums"]["data_fact_status"];
          first_name?: string | null;
          full_name?: string;
          id?: string;
          job_title?: string | null;
          last_name?: string | null;
          linkedin_url?: string | null;
          normalized_name?: string;
          phone?: string | null;
          seniority?: string | null;
          source_import_id?: string | null;
          source_import_row_number?: number | null;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["data_verification_status"];
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_contacts__archived_by";
            columns: ["archived_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_contacts__company";
            columns: ["agency_id", "client_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_contacts__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_contacts__source_import";
            columns: ["agency_id", "client_id", "source_import_id"];
            isOneToOne: false;
            referencedRelation: "data_imports";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_contacts__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
          {
            foreignKeyName: "fk_contacts__verified_by";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      data_import_rows: {
        Row: {
          agency_id: string;
          client_id: string;
          company_id: string | null;
          contact_id: string | null;
          created_at: string;
          duplicate_reason: string | null;
          error_codes: string[];
          error_message: string | null;
          id: number;
          import_id: string;
          normalized_data: Json;
          processed_at: string | null;
          raw_data: Json;
          row_number: number;
          status: Database["public"]["Enums"]["data_import_row_status"];
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          client_id: string;
          company_id?: string | null;
          contact_id?: string | null;
          created_at?: string;
          duplicate_reason?: string | null;
          error_codes?: string[];
          error_message?: string | null;
          id?: never;
          import_id: string;
          normalized_data?: Json;
          processed_at?: string | null;
          raw_data: Json;
          row_number: number;
          status?: Database["public"]["Enums"]["data_import_row_status"];
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          client_id?: string;
          company_id?: string | null;
          contact_id?: string | null;
          created_at?: string;
          duplicate_reason?: string | null;
          error_codes?: string[];
          error_message?: string | null;
          id?: never;
          import_id?: string;
          normalized_data?: Json;
          processed_at?: string | null;
          raw_data?: Json;
          row_number?: number;
          status?: Database["public"]["Enums"]["data_import_row_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_data_import_rows__company";
            columns: ["agency_id", "client_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_data_import_rows__contact";
            columns: ["agency_id", "client_id", "contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_data_import_rows__import";
            columns: ["agency_id", "client_id", "import_id"];
            isOneToOne: false;
            referencedRelation: "data_imports";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
        ];
      };
      data_imports: {
        Row: {
          agency_id: string;
          cancellation_requested_at: string | null;
          cancellation_requested_by: string | null;
          client_id: string;
          column_mapping: Json;
          completed_at: string | null;
          created_at: string;
          created_by: string;
          created_row_count: number;
          delimiter: string;
          duplicate_row_count: number;
          entity_type: Database["public"]["Enums"]["data_import_entity_type"];
          error_summary: Json;
          estimated_row_count: number | null;
          failed_row_count: number;
          file_name: string;
          file_sha256: string | null;
          file_size_bytes: number;
          id: string;
          invalid_row_count: number;
          mime_type: string;
          processed_row_count: number;
          started_at: string | null;
          status: Database["public"]["Enums"]["data_import_status"];
          storage_path: string;
          trigger_run_id: string | null;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          cancellation_requested_at?: string | null;
          cancellation_requested_by?: string | null;
          client_id: string;
          column_mapping: Json;
          completed_at?: string | null;
          created_at?: string;
          created_by: string;
          created_row_count?: number;
          delimiter?: string;
          duplicate_row_count?: number;
          entity_type: Database["public"]["Enums"]["data_import_entity_type"];
          error_summary?: Json;
          estimated_row_count?: number | null;
          failed_row_count?: number;
          file_name: string;
          file_sha256?: string | null;
          file_size_bytes: number;
          id?: string;
          invalid_row_count?: number;
          mime_type: string;
          processed_row_count?: number;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["data_import_status"];
          storage_path: string;
          trigger_run_id?: string | null;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          cancellation_requested_at?: string | null;
          cancellation_requested_by?: string | null;
          client_id?: string;
          column_mapping?: Json;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string;
          created_row_count?: number;
          delimiter?: string;
          duplicate_row_count?: number;
          entity_type?: Database["public"]["Enums"]["data_import_entity_type"];
          error_summary?: Json;
          estimated_row_count?: number | null;
          failed_row_count?: number;
          file_name?: string;
          file_sha256?: string | null;
          file_size_bytes?: number;
          id?: string;
          invalid_row_count?: number;
          mime_type?: string;
          processed_row_count?: number;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["data_import_status"];
          storage_path?: string;
          trigger_run_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_data_imports__cancelled_by";
            columns: ["cancellation_requested_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_data_imports__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_data_imports__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
        ];
      };
      data_subject_requests: {
        Row: {
          agency_id: string;
          client_id: string | null;
          completed_at: string | null;
          contact_id: string | null;
          created_at: string;
          created_by: string | null;
          due_at: string | null;
          id: string;
          rejection_reason: string | null;
          request_type: Database["public"]["Enums"]["data_subject_request_type"];
          requester_email_hash: string | null;
          result_reference: string | null;
          status: Database["public"]["Enums"]["data_subject_request_status"];
          updated_at: string;
          verified_at: string | null;
        };
        Insert: {
          agency_id: string;
          client_id?: string | null;
          completed_at?: string | null;
          contact_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          due_at?: string | null;
          id?: string;
          rejection_reason?: string | null;
          request_type: Database["public"]["Enums"]["data_subject_request_type"];
          requester_email_hash?: string | null;
          result_reference?: string | null;
          status?: Database["public"]["Enums"]["data_subject_request_status"];
          updated_at?: string;
          verified_at?: string | null;
        };
        Update: {
          agency_id?: string;
          client_id?: string | null;
          completed_at?: string | null;
          contact_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          due_at?: string | null;
          id?: string;
          rejection_reason?: string | null;
          request_type?: Database["public"]["Enums"]["data_subject_request_type"];
          requester_email_hash?: string | null;
          result_reference?: string | null;
          status?: Database["public"]["Enums"]["data_subject_request_status"];
          updated_at?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_data_subject_requests__agency";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_data_subject_requests__contact";
            columns: ["agency_id", "client_id", "contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_data_subject_requests__creator";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_data_subject_requests__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
        ];
      };
      deliverability_checks: {
        Row: {
          agency_id: string;
          checked_at: string;
          client_id: string;
          created_at: string;
          created_by: string | null;
          evidence: Json;
          expires_at: string | null;
          id: string;
          is_critical: boolean;
          kind: Database["public"]["Enums"]["deliverability_check_kind"];
          sending_account_id: string | null;
          sending_domain_id: string | null;
          status: Database["public"]["Enums"]["deliverability_check_status"];
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          checked_at?: string;
          client_id: string;
          created_at?: string;
          created_by?: string | null;
          evidence?: Json;
          expires_at?: string | null;
          id?: string;
          is_critical?: boolean;
          kind: Database["public"]["Enums"]["deliverability_check_kind"];
          sending_account_id?: string | null;
          sending_domain_id?: string | null;
          status: Database["public"]["Enums"]["deliverability_check_status"];
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          checked_at?: string;
          client_id?: string;
          created_at?: string;
          created_by?: string | null;
          evidence?: Json;
          expires_at?: string | null;
          id?: string;
          is_critical?: boolean;
          kind?: Database["public"]["Enums"]["deliverability_check_kind"];
          sending_account_id?: string | null;
          sending_domain_id?: string | null;
          status?: Database["public"]["Enums"]["deliverability_check_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_deliverability_checks__account";
            columns: ["agency_id", "client_id", "sending_account_id"];
            isOneToOne: false;
            referencedRelation: "sending_accounts";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_deliverability_checks__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_deliverability_checks__domain";
            columns: ["agency_id", "client_id", "sending_domain_id"];
            isOneToOne: false;
            referencedRelation: "sending_domains";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_deliverability_checks__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
        ];
      };
      delivery_attempts: {
        Row: {
          agency_id: string;
          client_id: string;
          completed_at: string | null;
          cost_microusd: number;
          created_at: string;
          error_code: string | null;
          error_message_redacted: string | null;
          id: string;
          outbound_message_id: string;
          provider: string;
          provider_message_id: string | null;
          provider_request_key: string;
          started_at: string;
          status: Database["public"]["Enums"]["delivery_attempt_status"];
          technical_attempt: number;
          trigger_run_id: string | null;
        };
        Insert: {
          agency_id: string;
          client_id: string;
          completed_at?: string | null;
          cost_microusd?: number;
          created_at?: string;
          error_code?: string | null;
          error_message_redacted?: string | null;
          id?: string;
          outbound_message_id: string;
          provider: string;
          provider_message_id?: string | null;
          provider_request_key: string;
          started_at?: string;
          status: Database["public"]["Enums"]["delivery_attempt_status"];
          technical_attempt: number;
          trigger_run_id?: string | null;
        };
        Update: {
          agency_id?: string;
          client_id?: string;
          completed_at?: string | null;
          cost_microusd?: number;
          created_at?: string;
          error_code?: string | null;
          error_message_redacted?: string | null;
          id?: string;
          outbound_message_id?: string;
          provider?: string;
          provider_message_id?: string | null;
          provider_request_key?: string;
          started_at?: string;
          status?: Database["public"]["Enums"]["delivery_attempt_status"];
          technical_attempt?: number;
          trigger_run_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_delivery_attempts__message";
            columns: ["agency_id", "client_id", "outbound_message_id"];
            isOneToOne: false;
            referencedRelation: "outbound_messages";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
        ];
      };
      diagnostic_runs: {
        Row: {
          agency_id: string;
          client_id: string;
          completed_at: string | null;
          confidence: number | null;
          cost_microusd: number;
          created_at: string;
          created_by: string | null;
          diagnosis: Json;
          evidence: Json;
          id: string;
          missing_data: Json;
          model: string | null;
          period_end: string;
          period_start: string;
          prompt_version: string | null;
          skill_version: string;
          status: Database["public"]["Enums"]["diagnostic_status"];
        };
        Insert: {
          agency_id: string;
          client_id: string;
          completed_at?: string | null;
          confidence?: number | null;
          cost_microusd?: number;
          created_at?: string;
          created_by?: string | null;
          diagnosis?: Json;
          evidence?: Json;
          id?: string;
          missing_data?: Json;
          model?: string | null;
          period_end: string;
          period_start: string;
          prompt_version?: string | null;
          skill_version: string;
          status?: Database["public"]["Enums"]["diagnostic_status"];
        };
        Update: {
          agency_id?: string;
          client_id?: string;
          completed_at?: string | null;
          confidence?: number | null;
          cost_microusd?: number;
          created_at?: string;
          created_by?: string | null;
          diagnosis?: Json;
          evidence?: Json;
          id?: string;
          missing_data?: Json;
          model?: string | null;
          period_end?: string;
          period_start?: string;
          prompt_version?: string | null;
          skill_version?: string;
          status?: Database["public"]["Enums"]["diagnostic_status"];
        };
        Relationships: [
          {
            foreignKeyName: "fk_diagnostic_runs__creator";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_diagnostic_runs__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
        ];
      };
      inbound_messages: {
        Row: {
          agency_id: string;
          body_text: string;
          campaign_id: string | null;
          campaign_prospect_id: string | null;
          category: Database["public"]["Enums"]["reply_category"] | null;
          classification_confidence: number | null;
          classification_explanation: string | null;
          classification_model: string | null;
          classification_prompt_version: string | null;
          client_id: string;
          contact_id: string | null;
          created_at: string;
          id: string;
          outbound_message_id: string | null;
          provider_message_id: string;
          provider_thread_id: string | null;
          received_at: string;
          recipient_address: string;
          review_status: Database["public"]["Enums"]["reply_review_status"];
          reviewed_at: string | null;
          reviewed_by: string | null;
          sender_address: string;
          subject: string | null;
          updated_at: string;
          webhook_event_id: string;
        };
        Insert: {
          agency_id: string;
          body_text: string;
          campaign_id?: string | null;
          campaign_prospect_id?: string | null;
          category?: Database["public"]["Enums"]["reply_category"] | null;
          classification_confidence?: number | null;
          classification_explanation?: string | null;
          classification_model?: string | null;
          classification_prompt_version?: string | null;
          client_id: string;
          contact_id?: string | null;
          created_at?: string;
          id?: string;
          outbound_message_id?: string | null;
          provider_message_id: string;
          provider_thread_id?: string | null;
          received_at: string;
          recipient_address: string;
          review_status?: Database["public"]["Enums"]["reply_review_status"];
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          sender_address: string;
          subject?: string | null;
          updated_at?: string;
          webhook_event_id: string;
        };
        Update: {
          agency_id?: string;
          body_text?: string;
          campaign_id?: string | null;
          campaign_prospect_id?: string | null;
          category?: Database["public"]["Enums"]["reply_category"] | null;
          classification_confidence?: number | null;
          classification_explanation?: string | null;
          classification_model?: string | null;
          classification_prompt_version?: string | null;
          client_id?: string;
          contact_id?: string | null;
          created_at?: string;
          id?: string;
          outbound_message_id?: string | null;
          provider_message_id?: string;
          provider_thread_id?: string | null;
          received_at?: string;
          recipient_address?: string;
          review_status?: Database["public"]["Enums"]["reply_review_status"];
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          sender_address?: string;
          subject?: string | null;
          updated_at?: string;
          webhook_event_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_inbound_messages__campaign";
            columns: ["agency_id", "client_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_inbound_messages__contact";
            columns: ["agency_id", "client_id", "contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_inbound_messages__outbound";
            columns: ["agency_id", "client_id", "outbound_message_id"];
            isOneToOne: false;
            referencedRelation: "outbound_messages";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_inbound_messages__prospect";
            columns: ["agency_id", "client_id", "campaign_prospect_id"];
            isOneToOne: false;
            referencedRelation: "campaign_prospects";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_inbound_messages__reviewer";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_inbound_messages__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
          {
            foreignKeyName: "fk_inbound_messages__webhook";
            columns: ["webhook_event_id"];
            isOneToOne: false;
            referencedRelation: "inbound_webhook_events";
            referencedColumns: ["id"];
          },
        ];
      };
      inbound_webhook_events: {
        Row: {
          agency_id: string | null;
          client_id: string | null;
          created_at: string;
          error_code: string | null;
          id: string;
          occurred_at: string;
          payload_sha256: string;
          processed_at: string | null;
          provider: string;
          provider_event_id: string;
          received_at: string;
          signature_version: string;
          status: Database["public"]["Enums"]["inbound_webhook_status"];
          updated_at: string;
        };
        Insert: {
          agency_id?: string | null;
          client_id?: string | null;
          created_at?: string;
          error_code?: string | null;
          id?: string;
          occurred_at: string;
          payload_sha256: string;
          processed_at?: string | null;
          provider: string;
          provider_event_id: string;
          received_at?: string;
          signature_version: string;
          status?: Database["public"]["Enums"]["inbound_webhook_status"];
          updated_at?: string;
        };
        Update: {
          agency_id?: string | null;
          client_id?: string | null;
          created_at?: string;
          error_code?: string | null;
          id?: string;
          occurred_at?: string;
          payload_sha256?: string;
          processed_at?: string | null;
          provider?: string;
          provider_event_id?: string;
          received_at?: string;
          signature_version?: string;
          status?: Database["public"]["Enums"]["inbound_webhook_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_inbound_webhook_events__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
        ];
      };
      inbox_tasks: {
        Row: {
          agency_id: string;
          assigned_to: string | null;
          client_id: string;
          completed_at: string | null;
          created_at: string;
          due_at: string | null;
          id: string;
          inbound_message_id: string;
          status: string;
          task_type: string;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          assigned_to?: string | null;
          client_id: string;
          completed_at?: string | null;
          created_at?: string;
          due_at?: string | null;
          id?: string;
          inbound_message_id: string;
          status?: string;
          task_type: string;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          assigned_to?: string | null;
          client_id?: string;
          completed_at?: string | null;
          created_at?: string;
          due_at?: string | null;
          id?: string;
          inbound_message_id?: string;
          status?: string;
          task_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_inbox_tasks__assignee";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_inbox_tasks__message";
            columns: ["agency_id", "client_id", "inbound_message_id"];
            isOneToOne: false;
            referencedRelation: "inbound_messages";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
        ];
      };
      lead_scores: {
        Row: {
          agency_id: string;
          applied_weights: Json;
          calculated_at: string;
          calculated_by: string | null;
          client_id: string;
          company_id: string | null;
          confidence_score: number;
          contact_id: string;
          created_at: string;
          data_quality_score: number;
          engagement_score: number;
          explanation: Json;
          fit_score: number;
          id: string;
          input_fingerprint: string;
          input_snapshot: Json;
          intent_score: number;
          missing_criteria: Json;
          model_version_id: string;
          next_action: string;
          satisfied_criteria: Json;
          total_score: number;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          applied_weights?: Json;
          calculated_at?: string;
          calculated_by?: string | null;
          client_id: string;
          company_id?: string | null;
          confidence_score: number;
          contact_id: string;
          created_at?: string;
          data_quality_score: number;
          engagement_score: number;
          explanation: Json;
          fit_score: number;
          id?: string;
          input_fingerprint: string;
          input_snapshot: Json;
          intent_score: number;
          missing_criteria?: Json;
          model_version_id: string;
          next_action: string;
          satisfied_criteria?: Json;
          total_score: number;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          applied_weights?: Json;
          calculated_at?: string;
          calculated_by?: string | null;
          client_id?: string;
          company_id?: string | null;
          confidence_score?: number;
          contact_id?: string;
          created_at?: string;
          data_quality_score?: number;
          engagement_score?: number;
          explanation?: Json;
          fit_score?: number;
          id?: string;
          input_fingerprint?: string;
          input_snapshot?: Json;
          intent_score?: number;
          missing_criteria?: Json;
          model_version_id?: string;
          next_action?: string;
          satisfied_criteria?: Json;
          total_score?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_lead_scores__calculated_by";
            columns: ["calculated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_lead_scores__company";
            columns: ["agency_id", "client_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_lead_scores__contact";
            columns: ["agency_id", "client_id", "contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_lead_scores__model_version";
            columns: ["agency_id", "client_id", "model_version_id"];
            isOneToOne: false;
            referencedRelation: "scoring_model_versions";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
        ];
      };
      meeting_preparations: {
        Row: {
          agency_id: string;
          client_id: string;
          confidence: number;
          created_at: string;
          created_by: string | null;
          desired_next_step: string;
          evidence: Json;
          id: string;
          implication_questions: Json;
          known_information: Json;
          likely_objections: Json;
          meeting_id: string;
          meeting_objective: string;
          missing_information: Json;
          model: string | null;
          need_payoff_questions: Json;
          problem_questions: Json;
          prospect_summary: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          situation_questions: Json;
          skill_version: string;
          status: Database["public"]["Enums"]["reply_review_status"];
          version_number: number;
        };
        Insert: {
          agency_id: string;
          client_id: string;
          confidence: number;
          created_at?: string;
          created_by?: string | null;
          desired_next_step: string;
          evidence?: Json;
          id?: string;
          implication_questions?: Json;
          known_information?: Json;
          likely_objections?: Json;
          meeting_id: string;
          meeting_objective: string;
          missing_information?: Json;
          model?: string | null;
          need_payoff_questions?: Json;
          problem_questions?: Json;
          prospect_summary: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          situation_questions?: Json;
          skill_version: string;
          status?: Database["public"]["Enums"]["reply_review_status"];
          version_number: number;
        };
        Update: {
          agency_id?: string;
          client_id?: string;
          confidence?: number;
          created_at?: string;
          created_by?: string | null;
          desired_next_step?: string;
          evidence?: Json;
          id?: string;
          implication_questions?: Json;
          known_information?: Json;
          likely_objections?: Json;
          meeting_id?: string;
          meeting_objective?: string;
          missing_information?: Json;
          model?: string | null;
          need_payoff_questions?: Json;
          problem_questions?: Json;
          prospect_summary?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          situation_questions?: Json;
          skill_version?: string;
          status?: Database["public"]["Enums"]["reply_review_status"];
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_meeting_preparations__creator";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_meeting_preparations__meeting";
            columns: ["agency_id", "client_id", "meeting_id"];
            isOneToOne: false;
            referencedRelation: "meetings";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_meeting_preparations__reviewer";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      meetings: {
        Row: {
          agency_id: string;
          calendar_connection_id: string | null;
          campaign_id: string | null;
          campaign_prospect_id: string | null;
          cancellation_reason: string | null;
          client_id: string;
          contact_id: string;
          created_at: string;
          created_by: string;
          ends_at: string;
          external_event_id: string | null;
          id: string;
          inbound_message_id: string | null;
          owner_id: string | null;
          reminder_minutes: number[];
          starts_at: string;
          status: Database["public"]["Enums"]["meeting_status"];
          timezone: string;
          title: string;
          updated_at: string;
          video_url: string | null;
        };
        Insert: {
          agency_id: string;
          calendar_connection_id?: string | null;
          campaign_id?: string | null;
          campaign_prospect_id?: string | null;
          cancellation_reason?: string | null;
          client_id: string;
          contact_id: string;
          created_at?: string;
          created_by: string;
          ends_at: string;
          external_event_id?: string | null;
          id?: string;
          inbound_message_id?: string | null;
          owner_id?: string | null;
          reminder_minutes?: number[];
          starts_at: string;
          status?: Database["public"]["Enums"]["meeting_status"];
          timezone: string;
          title: string;
          updated_at?: string;
          video_url?: string | null;
        };
        Update: {
          agency_id?: string;
          calendar_connection_id?: string | null;
          campaign_id?: string | null;
          campaign_prospect_id?: string | null;
          cancellation_reason?: string | null;
          client_id?: string;
          contact_id?: string;
          created_at?: string;
          created_by?: string;
          ends_at?: string;
          external_event_id?: string | null;
          id?: string;
          inbound_message_id?: string | null;
          owner_id?: string | null;
          reminder_minutes?: number[];
          starts_at?: string;
          status?: Database["public"]["Enums"]["meeting_status"];
          timezone?: string;
          title?: string;
          updated_at?: string;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_meetings__calendar";
            columns: ["agency_id", "client_id", "calendar_connection_id"];
            isOneToOne: false;
            referencedRelation: "calendar_connections";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_meetings__campaign";
            columns: ["agency_id", "client_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_meetings__contact";
            columns: ["agency_id", "client_id", "contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_meetings__creator";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_meetings__inbound";
            columns: ["agency_id", "client_id", "inbound_message_id"];
            isOneToOne: false;
            referencedRelation: "inbound_messages";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_meetings__owner";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_meetings__prospect";
            columns: ["agency_id", "client_id", "campaign_prospect_id"];
            isOneToOne: false;
            referencedRelation: "campaign_prospects";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_meetings__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
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
      opportunities: {
        Row: {
          agency_id: string;
          archived_at: string | null;
          campaign_id: string | null;
          client_id: string;
          company_id: string | null;
          contact_id: string | null;
          created_at: string;
          created_by: string;
          currency: string;
          id: string;
          lost_at: string | null;
          lost_reason: string | null;
          meeting_id: string | null;
          next_action: string | null;
          next_action_due_at: string | null;
          owner_id: string | null;
          probability: number;
          stage_id: string;
          status: Database["public"]["Enums"]["opportunity_status"];
          title: string;
          updated_at: string;
          value_amount: number | null;
          won_at: string | null;
        };
        Insert: {
          agency_id: string;
          archived_at?: string | null;
          campaign_id?: string | null;
          client_id: string;
          company_id?: string | null;
          contact_id?: string | null;
          created_at?: string;
          created_by: string;
          currency?: string;
          id?: string;
          lost_at?: string | null;
          lost_reason?: string | null;
          meeting_id?: string | null;
          next_action?: string | null;
          next_action_due_at?: string | null;
          owner_id?: string | null;
          probability: number;
          stage_id: string;
          status?: Database["public"]["Enums"]["opportunity_status"];
          title: string;
          updated_at?: string;
          value_amount?: number | null;
          won_at?: string | null;
        };
        Update: {
          agency_id?: string;
          archived_at?: string | null;
          campaign_id?: string | null;
          client_id?: string;
          company_id?: string | null;
          contact_id?: string | null;
          created_at?: string;
          created_by?: string;
          currency?: string;
          id?: string;
          lost_at?: string | null;
          lost_reason?: string | null;
          meeting_id?: string | null;
          next_action?: string | null;
          next_action_due_at?: string | null;
          owner_id?: string | null;
          probability?: number;
          stage_id?: string;
          status?: Database["public"]["Enums"]["opportunity_status"];
          title?: string;
          updated_at?: string;
          value_amount?: number | null;
          won_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_opportunities__campaign";
            columns: ["agency_id", "client_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_opportunities__company";
            columns: ["agency_id", "client_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_opportunities__contact";
            columns: ["agency_id", "client_id", "contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_opportunities__creator";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_opportunities__meeting";
            columns: ["agency_id", "client_id", "meeting_id"];
            isOneToOne: false;
            referencedRelation: "meetings";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_opportunities__owner";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_opportunities__stage";
            columns: ["agency_id", "client_id", "stage_id"];
            isOneToOne: false;
            referencedRelation: "pipeline_stages";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_opportunities__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
        ];
      };
      opportunity_history: {
        Row: {
          agency_id: string;
          change_reason: string | null;
          changed_at: string;
          changed_by: string | null;
          client_id: string;
          from_stage_id: string | null;
          from_status: Database["public"]["Enums"]["opportunity_status"] | null;
          id: string;
          opportunity_id: string;
          to_stage_id: string;
          to_status: Database["public"]["Enums"]["opportunity_status"];
        };
        Insert: {
          agency_id: string;
          change_reason?: string | null;
          changed_at?: string;
          changed_by?: string | null;
          client_id: string;
          from_stage_id?: string | null;
          from_status?:
            Database["public"]["Enums"]["opportunity_status"] | null;
          id?: string;
          opportunity_id: string;
          to_stage_id: string;
          to_status: Database["public"]["Enums"]["opportunity_status"];
        };
        Update: {
          agency_id?: string;
          change_reason?: string | null;
          changed_at?: string;
          changed_by?: string | null;
          client_id?: string;
          from_stage_id?: string | null;
          from_status?:
            Database["public"]["Enums"]["opportunity_status"] | null;
          id?: string;
          opportunity_id?: string;
          to_stage_id?: string;
          to_status?: Database["public"]["Enums"]["opportunity_status"];
        };
        Relationships: [
          {
            foreignKeyName: "fk_opportunity_history__actor";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_opportunity_history__from_stage";
            columns: ["agency_id", "client_id", "from_stage_id"];
            isOneToOne: false;
            referencedRelation: "pipeline_stages";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_opportunity_history__opportunity";
            columns: ["agency_id", "client_id", "opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_opportunity_history__to_stage";
            columns: ["agency_id", "client_id", "to_stage_id"];
            isOneToOne: false;
            referencedRelation: "pipeline_stages";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
        ];
      };
      opportunity_notes: {
        Row: {
          agency_id: string;
          body: string;
          client_id: string;
          created_at: string;
          created_by: string;
          id: string;
          opportunity_id: string;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          body: string;
          client_id: string;
          created_at?: string;
          created_by: string;
          id?: string;
          opportunity_id: string;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          body?: string;
          client_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          opportunity_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_opportunity_notes__creator";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_opportunity_notes__opportunity";
            columns: ["agency_id", "client_id", "opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
        ];
      };
      outbound_messages: {
        Row: {
          agency_id: string;
          business_idempotency_key: string;
          campaign_id: string;
          campaign_prospect_id: string;
          claimed_at: string | null;
          client_id: string;
          commercial_attempt: number;
          created_at: string;
          created_by: string;
          delivered_at: string | null;
          id: string;
          last_error_code: string | null;
          message_version_id: string;
          provider_message_id: string | null;
          scheduled_for: string;
          sending_account_id: string;
          sent_at: string | null;
          sequence_step_id: string;
          status: Database["public"]["Enums"]["outbound_message_status"];
          stop_reason:
            Database["public"]["Enums"]["campaign_stop_reason"] | null;
          stopped_at: string | null;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          business_idempotency_key: string;
          campaign_id: string;
          campaign_prospect_id: string;
          claimed_at?: string | null;
          client_id: string;
          commercial_attempt?: number;
          created_at?: string;
          created_by: string;
          delivered_at?: string | null;
          id?: string;
          last_error_code?: string | null;
          message_version_id: string;
          provider_message_id?: string | null;
          scheduled_for: string;
          sending_account_id: string;
          sent_at?: string | null;
          sequence_step_id: string;
          status?: Database["public"]["Enums"]["outbound_message_status"];
          stop_reason?:
            Database["public"]["Enums"]["campaign_stop_reason"] | null;
          stopped_at?: string | null;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          business_idempotency_key?: string;
          campaign_id?: string;
          campaign_prospect_id?: string;
          claimed_at?: string | null;
          client_id?: string;
          commercial_attempt?: number;
          created_at?: string;
          created_by?: string;
          delivered_at?: string | null;
          id?: string;
          last_error_code?: string | null;
          message_version_id?: string;
          provider_message_id?: string | null;
          scheduled_for?: string;
          sending_account_id?: string;
          sent_at?: string | null;
          sequence_step_id?: string;
          status?: Database["public"]["Enums"]["outbound_message_status"];
          stop_reason?:
            Database["public"]["Enums"]["campaign_stop_reason"] | null;
          stopped_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_outbound_messages__account";
            columns: ["agency_id", "client_id", "sending_account_id"];
            isOneToOne: false;
            referencedRelation: "sending_accounts";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_outbound_messages__campaign";
            columns: ["agency_id", "client_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_outbound_messages__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_outbound_messages__prospect";
            columns: ["agency_id", "client_id", "campaign_prospect_id"];
            isOneToOne: false;
            referencedRelation: "campaign_prospects";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_outbound_messages__step";
            columns: ["agency_id", "client_id", "sequence_step_id"];
            isOneToOne: false;
            referencedRelation: "campaign_sequence_steps";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_outbound_messages__version";
            columns: ["agency_id", "client_id", "message_version_id"];
            isOneToOne: false;
            referencedRelation: "campaign_message_versions";
            referencedColumns: ["agency_id", "client_id", "id"];
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
      pipeline_stages: {
        Row: {
          active: boolean;
          agency_id: string;
          client_id: string;
          closed_status:
            Database["public"]["Enums"]["opportunity_status"] | null;
          code: string;
          created_at: string;
          created_by: string;
          default_probability: number;
          id: string;
          is_closed: boolean;
          name: string;
          position: number;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          agency_id: string;
          client_id: string;
          closed_status?:
            Database["public"]["Enums"]["opportunity_status"] | null;
          code: string;
          created_at?: string;
          created_by: string;
          default_probability: number;
          id?: string;
          is_closed?: boolean;
          name: string;
          position: number;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          agency_id?: string;
          client_id?: string;
          closed_status?:
            Database["public"]["Enums"]["opportunity_status"] | null;
          code?: string;
          created_at?: string;
          created_by?: string;
          default_probability?: number;
          id?: string;
          is_closed?: boolean;
          name?: string;
          position?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_pipeline_stages__creator";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_pipeline_stages__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
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
      provider_operations: {
        Row: {
          agency_id: string;
          client_id: string;
          company_id: string | null;
          completed_at: string | null;
          confidence_score: number | null;
          contact_id: string | null;
          cost_amount: number;
          cost_currency: string;
          created_at: string;
          created_by: string | null;
          error_code: string | null;
          error_message_redacted: string | null;
          id: string;
          idempotency_key: string;
          input_fingerprint: string;
          is_retryable: boolean;
          normalized_result: Json | null;
          operation_kind: Database["public"]["Enums"]["provider_operation_kind"];
          provider: string;
          requested_domain: string | null;
          sanitized_raw_result: Json | null;
          source: string | null;
          source_url: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["provider_operation_status"];
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          client_id: string;
          company_id?: string | null;
          completed_at?: string | null;
          confidence_score?: number | null;
          contact_id?: string | null;
          cost_amount?: number;
          cost_currency?: string;
          created_at?: string;
          created_by?: string | null;
          error_code?: string | null;
          error_message_redacted?: string | null;
          id?: string;
          idempotency_key: string;
          input_fingerprint: string;
          is_retryable?: boolean;
          normalized_result?: Json | null;
          operation_kind: Database["public"]["Enums"]["provider_operation_kind"];
          provider: string;
          requested_domain?: string | null;
          sanitized_raw_result?: Json | null;
          source?: string | null;
          source_url?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["provider_operation_status"];
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          client_id?: string;
          company_id?: string | null;
          completed_at?: string | null;
          confidence_score?: number | null;
          contact_id?: string | null;
          cost_amount?: number;
          cost_currency?: string;
          created_at?: string;
          created_by?: string | null;
          error_code?: string | null;
          error_message_redacted?: string | null;
          id?: string;
          idempotency_key?: string;
          input_fingerprint?: string;
          is_retryable?: boolean;
          normalized_result?: Json | null;
          operation_kind?: Database["public"]["Enums"]["provider_operation_kind"];
          provider?: string;
          requested_domain?: string | null;
          sanitized_raw_result?: Json | null;
          source?: string | null;
          source_url?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["provider_operation_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_provider_operations__company";
            columns: ["agency_id", "client_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_provider_operations__contact";
            columns: ["agency_id", "client_id", "contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_provider_operations__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_provider_operations__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
        ];
      };
      reply_drafts: {
        Row: {
          agency_id: string;
          body: string;
          client_id: string;
          created_at: string;
          created_by: string | null;
          grounded_facts: Json;
          id: string;
          inbound_message_id: string;
          missing_information: Json;
          model: string | null;
          prompt_version: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database["public"]["Enums"]["reply_review_status"];
          subject: string | null;
          version_number: number;
        };
        Insert: {
          agency_id: string;
          body: string;
          client_id: string;
          created_at?: string;
          created_by?: string | null;
          grounded_facts?: Json;
          id?: string;
          inbound_message_id: string;
          missing_information?: Json;
          model?: string | null;
          prompt_version?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["reply_review_status"];
          subject?: string | null;
          version_number: number;
        };
        Update: {
          agency_id?: string;
          body?: string;
          client_id?: string;
          created_at?: string;
          created_by?: string | null;
          grounded_facts?: Json;
          id?: string;
          inbound_message_id?: string;
          missing_information?: Json;
          model?: string | null;
          prompt_version?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["reply_review_status"];
          subject?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_reply_drafts__creator";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_reply_drafts__message";
            columns: ["agency_id", "client_id", "inbound_message_id"];
            isOneToOne: false;
            referencedRelation: "inbound_messages";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_reply_drafts__reviewer";
            columns: ["reviewed_by"];
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
      sales_tasks: {
        Row: {
          agency_id: string;
          assigned_to: string | null;
          client_id: string;
          completed_at: string | null;
          contact_id: string | null;
          created_at: string;
          created_by: string;
          due_at: string | null;
          id: string;
          opportunity_id: string | null;
          status: Database["public"]["Enums"]["sales_task_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          assigned_to?: string | null;
          client_id: string;
          completed_at?: string | null;
          contact_id?: string | null;
          created_at?: string;
          created_by: string;
          due_at?: string | null;
          id?: string;
          opportunity_id?: string | null;
          status?: Database["public"]["Enums"]["sales_task_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          assigned_to?: string | null;
          client_id?: string;
          completed_at?: string | null;
          contact_id?: string | null;
          created_at?: string;
          created_by?: string;
          due_at?: string | null;
          id?: string;
          opportunity_id?: string | null;
          status?: Database["public"]["Enums"]["sales_task_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_sales_tasks__assignee";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_sales_tasks__contact";
            columns: ["agency_id", "client_id", "contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_sales_tasks__creator";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_sales_tasks__opportunity";
            columns: ["agency_id", "client_id", "opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_sales_tasks__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
        ];
      };
      scoring_model_versions: {
        Row: {
          activated_at: string | null;
          activated_by: string | null;
          agency_id: string;
          client_id: string;
          configuration: Json;
          configuration_hash: string;
          created_at: string;
          created_by: string;
          id: string;
          model_id: string;
          updated_at: string;
          version_number: number;
        };
        Insert: {
          activated_at?: string | null;
          activated_by?: string | null;
          agency_id: string;
          client_id: string;
          configuration: Json;
          configuration_hash: string;
          created_at?: string;
          created_by: string;
          id?: string;
          model_id: string;
          updated_at?: string;
          version_number: number;
        };
        Update: {
          activated_at?: string | null;
          activated_by?: string | null;
          agency_id?: string;
          client_id?: string;
          configuration?: Json;
          configuration_hash?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          model_id?: string;
          updated_at?: string;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_scoring_model_versions__activated_by";
            columns: ["activated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_scoring_model_versions__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_scoring_model_versions__model";
            columns: ["agency_id", "client_id", "model_id"];
            isOneToOne: false;
            referencedRelation: "scoring_models";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
        ];
      };
      scoring_models: {
        Row: {
          active_version_id: string | null;
          agency_id: string;
          archived_at: string | null;
          archived_by: string | null;
          client_id: string;
          created_at: string;
          created_by: string;
          id: string;
          name: string;
          status: Database["public"]["Enums"]["scoring_model_status"];
          updated_at: string;
        };
        Insert: {
          active_version_id?: string | null;
          agency_id: string;
          archived_at?: string | null;
          archived_by?: string | null;
          client_id: string;
          created_at?: string;
          created_by: string;
          id?: string;
          name: string;
          status?: Database["public"]["Enums"]["scoring_model_status"];
          updated_at?: string;
        };
        Update: {
          active_version_id?: string | null;
          agency_id?: string;
          archived_at?: string | null;
          archived_by?: string | null;
          client_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          name?: string;
          status?: Database["public"]["Enums"]["scoring_model_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_scoring_models__active_version";
            columns: ["agency_id", "client_id", "active_version_id"];
            isOneToOne: false;
            referencedRelation: "scoring_model_versions";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_scoring_models__archived_by";
            columns: ["archived_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_scoring_models__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_scoring_models__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
        ];
      };
      segment_memberships: {
        Row: {
          agency_id: string;
          client_id: string;
          contact_id: string;
          created_at: string;
          evaluated_at: string;
          expires_at: string | null;
          id: string;
          lead_score_id: string | null;
          matched_criteria: Json;
          segment_id: string;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          client_id: string;
          contact_id: string;
          created_at?: string;
          evaluated_at?: string;
          expires_at?: string | null;
          id?: string;
          lead_score_id?: string | null;
          matched_criteria?: Json;
          segment_id: string;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          client_id?: string;
          contact_id?: string;
          created_at?: string;
          evaluated_at?: string;
          expires_at?: string | null;
          id?: string;
          lead_score_id?: string | null;
          matched_criteria?: Json;
          segment_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_segment_memberships__contact";
            columns: ["agency_id", "client_id", "contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_segment_memberships__score";
            columns: ["agency_id", "client_id", "lead_score_id"];
            isOneToOne: false;
            referencedRelation: "lead_scores";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_segment_memberships__segment";
            columns: ["agency_id", "client_id", "segment_id"];
            isOneToOne: false;
            referencedRelation: "segments";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
        ];
      };
      segments: {
        Row: {
          agency_id: string;
          archived_at: string | null;
          archived_by: string | null;
          client_id: string;
          created_at: string;
          created_by: string;
          description: string | null;
          filter_definition: Json;
          filter_version: number;
          id: string;
          is_dynamic: boolean;
          name: string;
          status: Database["public"]["Enums"]["segment_status"];
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          agency_id: string;
          archived_at?: string | null;
          archived_by?: string | null;
          client_id: string;
          created_at?: string;
          created_by: string;
          description?: string | null;
          filter_definition: Json;
          filter_version?: number;
          id?: string;
          is_dynamic?: boolean;
          name: string;
          status?: Database["public"]["Enums"]["segment_status"];
          updated_at?: string;
          updated_by: string;
        };
        Update: {
          agency_id?: string;
          archived_at?: string | null;
          archived_by?: string | null;
          client_id?: string;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          filter_definition?: Json;
          filter_version?: number;
          id?: string;
          is_dynamic?: boolean;
          name?: string;
          status?: Database["public"]["Enums"]["segment_status"];
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_segments__archived_by";
            columns: ["archived_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_segments__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_segments__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
          {
            foreignKeyName: "fk_segments__updated_by";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      sending_accounts: {
        Row: {
          agency_id: string;
          allowed_end: string;
          allowed_start: string;
          allowed_weekdays: number[];
          archived_at: string | null;
          bounce_rate: number;
          client_id: string;
          complaint_rate: number;
          created_at: string;
          created_by: string;
          credential_reference: string | null;
          daily_limit: number;
          email_address: string;
          id: string;
          last_connection_error_code: string | null;
          last_connection_test_at: string | null;
          paused_reason: string | null;
          provider: string;
          sending_domain_id: string;
          sent_today: number;
          status: Database["public"]["Enums"]["sending_account_status"];
          timezone: string;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          allowed_end?: string;
          allowed_start?: string;
          allowed_weekdays?: number[];
          archived_at?: string | null;
          bounce_rate?: number;
          client_id: string;
          complaint_rate?: number;
          created_at?: string;
          created_by?: string;
          credential_reference?: string | null;
          daily_limit?: number;
          email_address: string;
          id?: string;
          last_connection_error_code?: string | null;
          last_connection_test_at?: string | null;
          paused_reason?: string | null;
          provider: string;
          sending_domain_id: string;
          sent_today?: number;
          status?: Database["public"]["Enums"]["sending_account_status"];
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          allowed_end?: string;
          allowed_start?: string;
          allowed_weekdays?: number[];
          archived_at?: string | null;
          bounce_rate?: number;
          client_id?: string;
          complaint_rate?: number;
          created_at?: string;
          created_by?: string;
          credential_reference?: string | null;
          daily_limit?: number;
          email_address?: string;
          id?: string;
          last_connection_error_code?: string | null;
          last_connection_test_at?: string | null;
          paused_reason?: string | null;
          provider?: string;
          sending_domain_id?: string;
          sent_today?: number;
          status?: Database["public"]["Enums"]["sending_account_status"];
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_sending_accounts__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_sending_accounts__domain";
            columns: ["agency_id", "client_id", "sending_domain_id"];
            isOneToOne: false;
            referencedRelation: "sending_domains";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_sending_accounts__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
        ];
      };
      sending_domains: {
        Row: {
          agency_id: string;
          archived_at: string | null;
          client_id: string;
          created_at: string;
          created_by: string;
          domain: string;
          id: string;
          last_checked_at: string | null;
          status: Database["public"]["Enums"]["deliverability_check_status"];
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          archived_at?: string | null;
          client_id: string;
          created_at?: string;
          created_by?: string;
          domain: string;
          id?: string;
          last_checked_at?: string | null;
          status?: Database["public"]["Enums"]["deliverability_check_status"];
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          archived_at?: string | null;
          client_id?: string;
          created_at?: string;
          created_by?: string;
          domain?: string;
          id?: string;
          last_checked_at?: string | null;
          status?: Database["public"]["Enums"]["deliverability_check_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_sending_domains__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_sending_domains__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
        ];
      };
      sequence_stop_events: {
        Row: {
          agency_id: string;
          campaign_id: string;
          campaign_prospect_id: string;
          client_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          reason: Database["public"]["Enums"]["campaign_stop_reason"];
          source_resource_id: string | null;
          source_resource_type: string;
        };
        Insert: {
          agency_id: string;
          campaign_id: string;
          campaign_prospect_id: string;
          client_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          reason: Database["public"]["Enums"]["campaign_stop_reason"];
          source_resource_id?: string | null;
          source_resource_type: string;
        };
        Update: {
          agency_id?: string;
          campaign_id?: string;
          campaign_prospect_id?: string;
          client_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          reason?: Database["public"]["Enums"]["campaign_stop_reason"];
          source_resource_id?: string | null;
          source_resource_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_sequence_stop_events__campaign";
            columns: ["agency_id", "client_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["agency_id", "client_id", "id"];
          },
          {
            foreignKeyName: "fk_sequence_stop_events__created_by";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_sequence_stop_events__prospect";
            columns: ["agency_id", "client_id", "campaign_prospect_id"];
            isOneToOne: false;
            referencedRelation: "campaign_prospects";
            referencedColumns: ["agency_id", "client_id", "id"];
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
      suppression_entries: {
        Row: {
          agency_id: string;
          client_id: string | null;
          created_at: string;
          created_by: string | null;
          effective_at: string;
          id: string;
          masked_email: string;
          normalized_email_hash: string;
          reason: Database["public"]["Enums"]["suppression_reason"];
          scope: Database["public"]["Enums"]["suppression_scope"];
          source_resource_id: string | null;
          source_resource_type: string;
        };
        Insert: {
          agency_id: string;
          client_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          effective_at?: string;
          id?: string;
          masked_email: string;
          normalized_email_hash: string;
          reason: Database["public"]["Enums"]["suppression_reason"];
          scope: Database["public"]["Enums"]["suppression_scope"];
          source_resource_id?: string | null;
          source_resource_type: string;
        };
        Update: {
          agency_id?: string;
          client_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          effective_at?: string;
          id?: string;
          masked_email?: string;
          normalized_email_hash?: string;
          reason?: Database["public"]["Enums"]["suppression_reason"];
          scope?: Database["public"]["Enums"]["suppression_scope"];
          source_resource_id?: string | null;
          source_resource_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_suppression_entries__agency";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_suppression_entries__creator";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_suppression_entries__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
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
      technical_cost_entries: {
        Row: {
          agency_id: string;
          amount_microusd: number;
          category: Database["public"]["Enums"]["cost_category"];
          client_id: string;
          created_at: string;
          external_operation_id: string | null;
          id: string;
          metadata: Json;
          occurred_at: string;
          provider: string;
          resource_id: string | null;
          resource_type: string;
        };
        Insert: {
          agency_id: string;
          amount_microusd: number;
          category: Database["public"]["Enums"]["cost_category"];
          client_id: string;
          created_at?: string;
          external_operation_id?: string | null;
          id?: string;
          metadata?: Json;
          occurred_at: string;
          provider: string;
          resource_id?: string | null;
          resource_type: string;
        };
        Update: {
          agency_id?: string;
          amount_microusd?: number;
          category?: Database["public"]["Enums"]["cost_category"];
          client_id?: string;
          created_at?: string;
          external_operation_id?: string | null;
          id?: string;
          metadata?: Json;
          occurred_at?: string;
          provider?: string;
          resource_id?: string | null;
          resource_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_technical_cost_entries__tenant";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
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
      accept_pending_recruiter_invitations: { Args: never; Returns: string[] };
      add_suppression_entry: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_email: string;
          requested_reason: Database["public"]["Enums"]["suppression_reason"];
          requested_scope: Database["public"]["Enums"]["suppression_scope"];
          requested_source_resource_id?: string;
          requested_source_resource_type: string;
        };
        Returns: string;
      };
      archive_client: {
        Args: { requested_agency_id: string; requested_client_id: string };
        Returns: string;
      };
      archive_company: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_company_id: string;
        };
        Returns: string;
      };
      archive_contact: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_contact_id: string;
        };
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
      campaign_deliverability_preflight: {
        Args: {
          requested_agency_id: string;
          requested_campaign_id: string;
          requested_client_id: string;
        };
        Returns: Json;
      };
      claim_async_task_run: {
        Args: {
          requested_actor_id: string;
          requested_agency_id: string;
          requested_client_id: string;
          requested_idempotency_key: string;
          requested_resource_id: string;
          requested_resource_type: string;
          requested_task_id: string;
          requested_trigger_run_id: string;
        };
        Returns: Json;
      };
      claim_outbound_delivery: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_outbound_message_id: string;
          requested_provider: string;
          requested_trigger_run_id: string;
        };
        Returns: Json;
      };
      complete_async_task_run: {
        Args: {
          requested_cost_microusd?: number;
          requested_result: Json;
          requested_task_run_id: string;
        };
        Returns: string;
      };
      complete_client_onboarding: {
        Args: { requested_agency_id: string; requested_client_id: string };
        Returns: string;
      };
      complete_outbound_delivery: {
        Args: {
          requested_cost_microusd?: number;
          requested_delivery_attempt_id: string;
          requested_provider_message_id: string;
        };
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
      create_campaign_draft: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_payload: Json;
        };
        Returns: string;
      };
      create_campaign_message_variant: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_payload: Json;
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
      create_company: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_payload: Json;
        };
        Returns: string;
      };
      create_contact: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_payload: Json;
        };
        Returns: string;
      };
      create_meeting: {
        Args: {
          requested_agency_id: string;
          requested_campaign_id: string;
          requested_client_id: string;
          requested_contact_id: string;
          requested_ends_at: string;
          requested_starts_at: string;
          requested_timezone: string;
          requested_title: string;
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
      create_opportunity: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_company_id: string;
          requested_contact_id: string;
          requested_currency: string;
          requested_stage_id: string;
          requested_title: string;
          requested_value_amount: number;
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
      ensure_default_pipeline: {
        Args: { requested_agency_id: string; requested_client_id: string };
        Returns: number;
      };
      fail_async_task_run: {
        Args: {
          requested_error_class: Database["public"]["Enums"]["async_task_error_class"];
          requested_error_code: string;
          requested_error_message_redacted: string;
          requested_task_run_id: string;
        };
        Returns: string;
      };
      fail_outbound_delivery: {
        Args: {
          requested_delivery_attempt_id: string;
          requested_error_code: string;
          requested_error_message_redacted: string;
          requested_retryable: boolean;
        };
        Returns: string;
      };
      get_client_funnel_analytics: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_period_end: string;
          requested_period_start: string;
        };
        Returns: Json;
      };
      invite_or_assign_recruiter: {
        Args: {
          requested_agency_id: string;
          requested_client_ids: string[];
          requested_profile_id: string;
        };
        Returns: string;
      };
      is_email_suppressed: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_email: string;
        };
        Returns: boolean;
      };
      mark_data_import_ready: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_import_id: string;
        };
        Returns: string;
      };
      move_opportunity: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_lost_reason?: string;
          requested_opportunity_id: string;
          requested_stage_id: string;
        };
        Returns: string;
      };
      prepare_data_import: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_column_mapping: Json;
          requested_delimiter: string;
          requested_entity_type: Database["public"]["Enums"]["data_import_entity_type"];
          requested_estimated_row_count: number;
          requested_file_name: string;
          requested_file_sha256: string;
          requested_file_size_bytes: number;
          requested_mime_type: string;
        };
        Returns: Json;
      };
      record_campaign_message_machine_review: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_decision: Database["public"]["Enums"]["message_review_decision"];
          requested_review: Json;
          requested_review_type: Database["public"]["Enums"]["message_review_type"];
          requested_version_id: string;
        };
        Returns: string;
      };
      request_data_import_cancellation: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_import_id: string;
        };
        Returns: string;
      };
      review_campaign_message: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_decision: Database["public"]["Enums"]["message_review_decision"];
          requested_review: Json;
          requested_review_type: Database["public"]["Enums"]["message_review_type"];
          requested_version_id: string;
        };
        Returns: string;
      };
      review_inbound_classification: {
        Args: {
          requested_agency_id: string;
          requested_category: Database["public"]["Enums"]["reply_category"];
          requested_client_id: string;
          requested_inbound_message_id: string;
          requested_status: Database["public"]["Enums"]["reply_review_status"];
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
      service_consume_api_rate_limit: {
        Args: {
          requested_limit: number;
          requested_scope: string;
          requested_subject: string;
          requested_window_seconds: number;
        };
        Returns: boolean;
      };
      set_data_import_trigger_run: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_import_id: string;
          requested_trigger_run_id: string;
        };
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
      stop_campaign_prospect_sequence: {
        Args: {
          requested_actor_id?: string;
          requested_agency_id: string;
          requested_campaign_prospect_id: string;
          requested_client_id: string;
          requested_reason: Database["public"]["Enums"]["campaign_stop_reason"];
          requested_source_resource_id?: string;
          requested_source_resource_type: string;
        };
        Returns: string;
      };
      submit_campaign_message_for_review: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_version_id: string;
        };
        Returns: string;
      };
      transition_campaign: {
        Args: {
          requested_action: string;
          requested_agency_id: string;
          requested_campaign_id: string;
          requested_client_id: string;
          requested_start_at?: string;
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
      upsert_sending_account_metadata: {
        Args: {
          requested_account_id: string;
          requested_agency_id: string;
          requested_client_id: string;
          requested_credential_reference?: string;
          requested_daily_limit: number;
          requested_domain_id: string;
          requested_email: string;
          requested_provider: string;
          requested_timezone: string;
        };
        Returns: string;
      };
      upsert_sending_domain: {
        Args: {
          requested_agency_id: string;
          requested_client_id: string;
          requested_domain: string;
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
      async_task_error_class:
        "retryable" | "permanent" | "intervention_required";
      async_task_run_status:
        | "queued"
        | "running"
        | "retrying"
        | "succeeded"
        | "failed"
        | "cancelled";
      calendar_connection_status:
        "pending" | "connected" | "degraded" | "disconnected";
      campaign_message_status:
        | "draft"
        | "quality_review_pending"
        | "compliance_review_pending"
        | "human_review_pending"
        | "approved"
        | "rejected";
      campaign_prospect_status:
        | "pending"
        | "ready"
        | "scheduled"
        | "contacted"
        | "stopped"
        | "excluded";
      campaign_status:
        | "draft"
        | "ready_for_review"
        | "approved"
        | "scheduled"
        | "running"
        | "paused"
        | "completed"
        | "cancelled";
      campaign_stop_reason:
        | "reply_received"
        | "meeting_booked"
        | "unsubscribe"
        | "hard_bounce"
        | "complaint"
        | "suppressed"
        | "campaign_paused"
        | "account_disconnected";
      contact_audience_type: "b2b" | "b2c" | "unknown";
      cost_category:
        | "enrichment"
        | "verification"
        | "ai"
        | "email_delivery"
        | "calendar"
        | "infrastructure"
        | "other_technical";
      data_fact_status:
        "confirmed" | "extracted" | "estimated" | "hypothesis" | "unverified";
      data_import_entity_type: "company" | "contact";
      data_import_row_status:
        | "pending"
        | "created"
        | "duplicate"
        | "invalid"
        | "failed"
        | "cancelled";
      data_import_status:
        | "draft"
        | "ready"
        | "queued"
        | "processing"
        | "completed"
        | "completed_with_errors"
        | "failed"
        | "cancel_requested"
        | "cancelled";
      data_subject_request_status:
        "received" | "verified" | "in_progress" | "completed" | "rejected";
      data_subject_request_type:
        | "access"
        | "export"
        | "delete_contact"
        | "delete_client"
        | "delete_agency";
      data_verification_status:
        "unverified" | "pending" | "verified" | "invalid" | "stale";
      deliverability_check_kind:
        | "spf"
        | "dkim"
        | "dmarc"
        | "domain_configured"
        | "account_connected"
        | "volume_allowed"
        | "bounce_rate_acceptable"
        | "list_verified";
      deliverability_check_status: "pending" | "passed" | "warning" | "failed";
      delivery_attempt_status:
        "started" | "accepted" | "retryable_failure" | "permanent_failure";
      diagnostic_status: "pending" | "completed" | "needs_data" | "failed";
      email_verification_result:
        | "valid"
        | "risky"
        | "catch_all"
        | "unknown"
        | "invalid"
        | "disposable"
        | "role_based"
        | "bounced"
        | "suppressed"
        | "unsubscribed";
      entity_source_type:
        "manual" | "csv" | "api" | "website" | "directory" | "other";
      inbound_webhook_status:
        "received" | "verified" | "rejected" | "processed" | "failed";
      meeting_status:
        | "proposed"
        | "confirmed"
        | "rescheduled"
        | "cancelled"
        | "completed"
        | "no_show";
      membership_status: "invited" | "active" | "suspended" | "removed";
      message_format: "cold_email" | "follow_up" | "linkedin_message";
      message_review_decision: "approve" | "revise" | "reject";
      message_review_type: "quality" | "compliance" | "human";
      message_version_origin: "ai_generated" | "human_edit" | "regenerated";
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
      opportunity_status: "open" | "won" | "lost";
      outbound_message_status:
        | "scheduled"
        | "sending"
        | "sent"
        | "delivered"
        | "stopped"
        | "failed"
        | "bounced"
        | "complained";
      outreach_channel: "email" | "linkedin" | "multichannel";
      provider_operation_kind:
        | "company_enrichment"
        | "contact_enrichment"
        | "email_verification"
        | "domain_validation";
      provider_operation_status:
        "pending" | "running" | "completed" | "failed" | "cancelled";
      reply_category:
        | "positive_interest"
        | "information_request"
        | "meeting_requested"
        | "later"
        | "wrong_contact"
        | "referral"
        | "not_interested"
        | "objection"
        | "unsubscribe"
        | "out_of_office"
        | "automatic_reply"
        | "existing_customer"
        | "competitor"
        | "spam"
        | "ambiguous";
      reply_review_status: "pending" | "confirmed" | "corrected" | "rejected";
      role_scope: "agency" | "client";
      sales_task_status: "open" | "in_progress" | "completed" | "cancelled";
      scoring_model_status: "draft" | "active" | "archived";
      segment_status: "draft" | "active" | "archived";
      sending_account_status:
        "pending" | "connected" | "degraded" | "paused" | "disconnected";
      sequence_step_type:
        "cold_email" | "follow_up_email" | "manual_linkedin" | "wait";
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
      suppression_reason:
        | "unsubscribe"
        | "deleted"
        | "suppression_list"
        | "complaint"
        | "hard_bounce"
        | "manual";
      suppression_scope: "client" | "agency";
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
      async_task_error_class: [
        "retryable",
        "permanent",
        "intervention_required",
      ],
      async_task_run_status: [
        "queued",
        "running",
        "retrying",
        "succeeded",
        "failed",
        "cancelled",
      ],
      calendar_connection_status: [
        "pending",
        "connected",
        "degraded",
        "disconnected",
      ],
      campaign_message_status: [
        "draft",
        "quality_review_pending",
        "compliance_review_pending",
        "human_review_pending",
        "approved",
        "rejected",
      ],
      campaign_prospect_status: [
        "pending",
        "ready",
        "scheduled",
        "contacted",
        "stopped",
        "excluded",
      ],
      campaign_status: [
        "draft",
        "ready_for_review",
        "approved",
        "scheduled",
        "running",
        "paused",
        "completed",
        "cancelled",
      ],
      campaign_stop_reason: [
        "reply_received",
        "meeting_booked",
        "unsubscribe",
        "hard_bounce",
        "complaint",
        "suppressed",
        "campaign_paused",
        "account_disconnected",
      ],
      contact_audience_type: ["b2b", "b2c", "unknown"],
      cost_category: [
        "enrichment",
        "verification",
        "ai",
        "email_delivery",
        "calendar",
        "infrastructure",
        "other_technical",
      ],
      data_fact_status: [
        "confirmed",
        "extracted",
        "estimated",
        "hypothesis",
        "unverified",
      ],
      data_import_entity_type: ["company", "contact"],
      data_import_row_status: [
        "pending",
        "created",
        "duplicate",
        "invalid",
        "failed",
        "cancelled",
      ],
      data_import_status: [
        "draft",
        "ready",
        "queued",
        "processing",
        "completed",
        "completed_with_errors",
        "failed",
        "cancel_requested",
        "cancelled",
      ],
      data_subject_request_status: [
        "received",
        "verified",
        "in_progress",
        "completed",
        "rejected",
      ],
      data_subject_request_type: [
        "access",
        "export",
        "delete_contact",
        "delete_client",
        "delete_agency",
      ],
      data_verification_status: [
        "unverified",
        "pending",
        "verified",
        "invalid",
        "stale",
      ],
      deliverability_check_kind: [
        "spf",
        "dkim",
        "dmarc",
        "domain_configured",
        "account_connected",
        "volume_allowed",
        "bounce_rate_acceptable",
        "list_verified",
      ],
      deliverability_check_status: ["pending", "passed", "warning", "failed"],
      delivery_attempt_status: [
        "started",
        "accepted",
        "retryable_failure",
        "permanent_failure",
      ],
      diagnostic_status: ["pending", "completed", "needs_data", "failed"],
      email_verification_result: [
        "valid",
        "risky",
        "catch_all",
        "unknown",
        "invalid",
        "disposable",
        "role_based",
        "bounced",
        "suppressed",
        "unsubscribed",
      ],
      entity_source_type: [
        "manual",
        "csv",
        "api",
        "website",
        "directory",
        "other",
      ],
      inbound_webhook_status: [
        "received",
        "verified",
        "rejected",
        "processed",
        "failed",
      ],
      meeting_status: [
        "proposed",
        "confirmed",
        "rescheduled",
        "cancelled",
        "completed",
        "no_show",
      ],
      membership_status: ["invited", "active", "suspended", "removed"],
      message_format: ["cold_email", "follow_up", "linkedin_message"],
      message_review_decision: ["approve", "revise", "reject"],
      message_review_type: ["quality", "compliance", "human"],
      message_version_origin: ["ai_generated", "human_edit", "regenerated"],
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
      opportunity_status: ["open", "won", "lost"],
      outbound_message_status: [
        "scheduled",
        "sending",
        "sent",
        "delivered",
        "stopped",
        "failed",
        "bounced",
        "complained",
      ],
      outreach_channel: ["email", "linkedin", "multichannel"],
      provider_operation_kind: [
        "company_enrichment",
        "contact_enrichment",
        "email_verification",
        "domain_validation",
      ],
      provider_operation_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "cancelled",
      ],
      reply_category: [
        "positive_interest",
        "information_request",
        "meeting_requested",
        "later",
        "wrong_contact",
        "referral",
        "not_interested",
        "objection",
        "unsubscribe",
        "out_of_office",
        "automatic_reply",
        "existing_customer",
        "competitor",
        "spam",
        "ambiguous",
      ],
      reply_review_status: ["pending", "confirmed", "corrected", "rejected"],
      role_scope: ["agency", "client"],
      sales_task_status: ["open", "in_progress", "completed", "cancelled"],
      scoring_model_status: ["draft", "active", "archived"],
      segment_status: ["draft", "active", "archived"],
      sending_account_status: [
        "pending",
        "connected",
        "degraded",
        "paused",
        "disconnected",
      ],
      sequence_step_type: [
        "cold_email",
        "follow_up_email",
        "manual_linkedin",
        "wait",
      ],
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
      suppression_reason: [
        "unsubscribe",
        "deleted",
        "suppression_list",
        "complaint",
        "hard_bounce",
        "manual",
      ],
      suppression_scope: ["client", "agency"],
      targeting_lifecycle_status: ["inactive", "active", "archived"],
      targeting_profile_type: ["icp", "persona"],
      targeting_version_origin: ["manual", "ai_proposal", "duplicate"],
      targeting_version_status: ["draft", "validated"],
      workspace_status: ["draft", "onboarding", "active", "paused", "archived"],
    },
  },
} as const;
