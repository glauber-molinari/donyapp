export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "member";
export type JobType = "foto" | "video" | "foto_video";
export type JobKind = "standard" | "video_edit";
export type Plan = "free" | "pro";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled";

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          delivery_email_subject_template: string | null;
          delivery_email_body_template: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          delivery_email_subject_template?: string | null;
          delivery_email_body_template?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          delivery_email_subject_template?: string | null;
          delivery_email_body_template?: string | null;
        };
        Relationships: [];
      };
      account_google_calendar: {
        Row: {
          account_id: string;
          refresh_token: string;
          access_token: string | null;
          access_token_expires_at: string | null;
          google_email: string | null;
          calendar_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          account_id: string;
          refresh_token: string;
          access_token?: string | null;
          access_token_expires_at?: string | null;
          google_email?: string | null;
          calendar_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          refresh_token?: string;
          access_token?: string | null;
          access_token_expires_at?: string | null;
          google_email?: string | null;
          calendar_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "account_google_calendar_account_id_fkey";
            columns: ["account_id"];
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          id: string;
          account_id: string | null;
          name: string | null;
          email: string | null;
          avatar_url: string | null;
          role: UserRole;
          tour_completed: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          account_id?: string | null;
          name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          tour_completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string | null;
          name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          tour_completed?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_account_id_fkey";
            columns: ["account_id"];
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      account_members: {
        Row: {
          id: string;
          account_id: string;
          user_id: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          user_id: string;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          user_id?: string;
          role?: UserRole;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "account_members_account_id_fkey";
            columns: ["account_id"];
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "account_members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      invitations: {
        Row: {
          id: string;
          account_id: string;
          email: string;
          token: string;
          role: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          email: string;
          token: string;
          role?: string;
          expires_at: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          email?: string;
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_account_id_fkey";
            columns: ["account_id"];
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      contacts: {
        Row: {
          id: string;
          account_id: string;
          name: string;
          email: string;
          phone: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          name: string;
          email: string;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_account_id_fkey";
            columns: ["account_id"];
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      job_work_types: {
        Row: {
          id: string;
          account_id: string;
          name: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          name: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          name?: string;
          position?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_work_types_account_id_fkey";
            columns: ["account_id"];
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      kanban_stages: {
        Row: {
          id: string;
          account_id: string;
          name: string;
          position: number;
          color: string;
          is_final: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          name: string;
          position: number;
          color: string;
          is_final?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          name?: string;
          position?: number;
          color?: string;
          is_final?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kanban_stages_account_id_fkey";
            columns: ["account_id"];
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      jobs: {
        Row: {
          id: string;
          account_id: string;
          contact_id: string | null;
          stage_id: string | null;
          position: number;
          name: string;
          type: JobType;
          internal_deadline: string;
          deadline: string;
          job_date: string | null;
          work_type_id: string;
          parent_job_id: string | null;
          job_kind: JobKind;
          notes: string | null;
          delivery_link: string | null;
          client_revision: number;
          photo_editor_id: string | null;
          video_editor_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          contact_id?: string | null;
          stage_id?: string | null;
          position?: number;
          name: string;
          type: JobType;
          internal_deadline: string;
          deadline: string;
          job_date?: string | null;
          work_type_id: string;
          parent_job_id?: string | null;
          job_kind?: JobKind;
          notes?: string | null;
          delivery_link?: string | null;
          client_revision?: number;
          photo_editor_id?: string | null;
          video_editor_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          contact_id?: string | null;
          stage_id?: string | null;
          position?: number;
          name?: string;
          type?: JobType;
          internal_deadline?: string;
          deadline?: string;
          job_date?: string | null;
          work_type_id?: string;
          parent_job_id?: string | null;
          job_kind?: JobKind;
          notes?: string | null;
          delivery_link?: string | null;
          client_revision?: number;
          photo_editor_id?: string | null;
          video_editor_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_account_id_fkey";
            columns: ["account_id"];
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobs_contact_id_fkey";
            columns: ["contact_id"];
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobs_stage_id_fkey";
            columns: ["stage_id"];
            referencedRelation: "kanban_stages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobs_work_type_id_fkey";
            columns: ["work_type_id"];
            referencedRelation: "job_work_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobs_parent_job_id_fkey";
            columns: ["parent_job_id"];
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobs_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobs_photo_editor_id_fkey";
            columns: ["photo_editor_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobs_video_editor_id_fkey";
            columns: ["video_editor_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          account_id: string;
          plan: Plan;
          status: SubscriptionStatus;
          trial_ends_at: string | null;
          current_period_ends_at: string | null;
          extra_users: number;
          asaas_subscription_id: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          plan?: Plan;
          status?: SubscriptionStatus;
          trial_ends_at?: string | null;
          current_period_ends_at?: string | null;
          extra_users?: number;
          asaas_subscription_id?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          plan?: Plan;
          status?: SubscriptionStatus;
          trial_ends_at?: string | null;
          current_period_ends_at?: string | null;
          extra_users?: number;
          asaas_subscription_id?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_account_id_fkey";
            columns: ["account_id"];
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_account_id: { Args: Record<string, never>; Returns: string | null };
      is_account_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
