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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          target_id: string
          target_table: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          target_id: string
          target_table: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string
          target_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availability: {
        Row: {
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          professional_id: string | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          professional_id?: string | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          professional_id?: string | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_exceptions: {
        Row: {
          created_at: string
          date_local: string
          end_time_local: string | null
          id: string
          is_available: boolean
          professional_id: string
          reason: string | null
          start_time_local: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_local: string
          end_time_local?: string | null
          id?: string
          is_available?: boolean
          professional_id: string
          reason?: string | null
          start_time_local?: string | null
          timezone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_local?: string
          end_time_local?: string | null
          id?: string
          is_available?: boolean
          professional_id?: string
          reason?: string | null
          start_time_local?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_exceptions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_rules: {
        Row: {
          created_at: string
          end_time_local: string
          id: string
          is_active: boolean
          professional_id: string
          start_time_local: string
          timezone: string
          updated_at: string
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time_local: string
          id?: string
          is_active?: boolean
          professional_id: string
          start_time_local: string
          timezone: string
          updated_at?: string
          weekday: number
        }
        Update: {
          created_at?: string
          end_time_local?: string
          id?: string
          is_active?: boolean
          professional_id?: string
          start_time_local?: string
          timezone?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "availability_rules_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_comments: {
        Row: {
          article_slug: string
          content: string
          created_at: string
          email: string
          id: string
          is_approved: boolean
          name: string
        }
        Insert: {
          article_slug: string
          content: string
          created_at?: string
          email: string
          id?: string
          is_approved?: boolean
          name: string
        }
        Update: {
          article_slug?: string
          content?: string
          created_at?: string
          email?: string
          id?: string
          is_approved?: boolean
          name?: string
        }
        Relationships: []
      }
      blog_likes: {
        Row: {
          article_slug: string
          created_at: string
          id: string
          visitor_id: string
        }
        Insert: {
          article_slug: string
          created_at?: string
          id?: string
          visitor_id: string
        }
        Update: {
          article_slug?: string
          created_at?: string
          id?: string
          visitor_id?: string
        }
        Relationships: []
      }
      booking_external_calendar_events: {
        Row: {
          booking_id: string
          created_at: string
          event_etag: string | null
          event_url: string | null
          external_calendar_id: string | null
          external_event_id: string
          id: string
          last_error: string | null
          last_synced_at: string | null
          payload: Json
          professional_id: string
          provider: string
          sync_status: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          event_etag?: string | null
          event_url?: string | null
          external_calendar_id?: string | null
          external_event_id: string
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          payload?: Json
          professional_id: string
          provider: string
          sync_status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          event_etag?: string | null
          event_url?: string | null
          external_calendar_id?: string | null
          external_event_id?: string
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          payload?: Json
          professional_id?: string
          provider?: string
          sync_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_external_calendar_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_external_calendar_events_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_payout_items: {
        Row: {
          booking_id: string
          created_at: string
          payout_batch_item_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          payout_batch_item_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          payout_batch_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_payout_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_payout_items_payout_batch_item_id_fkey"
            columns: ["payout_batch_item_id"]
            isOneToOne: false
            referencedRelation: "payout_batch_items"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_sessions: {
        Row: {
          created_at: string
          end_time_utc: string
          id: string
          parent_booking_id: string
          session_number: number
          start_time_utc: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time_utc: string
          id?: string
          parent_booking_id: string
          session_number: number
          start_time_utc: string
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time_utc?: string
          id?: string
          parent_booking_id?: string
          session_number?: number
          start_time_utc?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_sessions_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          actual_ended_at: string | null
          actual_started_at: string | null
          batch_booking_group_id: string | null
          booking_type: string | null
          cancellation_policy_snapshot: Json | null
          cancellation_reason: string | null
          client_joined_at: string | null
          confirmation_mode_snapshot: string | null
          created_at: string | null
          duration_minutes: number | null
          end_time_utc: string | null
          id: string
          metadata: Json | null
          notes: string | null
          parent_booking_id: string | null
          price_brl: number
          price_brl_minor: number
          price_total: number | null
          price_total_minor: number
          price_user_currency: number | null
          price_user_currency_minor: number
          professional_id: string
          professional_joined_at: string | null
          professional_ready_at: string | null
          provider_type: string | null
          recurrence_auto_renew: boolean
          recurrence_end_date: string | null
          recurrence_group_id: string | null
          recurrence_interval_days: number | null
          recurrence_occurrence_index: number | null
          recurrence_periodicity: string | null
          scheduled_at: string
          service_id: string | null
          session_failure_reason: string | null
          session_link: string | null
          session_purpose: string | null
          session_status: string | null
          start_time_utc: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          timezone_professional: string | null
          timezone_user: string | null
          updated_at: string | null
          user_currency: string | null
          user_id: string
        }
        Insert: {
          actual_ended_at?: string | null
          actual_started_at?: string | null
          batch_booking_group_id?: string | null
          booking_type?: string | null
          cancellation_policy_snapshot?: Json | null
          cancellation_reason?: string | null
          client_joined_at?: string | null
          confirmation_mode_snapshot?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          end_time_utc?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          parent_booking_id?: string | null
          price_brl: number
          price_brl_minor?: number
          price_total?: number | null
          price_total_minor?: number
          price_user_currency?: number | null
          price_user_currency_minor?: number
          professional_id: string
          professional_joined_at?: string | null
          professional_ready_at?: string | null
          provider_type?: string | null
          recurrence_auto_renew?: boolean
          recurrence_end_date?: string | null
          recurrence_group_id?: string | null
          recurrence_interval_days?: number | null
          recurrence_occurrence_index?: number | null
          recurrence_periodicity?: string | null
          scheduled_at: string
          service_id?: string | null
          session_failure_reason?: string | null
          session_link?: string | null
          session_purpose?: string | null
          session_status?: string | null
          start_time_utc?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          timezone_professional?: string | null
          timezone_user?: string | null
          updated_at?: string | null
          user_currency?: string | null
          user_id: string
        }
        Update: {
          actual_ended_at?: string | null
          actual_started_at?: string | null
          batch_booking_group_id?: string | null
          booking_type?: string | null
          cancellation_policy_snapshot?: Json | null
          cancellation_reason?: string | null
          client_joined_at?: string | null
          confirmation_mode_snapshot?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          end_time_utc?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          parent_booking_id?: string | null
          price_brl?: number
          price_brl_minor?: number
          price_total?: number | null
          price_total_minor?: number
          price_user_currency?: number | null
          price_user_currency_minor?: number
          professional_id?: string
          professional_joined_at?: string | null
          professional_ready_at?: string | null
          provider_type?: string | null
          recurrence_auto_renew?: boolean
          recurrence_end_date?: string | null
          recurrence_group_id?: string | null
          recurrence_interval_days?: number | null
          recurrence_occurrence_index?: number | null
          recurrence_periodicity?: string | null
          scheduled_at?: string
          service_id?: string | null
          session_failure_reason?: string | null
          session_link?: string | null
          session_purpose?: string | null
          session_status?: string | null
          start_time_utc?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          timezone_professional?: string | null
          timezone_user?: string | null
          updated_at?: string | null
          user_currency?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "professional_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_integrations: {
        Row: {
          access_token_encrypted: string | null
          auth_type: string
          caldav_calendar_url: string | null
          caldav_principal_url: string | null
          connected_at: string | null
          connection_status: string
          created_at: string
          external_account_id: string | null
          external_calendar_id: string
          id: string
          last_sync_at: string | null
          last_sync_completed_at: string | null
          last_sync_error: string | null
          last_sync_started_at: string | null
          professional_id: string
          provider: string
          provider_account_email: string | null
          refresh_token_encrypted: string | null
          scope: string | null
          sync_cursor: string | null
          sync_enabled: boolean
          token_expires_at: string | null
          token_metadata: Json
          token_refreshed_at: string | null
          updated_at: string
        }
        Insert: {
          access_token_encrypted?: string | null
          auth_type?: string
          caldav_calendar_url?: string | null
          caldav_principal_url?: string | null
          connected_at?: string | null
          connection_status?: string
          created_at?: string
          external_account_id?: string | null
          external_calendar_id?: string
          id?: string
          last_sync_at?: string | null
          last_sync_completed_at?: string | null
          last_sync_error?: string | null
          last_sync_started_at?: string | null
          professional_id: string
          provider: string
          provider_account_email?: string | null
          refresh_token_encrypted?: string | null
          scope?: string | null
          sync_cursor?: string | null
          sync_enabled?: boolean
          token_expires_at?: string | null
          token_metadata?: Json
          token_refreshed_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token_encrypted?: string | null
          auth_type?: string
          caldav_calendar_url?: string | null
          caldav_principal_url?: string | null
          connected_at?: string | null
          connection_status?: string
          created_at?: string
          external_account_id?: string | null
          external_calendar_id?: string
          id?: string
          last_sync_at?: string | null
          last_sync_completed_at?: string | null
          last_sync_error?: string | null
          last_sync_started_at?: string | null
          professional_id?: string
          provider?: string
          provider_account_email?: string | null
          refresh_token_encrypted?: string | null
          scope?: string | null
          sync_cursor?: string | null
          sync_enabled?: boolean
          token_expires_at?: string | null
          token_metadata?: Json
          token_refreshed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_integrations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      case_actions: {
        Row: {
          action_type: string
          case_id: string
          created_at: string
          id: string
          metadata: Json
          performed_by: string
        }
        Insert: {
          action_type: string
          case_id: string
          created_at?: string
          id?: string
          metadata?: Json
          performed_by: string
        }
        Update: {
          action_type?: string
          case_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_actions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_actions_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_messages: {
        Row: {
          case_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          case_id: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          case_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          assigned_to: string | null
          booking_id: string
          created_at: string
          id: string
          priority: string
          reason: string
          refund_amount: number | null
          reporter_id: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          sla_deadline: string | null
          status: Database["public"]["Enums"]["case_status"]
          summary: string | null
          type: Database["public"]["Enums"]["case_type"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          booking_id: string
          created_at?: string
          id?: string
          priority?: string
          reason: string
          refund_amount?: number | null
          reporter_id: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          summary?: string | null
          type: Database["public"]["Enums"]["case_type"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          priority?: string
          reason?: string
          refund_amount?: number | null
          reporter_id?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          summary?: string | null
          type?: Database["public"]["Enums"]["case_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name_en: string
          name_es: string | null
          name_pt: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name_en: string
          name_es?: string | null
          name_pt: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name_en?: string
          name_es?: string | null
          name_pt?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      client_records: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          professional_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          professional_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          professional_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_records_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_resolutions: {
        Row: {
          booking_id: string
          created_at: string
          dispute_amount: number
          dispute_amount_minor: number | null
          id: string
          metadata: Json
          notes: string | null
          original_payout_batch_id: string | null
          professional_id: string
          recovered_amount: number
          recovered_amount_minor: number | null
          recovery_method: string
          remaining_debt: number
          remaining_debt_minor: number | null
          resolved_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          dispute_amount: number
          dispute_amount_minor?: number | null
          id?: string
          metadata?: Json
          notes?: string | null
          original_payout_batch_id?: string | null
          professional_id: string
          recovered_amount?: number
          recovered_amount_minor?: number | null
          recovery_method?: string
          remaining_debt: number
          remaining_debt_minor?: number | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          dispute_amount?: number
          dispute_amount_minor?: number | null
          id?: string
          metadata?: Json
          notes?: string | null
          original_payout_batch_id?: string | null
          professional_id?: string
          recovered_amount?: number
          recovered_amount_minor?: number | null
          recovery_method?: string
          remaining_debt?: number
          remaining_debt_minor?: number | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_resolutions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispute_resolutions_original_payout_batch_id_fkey"
            columns: ["original_payout_batch_id"]
            isOneToOne: false
            referencedRelation: "payout_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispute_resolutions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      external_calendar_busy_slots: {
        Row: {
          created_at: string
          end_time_utc: string
          external_calendar_id: string | null
          external_event_id: string | null
          id: string
          payload: Json
          professional_id: string
          provider: string
          source_updated_at: string | null
          start_time_utc: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time_utc: string
          external_calendar_id?: string | null
          external_event_id?: string | null
          id?: string
          payload?: Json
          professional_id: string
          provider: string
          source_updated_at?: string | null
          start_time_utc: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time_utc?: string
          external_calendar_id?: string | null
          external_event_id?: string | null
          id?: string
          payload?: Json
          professional_id?: string
          provider?: string
          source_updated_at?: string | null
          start_time_utc?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_calendar_busy_slots_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          professional_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          professional_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          professional_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_feedback: {
        Row: {
          created_at: string
          feedback_type: string
          guide_slug: string
          id: string
          message: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          feedback_type: string
          guide_slug: string
          id?: string
          message?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          feedback_type?: string
          guide_slug?: string
          id?: string
          message?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      ledger_accounts: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_account_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_account_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_account_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "ledger_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          account_id: string
          amount: number
          booking_id: string | null
          created_at: string
          currency: string
          description: string | null
          entry_type: string
          id: string
          metadata: Json
          payment_id: string | null
          payout_batch_id: string | null
          transaction_id: string
        }
        Insert: {
          account_id: string
          amount: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          entry_type: string
          id?: string
          metadata?: Json
          payment_id?: string | null
          payout_batch_id?: string | null
          transaction_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          entry_type?: string
          id?: string
          metadata?: Json
          payment_id?: string | null
          payout_batch_id?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ledger_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_payout_batch_id_fkey"
            columns: ["payout_batch_id"]
            isOneToOne: false
            referencedRelation: "payout_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          edited_at: string | null
          id: string
          is_deleted: boolean
          sender_id: string
          sent_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          sender_id: string
          sent_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          sender_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_events: {
        Row: {
          created_at: string
          email_sent: boolean
          email_sent_at: string | null
          event_type: Database["public"]["Enums"]["notification_event_type"]
          id: string
          payload: Json | null
          push_sent: boolean
          recipient_id: string
          related_booking_id: string | null
          related_package_id: string | null
          related_payment_id: string | null
          whatsapp_sent: boolean
        }
        Insert: {
          created_at?: string
          email_sent?: boolean
          email_sent_at?: string | null
          event_type: Database["public"]["Enums"]["notification_event_type"]
          id?: string
          payload?: Json | null
          push_sent?: boolean
          recipient_id: string
          related_booking_id?: string | null
          related_package_id?: string | null
          related_payment_id?: string | null
          whatsapp_sent?: boolean
        }
        Update: {
          created_at?: string
          email_sent?: boolean
          email_sent_at?: string | null
          event_type?: Database["public"]["Enums"]["notification_event_type"]
          id?: string
          payload?: Json | null
          push_sent?: boolean
          recipient_id?: string
          related_booking_id?: string | null
          related_package_id?: string | null
          related_payment_id?: string | null
          whatsapp_sent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_related_package_id_fkey"
            columns: ["related_package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_related_payment_id_fkey"
            columns: ["related_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          booking_id: string | null
          created_at: string
          id: string
          payload: Json
          read_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          body: string
          booking_id?: string | null
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          body?: string
          booking_id?: string | null
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          cancelled_at: string | null
          created_at: string
          expires_at: string
          id: string
          platform_fee_brl: number
          price_brl: number
          priority_hold_day: number | null
          priority_hold_time: string | null
          priority_hold_timezone: string | null
          professional_id: string
          remaining_sessions: number
          renewal_deadline: string | null
          renewal_due_date: string | null
          service_id: string
          started_at: string
          status: Database["public"]["Enums"]["package_status"]
          total_sessions: number
          used_sessions: number
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          platform_fee_brl: number
          price_brl: number
          priority_hold_day?: number | null
          priority_hold_time?: string | null
          priority_hold_timezone?: string | null
          professional_id: string
          remaining_sessions?: number
          renewal_deadline?: string | null
          renewal_due_date?: string | null
          service_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["package_status"]
          total_sessions?: number
          used_sessions?: number
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          platform_fee_brl?: number
          price_brl?: number
          priority_hold_day?: number | null
          priority_hold_time?: string | null
          priority_hold_timezone?: string | null
          professional_id?: string
          remaining_sessions?: number
          renewal_deadline?: string | null
          renewal_due_date?: string | null
          service_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["package_status"]
          total_sessions?: number
          used_sessions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_total: number
          amount_total_minor: number
          base_price_brl: number
          base_price_brl_minor: number
          booking_id: string | null
          captured_at: string | null
          charged_currency: string
          created_at: string
          currency: string
          exchange_rate: number | null
          id: string
          metadata: Json
          package_id: string | null
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          payout_sent_at: string | null
          payout_status: Database["public"]["Enums"]["payout_status"]
          platform_fee_brl: number
          platform_fee_brl_minor: number
          professional_id: string
          provider: string
          refund_amount: number | null
          refund_percentage: number | null
          refund_reason: string | null
          refunded_amount: number | null
          refunded_amount_minor: number
          refunded_at: string | null
          status: string | null
          stripe_charge_id: string | null
          stripe_fee_brl: number | null
          stripe_payment_intent_id: string | null
          stripe_refund_id: string | null
          stripe_transfer_id: string | null
          total_charged: number
          total_charged_minor: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_total?: number
          amount_total_minor?: number
          base_price_brl?: number
          base_price_brl_minor?: number
          booking_id?: string | null
          captured_at?: string | null
          charged_currency?: string
          created_at?: string
          currency?: string
          exchange_rate?: number | null
          id?: string
          metadata?: Json
          package_id?: string | null
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payout_sent_at?: string | null
          payout_status?: Database["public"]["Enums"]["payout_status"]
          platform_fee_brl?: number
          platform_fee_brl_minor?: number
          professional_id: string
          provider?: string
          refund_amount?: number | null
          refund_percentage?: number | null
          refund_reason?: string | null
          refunded_amount?: number | null
          refunded_amount_minor?: number
          refunded_at?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_fee_brl?: number | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          stripe_transfer_id?: string | null
          total_charged?: number
          total_charged_minor?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_total?: number
          amount_total_minor?: number
          base_price_brl?: number
          base_price_brl_minor?: number
          booking_id?: string | null
          captured_at?: string | null
          charged_currency?: string
          created_at?: string
          currency?: string
          exchange_rate?: number | null
          id?: string
          metadata?: Json
          package_id?: string | null
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payout_sent_at?: string | null
          payout_status?: Database["public"]["Enums"]["payout_status"]
          platform_fee_brl?: number
          platform_fee_brl_minor?: number
          professional_id?: string
          provider?: string
          refund_amount?: number | null
          refund_percentage?: number | null
          refund_reason?: string | null
          refunded_amount?: number | null
          refunded_amount_minor?: number
          refunded_at?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_fee_brl?: number | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          stripe_transfer_id?: string | null
          total_charged?: number
          total_charged_minor?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_batch_items: {
        Row: {
          amount: number
          amount_minor: number | null
          batch_id: string
          booking_ids: string[] | null
          created_at: string
          currency: string
          debt_deducted: number
          failure_reason: string | null
          fee_amount: number
          fee_amount_minor: number | null
          id: string
          metadata: Json
          net_amount: number
          net_amount_minor: number | null
          professional_debt_before: number
          professional_id: string
          status: string
          trolley_fee_absorbed: number
          trolley_payment_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          amount_minor?: number | null
          batch_id: string
          booking_ids?: string[] | null
          created_at?: string
          currency?: string
          debt_deducted?: number
          failure_reason?: string | null
          fee_amount?: number
          fee_amount_minor?: number | null
          id?: string
          metadata?: Json
          net_amount: number
          net_amount_minor?: number | null
          professional_debt_before?: number
          professional_id: string
          status?: string
          trolley_fee_absorbed?: number
          trolley_payment_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          amount_minor?: number | null
          batch_id?: string
          booking_ids?: string[] | null
          created_at?: string
          currency?: string
          debt_deducted?: number
          failure_reason?: string | null
          fee_amount?: number
          fee_amount_minor?: number | null
          id?: string
          metadata?: Json
          net_amount?: number
          net_amount_minor?: number | null
          professional_debt_before?: number
          professional_id?: string
          status?: string
          trolley_fee_absorbed?: number
          trolley_payment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_batch_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "payout_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_batch_items_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_batches: {
        Row: {
          completed_at: string | null
          created_at: string
          currency: string
          failed_at: string | null
          failure_reason: string | null
          id: string
          item_count: number
          metadata: Json
          net_amount: number
          net_amount_minor: number | null
          revolut_transaction_id: string | null
          scheduled_at: string | null
          status: string
          submitted_at: string | null
          total_amount: number
          total_amount_minor: number | null
          total_fees: number
          total_fees_minor: number | null
          treasury_balance_after: number | null
          treasury_balance_after_minor: number | null
          treasury_balance_before: number | null
          treasury_balance_before_minor: number | null
          trolley_batch_id: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          currency?: string
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          item_count?: number
          metadata?: Json
          net_amount?: number
          net_amount_minor?: number | null
          revolut_transaction_id?: string | null
          scheduled_at?: string | null
          status?: string
          submitted_at?: string | null
          total_amount?: number
          total_amount_minor?: number | null
          total_fees?: number
          total_fees_minor?: number | null
          treasury_balance_after?: number | null
          treasury_balance_after_minor?: number | null
          treasury_balance_before?: number | null
          treasury_balance_before_minor?: number | null
          trolley_batch_id?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          currency?: string
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          item_count?: number
          metadata?: Json
          net_amount?: number
          net_amount_minor?: number | null
          revolut_transaction_id?: string | null
          scheduled_at?: string | null
          status?: string
          submitted_at?: string | null
          total_amount?: number
          total_amount_minor?: number | null
          total_fees?: number
          total_fees_minor?: number | null
          treasury_balance_after?: number | null
          treasury_balance_after_minor?: number | null
          treasury_balance_before?: number | null
          treasury_balance_before_minor?: number | null
          trolley_batch_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      plan_configs: {
        Row: {
          booking_window_days_limit: number
          buffer_configurable: boolean
          buffer_default_minutes: number
          buffer_max_minutes: number
          extended_bio_limit: number
          features: string[]
          min_notice_hours_max: number
          min_notice_hours_min: number
          service_options_per_service_limit: number
          services_limit: number
          social_links_limit: number
          specialties_limit: number
          tags_limit: number
          tier: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          booking_window_days_limit?: number
          buffer_configurable?: boolean
          buffer_default_minutes?: number
          buffer_max_minutes?: number
          extended_bio_limit?: number
          features?: string[]
          min_notice_hours_max?: number
          min_notice_hours_min?: number
          service_options_per_service_limit?: number
          services_limit?: number
          social_links_limit?: number
          specialties_limit?: number
          tags_limit?: number
          tier: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          booking_window_days_limit?: number
          buffer_configurable?: boolean
          buffer_default_minutes?: number
          buffer_max_minutes?: number
          extended_bio_limit?: number
          features?: string[]
          min_notice_hours_max?: number
          min_notice_hours_min?: number
          service_options_per_service_limit?: number
          services_limit?: number
          social_links_limit?: number
          specialties_limit?: number
          tags_limit?: number
          tier?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_configs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_applications: {
        Row: {
          category: string
          created_at: string
          display_name: string | null
          focus_areas: string[]
          headline: string | null
          id: string
          market_code: string
          other_languages: string[]
          primary_language: string | null
          professional_id: string | null
          qualification_file_names: string[]
          qualification_note: string | null
          qualifications_structured: Json
          reviewed_at: string | null
          reviewed_by: string | null
          secondary_languages: string[]
          session_duration_minutes: number
          session_price_brl: number
          specialty_custom: boolean
          specialty_name: string | null
          specialty_validation_message: string | null
          status: string
          target_audiences: string[]
          taxonomy_suggestions: Json
          title: string | null
          updated_at: string
          user_id: string
          years_experience: number
        }
        Insert: {
          category: string
          created_at?: string
          display_name?: string | null
          focus_areas?: string[]
          headline?: string | null
          id?: string
          market_code?: string
          other_languages?: string[]
          primary_language?: string | null
          professional_id?: string | null
          qualification_file_names?: string[]
          qualification_note?: string | null
          qualifications_structured?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          secondary_languages?: string[]
          session_duration_minutes?: number
          session_price_brl?: number
          specialty_custom?: boolean
          specialty_name?: string | null
          specialty_validation_message?: string | null
          status?: string
          target_audiences?: string[]
          taxonomy_suggestions?: Json
          title?: string | null
          updated_at?: string
          user_id: string
          years_experience?: number
        }
        Update: {
          category?: string
          created_at?: string
          display_name?: string | null
          focus_areas?: string[]
          headline?: string | null
          id?: string
          market_code?: string
          other_languages?: string[]
          primary_language?: string | null
          professional_id?: string | null
          qualification_file_names?: string[]
          qualification_note?: string | null
          qualifications_structured?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          secondary_languages?: string[]
          session_duration_minutes?: number
          session_price_brl?: number
          specialty_custom?: boolean
          specialty_name?: string | null
          specialty_validation_message?: string | null
          status?: string
          target_audiences?: string[]
          taxonomy_suggestions?: Json
          title?: string | null
          updated_at?: string
          user_id?: string
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "professional_applications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_balances: {
        Row: {
          available_balance: number
          available_balance_minor: number | null
          currency: string
          last_calculated_at: string
          last_payout_at: string | null
          pending_balance: number
          pending_balance_minor: number | null
          professional_id: string
          total_debt: number
          total_debt_minor: number | null
          updated_at: string
          withheld_balance: number
          withheld_balance_minor: number | null
        }
        Insert: {
          available_balance?: number
          available_balance_minor?: number | null
          currency?: string
          last_calculated_at?: string
          last_payout_at?: string | null
          pending_balance?: number
          pending_balance_minor?: number | null
          professional_id: string
          total_debt?: number
          total_debt_minor?: number | null
          updated_at?: string
          withheld_balance?: number
          withheld_balance_minor?: number | null
        }
        Update: {
          available_balance?: number
          available_balance_minor?: number | null
          currency?: string
          last_calculated_at?: string
          last_payout_at?: string | null
          pending_balance?: number
          pending_balance_minor?: number | null
          professional_id?: string
          total_debt?: number
          total_debt_minor?: number | null
          updated_at?: string
          withheld_balance?: number
          withheld_balance_minor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_balances_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_credentials: {
        Row: {
          created_at: string
          credential_type: string | null
          file_name: string | null
          file_url: string
          id: string
          ocr_checked_at: string | null
          ocr_extracted_data: Json | null
          ocr_provider: string | null
          ocr_review_notes: string | null
          ocr_score: number | null
          ocr_status: string
          professional_id: string
          scan_checked_at: string | null
          scan_status: string
          updated_at: string
          uploaded_at: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          credential_type?: string | null
          file_name?: string | null
          file_url: string
          id?: string
          ocr_checked_at?: string | null
          ocr_extracted_data?: Json | null
          ocr_provider?: string | null
          ocr_review_notes?: string | null
          ocr_score?: number | null
          ocr_status?: string
          professional_id: string
          scan_checked_at?: string | null
          scan_status?: string
          updated_at?: string
          uploaded_at?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          credential_type?: string | null
          file_name?: string | null
          file_url?: string
          id?: string
          ocr_checked_at?: string | null
          ocr_extracted_data?: Json | null
          ocr_provider?: string | null
          ocr_review_notes?: string | null
          ocr_score?: number | null
          ocr_status?: string
          professional_id?: string
          scan_checked_at?: string | null
          scan_status?: string
          updated_at?: string
          uploaded_at?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_credentials_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_credentials_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_review_adjustments: {
        Row: {
          created_at: string
          created_by: string | null
          field_key: string
          id: string
          message: string
          professional_id: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          stage_id: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          field_key: string
          id?: string
          message: string
          professional_id: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          stage_id: string
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          field_key?: string
          id?: string
          message?: string
          professional_id?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          stage_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_review_adjustments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_review_adjustments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_review_adjustments_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_services: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          duration_minutes: number
          enable_batch: boolean
          enable_monthly: boolean
          enable_recurring: boolean
          id: string
          is_active: boolean
          is_draft: boolean
          name: string
          price_brl: number
          professional_id: string
          service_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          duration_minutes: number
          enable_batch?: boolean
          enable_monthly?: boolean
          enable_recurring?: boolean
          id?: string
          is_active?: boolean
          is_draft?: boolean
          name: string
          price_brl: number
          professional_id: string
          service_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          duration_minutes?: number
          enable_batch?: boolean
          enable_monthly?: boolean
          enable_recurring?: boolean
          id?: string
          is_active?: boolean
          is_draft?: boolean
          name?: string
          price_brl?: number
          professional_id?: string
          service_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_settings: {
        Row: {
          billing_card_on_file: boolean
          buffer_minutes: number
          buffer_time_minutes: number
          calendar_sync_provider: string | null
          cancellation_policy_accepted: boolean
          cancellation_policy_code: string
          confirmation_mode: string
          created_at: string
          enable_recurring: boolean
          max_booking_window_days: number
          minimum_notice_hours: number
          notification_email: boolean
          notification_push: boolean
          notification_whatsapp: boolean
          onboarding_finance_bypass: boolean
          payout_kyc_completed: boolean
          payout_onboarding_started: boolean
          payout_periodicity: string
          professional_id: string
          require_session_purpose: boolean
          session_duration_minutes: number
          terms_accepted_at: string | null
          terms_version: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          billing_card_on_file?: boolean
          buffer_minutes?: number
          buffer_time_minutes?: number
          calendar_sync_provider?: string | null
          cancellation_policy_accepted?: boolean
          cancellation_policy_code?: string
          confirmation_mode?: string
          created_at?: string
          enable_recurring?: boolean
          max_booking_window_days?: number
          minimum_notice_hours?: number
          notification_email?: boolean
          notification_push?: boolean
          notification_whatsapp?: boolean
          onboarding_finance_bypass?: boolean
          payout_kyc_completed?: boolean
          payout_onboarding_started?: boolean
          payout_periodicity?: string
          professional_id: string
          require_session_purpose?: boolean
          session_duration_minutes?: number
          terms_accepted_at?: string | null
          terms_version?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          billing_card_on_file?: boolean
          buffer_minutes?: number
          buffer_time_minutes?: number
          calendar_sync_provider?: string | null
          cancellation_policy_accepted?: boolean
          cancellation_policy_code?: string
          confirmation_mode?: string
          created_at?: string
          enable_recurring?: boolean
          max_booking_window_days?: number
          minimum_notice_hours?: number
          notification_email?: boolean
          notification_push?: boolean
          notification_whatsapp?: boolean
          onboarding_finance_bypass?: boolean
          payout_kyc_completed?: boolean
          payout_onboarding_started?: boolean
          payout_periodicity?: string
          professional_id?: string
          require_session_purpose?: boolean
          session_duration_minutes?: number
          terms_accepted_at?: string | null
          terms_version?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_settings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_specialties: {
        Row: {
          created_at: string
          id: string
          professional_id: string
          specialty_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          professional_id: string
          specialty_id: string
        }
        Update: {
          created_at?: string
          id?: string
          professional_id?: string
          specialty_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_specialties_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_specialties_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_subcategories: {
        Row: {
          professional_id: string
          subcategory_id: string
        }
        Insert: {
          professional_id: string
          subcategory_id: string
        }
        Update: {
          professional_id?: string
          subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_subcategories_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_subscriptions: {
        Row: {
          amount_minor: number
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          failure_count: number
          id: string
          last_failure_at: string | null
          last_failure_reason: string | null
          last_payment_at: string | null
          metadata: Json
          professional_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_end: string | null
          trial_start: string | null
          updated_at: string
        }
        Insert: {
          amount_minor?: number
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          failure_count?: number
          id?: string
          last_failure_at?: string | null
          last_failure_reason?: string | null
          last_payment_at?: string | null
          metadata?: Json
          professional_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Update: {
          amount_minor?: number
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          failure_count?: number
          id?: string
          last_failure_at?: string | null
          last_failure_reason?: string | null
          last_payment_at?: string | null
          metadata?: Json
          professional_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_subscriptions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_term_acceptances: {
        Row: {
          accepted_at: string
          accepted_by: string | null
          id: string
          ip: unknown
          professional_id: string
          term_key: string
          term_version: string
          text_hash: string
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string
          accepted_by?: string | null
          id?: string
          ip?: unknown
          professional_id: string
          term_key: string
          term_version: string
          text_hash: string
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string
          accepted_by?: string | null
          id?: string
          ip?: unknown
          professional_id?: string
          term_key?: string
          term_version?: string
          text_hash?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_term_acceptances_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_term_acceptances_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_term_view_events: {
        Row: {
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          ip: unknown
          opened_at: string
          opened_by: string | null
          professional_id: string
          term_key: string
          term_version: string
          user_agent: string | null
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          ip?: unknown
          opened_at?: string
          opened_by?: string | null
          professional_id: string
          term_key: string
          term_version: string
          user_agent?: string | null
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          ip?: unknown
          opened_at?: string
          opened_by?: string | null
          professional_id?: string
          term_key?: string
          term_version?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_term_view_events_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_term_view_events_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          admin_review_notes: string | null
          bio: string | null
          category: string
          category_id: string | null
          cover_photo_url: string | null
          created_at: string | null
          first_booking_enabled: boolean
          first_booking_gate_note: string | null
          first_booking_gate_updated_at: string | null
          id: string
          is_publicly_visible: boolean
          languages: string[] | null
          market_code: string
          platform_region: string | null
          public_code: number
          rating: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          session_duration_minutes: number | null
          session_price: number
          session_price_brl: number
          session_price_currency: string
          social_links: Json | null
          status: string | null
          stripe_account_id: string | null
          stripe_account_status: string | null
          subcategories: string[] | null
          tags: string[] | null
          tier: string
          total_bookings: number | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string
          video_intro_url: string | null
          visibility_checked_at: string | null
          whatsapp_number: string | null
          years_experience: number | null
        }
        Insert: {
          admin_review_notes?: string | null
          bio?: string | null
          category: string
          category_id?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          first_booking_enabled?: boolean
          first_booking_gate_note?: string | null
          first_booking_gate_updated_at?: string | null
          id?: string
          is_publicly_visible?: boolean
          languages?: string[] | null
          market_code?: string
          platform_region?: string | null
          public_code: number
          rating?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_duration_minutes?: number | null
          session_price?: number
          session_price_brl?: number
          session_price_currency?: string
          social_links?: Json | null
          status?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          subcategories?: string[] | null
          tags?: string[] | null
          tier?: string
          total_bookings?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
          video_intro_url?: string | null
          visibility_checked_at?: string | null
          whatsapp_number?: string | null
          years_experience?: number | null
        }
        Update: {
          admin_review_notes?: string | null
          bio?: string | null
          category?: string
          category_id?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          first_booking_enabled?: boolean
          first_booking_gate_note?: string | null
          first_booking_gate_updated_at?: string | null
          id?: string
          is_publicly_visible?: boolean
          languages?: string[] | null
          market_code?: string
          platform_region?: string | null
          public_code?: number
          rating?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_duration_minutes?: number | null
          session_price?: number
          session_price_brl?: number
          session_price_currency?: string
          social_links?: Json | null
          status?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          subcategories?: string[] | null
          tags?: string[] | null
          tier?: string
          total_bookings?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
          video_intro_url?: string | null
          visibility_checked_at?: string | null
          whatsapp_number?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          email: string
          full_name: string
          id: string
          language: string
          notification_preferences: Json | null
          role: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          email: string
          full_name: string
          id: string
          language?: string
          notification_preferences?: Json | null
          role?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string
          full_name?: string
          id?: string
          language?: string
          notification_preferences?: Json | null
          role?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          app_version: string | null
          auth: string | null
          created_at: string
          device_id: string | null
          endpoint: string
          id: string
          locale: string | null
          os_version: string | null
          p256dh: string | null
          platform: string
          push_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_version?: string | null
          auth?: string | null
          created_at?: string
          device_id?: string | null
          endpoint: string
          id?: string
          locale?: string | null
          os_version?: string | null
          p256dh?: string | null
          platform?: string
          push_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_version?: string | null
          auth?: string | null
          created_at?: string
          device_id?: string | null
          endpoint?: string
          id?: string
          locale?: string | null
          os_version?: string | null
          p256dh?: string | null
          platform?: string
          push_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      request_bookings: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          converted_booking_id: string | null
          created_at: string
          declined_at: string | null
          expired_at: string | null
          id: string
          preferred_end_utc: string
          preferred_start_utc: string
          professional_id: string
          proposal_end_utc: string | null
          proposal_expires_at: string | null
          proposal_message: string | null
          proposal_start_utc: string | null
          proposal_timezone: string | null
          status: string
          updated_at: string
          user_id: string
          user_message: string | null
          user_timezone: string
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          converted_booking_id?: string | null
          created_at?: string
          declined_at?: string | null
          expired_at?: string | null
          id?: string
          preferred_end_utc: string
          preferred_start_utc: string
          professional_id: string
          proposal_end_utc?: string | null
          proposal_expires_at?: string | null
          proposal_message?: string | null
          proposal_start_utc?: string | null
          proposal_timezone?: string | null
          status?: string
          updated_at?: string
          user_id: string
          user_message?: string | null
          user_timezone: string
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          converted_booking_id?: string | null
          created_at?: string
          declined_at?: string | null
          expired_at?: string | null
          id?: string
          preferred_end_utc?: string
          preferred_start_utc?: string
          professional_id?: string
          proposal_end_utc?: string | null
          proposal_expires_at?: string | null
          proposal_message?: string | null
          proposal_start_utc?: string | null
          proposal_timezone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          user_message?: string | null
          user_timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_bookings_converted_booking_id_fkey"
            columns: ["converted_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_bookings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          admin_notes: string | null
          booking_id: string
          client_market_code: string | null
          comment: string | null
          created_at: string | null
          flag_reasons: string[] | null
          id: string
          is_visible: boolean | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_status: string
          professional_id: string
          professional_response: string | null
          professional_response_at: string | null
          rating: number
          rejection_reason: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          booking_id: string
          client_market_code?: string | null
          comment?: string | null
          created_at?: string | null
          flag_reasons?: string[] | null
          id?: string
          is_visible?: boolean | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_status?: string
          professional_id: string
          professional_response?: string | null
          professional_response_at?: string | null
          rating: number
          rejection_reason?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          booking_id?: string
          client_market_code?: string | null
          comment?: string | null
          created_at?: string | null
          flag_reasons?: string[] | null
          id?: string
          is_visible?: boolean | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_status?: string
          professional_id?: string
          professional_response?: string | null
          professional_response_at?: string | null
          rating?: number
          rejection_reason?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      revolut_treasury_snapshots: {
        Row: {
          account_id: string
          balance: number
          balance_minor: number | null
          currency: string
          id: string
          metadata: Json
          snapshot_at: string
          source: string
        }
        Insert: {
          account_id: string
          balance: number
          balance_minor?: number | null
          currency: string
          id?: string
          metadata?: Json
          snapshot_at?: string
          source?: string
        }
        Update: {
          account_id?: string
          balance?: number
          balance_minor?: number | null
          currency?: string
          id?: string
          metadata?: Json
          snapshot_at?: string
          source?: string
        }
        Relationships: []
      }
      saved_payment_methods: {
        Row: {
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last4: string | null
          consent_auto_renewal: boolean
          consent_given_at: string | null
          consent_save_card: boolean
          created_at: string
          id: string
          is_default: boolean
          stripe_payment_method_id: string
          user_id: string
        }
        Insert: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          consent_auto_renewal?: boolean
          consent_given_at?: string | null
          consent_save_card?: boolean
          created_at?: string
          id?: string
          is_default?: boolean
          stripe_payment_method_id: string
          user_id: string
        }
        Update: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          consent_auto_renewal?: boolean
          consent_given_at?: string | null
          consent_save_card?: boolean
          created_at?: string
          id?: string
          is_default?: boolean
          stripe_payment_method_id?: string
          user_id?: string
        }
        Relationships: []
      }
      search_sessions: {
        Row: {
          abandoned_event_emitted_at: string | null
          converted_at: string | null
          converted_booking_id: string | null
          created_at: string
          filters: Json | null
          id: string
          query: string | null
          result_count: number | null
          searched_at: string
          user_id: string
        }
        Insert: {
          abandoned_event_emitted_at?: string | null
          converted_at?: string | null
          converted_booking_id?: string | null
          created_at?: string
          filters?: Json | null
          id?: string
          query?: string | null
          result_count?: number | null
          searched_at?: string
          user_id: string
        }
        Update: {
          abandoned_event_emitted_at?: string | null
          converted_at?: string | null
          converted_booking_id?: string | null
          created_at?: string
          filters?: Json | null
          id?: string
          query?: string | null
          result_count?: number | null
          searched_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_sessions_converted_booking_id_fkey"
            columns: ["converted_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description_en: string | null
          description_pt: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          is_package: boolean
          name_en: string
          name_pt: string
          price_brl: number
          professional_id: string
          sessions_in_package: number | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_pt?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          is_package?: boolean
          name_en: string
          name_pt: string
          price_brl: number
          professional_id: string
          sessions_in_package?: number | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_pt?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          is_package?: boolean
          name_en?: string
          name_pt?: string
          price_brl?: number
          professional_id?: string
          sessions_in_package?: number | null
          sort_order?: number
        }
        Relationships: []
      }
      session_notes: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          metadata: Json
          mood: string | null
          notes: string | null
          professional_id: string
          symptoms: string | null
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          metadata?: Json
          mood?: string | null
          notes?: string | null
          professional_id: string
          symptoms?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          mood?: string | null
          notes?: string | null
          professional_id?: string
          symptoms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_notes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_notes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      slot_locks: {
        Row: {
          booking_type: string
          created_at: string
          end_time_utc: string
          expires_at: string
          id: string
          professional_id: string
          start_time_utc: string
          user_id: string
        }
        Insert: {
          booking_type?: string
          created_at?: string
          end_time_utc: string
          expires_at: string
          id?: string
          professional_id: string
          start_time_utc: string
          user_id: string
        }
        Update: {
          booking_type?: string
          created_at?: string
          end_time_utc?: string
          expires_at?: string
          id?: string
          professional_id?: string
          start_time_utc?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slot_locks_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_locks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      specialties: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name_en: string
          name_es: string | null
          name_pt: string
          slug: string
          sort_order: number
          subcategory_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name_en: string
          name_es?: string | null
          name_pt: string
          slug: string
          sort_order?: number
          subcategory_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name_en?: string
          name_es?: string | null
          name_pt?: string
          slug?: string
          sort_order?: number
          subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialties_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          created_at: string
          id: string
          stripe_customer_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stripe_customer_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stripe_customer_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_job_runs: {
        Row: {
          context: Json
          created_at: string
          error_message: string | null
          finished_at: string | null
          id: string
          job_name: string
          run_key: string
          started_at: string
          status: string
          summary: Json
          updated_at: string
        }
        Insert: {
          context?: Json
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_name: string
          run_key: string
          started_at?: string
          status: string
          summary?: Json
          updated_at?: string
        }
        Update: {
          context?: Json
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_name?: string
          run_key?: string
          started_at?: string
          status?: string
          summary?: Json
          updated_at?: string
        }
        Relationships: []
      }
      stripe_payment_retry_queue: {
        Row: {
          attempt_count: number
          created_at: string
          id: string
          last_error: string | null
          max_attempts: number
          metadata: Json
          next_attempt_at: string
          payment_id: string | null
          provider_payment_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          metadata?: Json
          next_attempt_at?: string
          payment_id?: string | null
          provider_payment_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          metadata?: Json
          next_attempt_at?: string
          payment_id?: string | null
          provider_payment_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_payment_retry_queue_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_settlements: {
        Row: {
          amount: number
          arrival_date: string | null
          bank_reference: string | null
          created_at: string
          currency: string
          fee: number
          id: string
          ledger_transaction_id: string | null
          metadata: Json
          net_amount: number
          revolut_transaction_id: string | null
          settlement_date: string | null
          status: string
          stripe_payout_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          arrival_date?: string | null
          bank_reference?: string | null
          created_at?: string
          currency?: string
          fee?: number
          id?: string
          ledger_transaction_id?: string | null
          metadata?: Json
          net_amount: number
          revolut_transaction_id?: string | null
          settlement_date?: string | null
          status?: string
          stripe_payout_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          arrival_date?: string | null
          bank_reference?: string | null
          created_at?: string
          currency?: string
          fee?: number
          id?: string
          ledger_transaction_id?: string | null
          metadata?: Json
          net_amount?: number
          revolut_transaction_id?: string | null
          settlement_date?: string | null
          status?: string
          stripe_payout_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_subscription_check_queue: {
        Row: {
          attempt_count: number
          created_at: string
          id: string
          last_error: string | null
          max_attempts: number
          metadata: Json
          next_attempt_at: string
          professional_id: string | null
          status: string
          stripe_subscription_id: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          metadata?: Json
          next_attempt_at?: string
          professional_id?: string | null
          status?: string
          stripe_subscription_id: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          metadata?: Json
          next_attempt_at?: string
          professional_id?: string | null
          status?: string
          stripe_subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_subscription_check_queue_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          api_version: string | null
          attempt_count: number
          created_at: string
          event_type: string
          id: string
          last_error: string | null
          livemode: boolean
          max_attempts: number
          next_retry_at: string
          payload: Json
          processed_at: string | null
          provider_event_id: string
          received_at: string
          signature_header: string | null
          status: string
          updated_at: string
        }
        Insert: {
          api_version?: string | null
          attempt_count?: number
          created_at?: string
          event_type: string
          id?: string
          last_error?: string | null
          livemode?: boolean
          max_attempts?: number
          next_retry_at?: string
          payload?: Json
          processed_at?: string | null
          provider_event_id: string
          received_at?: string
          signature_header?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          api_version?: string | null
          attempt_count?: number
          created_at?: string
          event_type?: string
          id?: string
          last_error?: string | null
          livemode?: boolean
          max_attempts?: number
          next_retry_at?: string
          payload?: Json
          processed_at?: string | null
          provider_event_id?: string
          received_at?: string
          signature_header?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_active: boolean
          name_en: string
          name_es: string | null
          name_pt: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_en: string
          name_es?: string | null
          name_pt: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_en?: string
          name_es?: string | null
          name_pt?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tag_suggestions: {
        Row: {
          created_at: string
          id: string
          professional_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          professional_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tag: string
        }
        Update: {
          created_at?: string
          id?: string
          professional_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_suggestions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_suggestions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      taxonomy_service_options: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name_en: string | null
          name_pt: string
          slug: string
          sort_order: number
          subcategory_slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name_en?: string | null
          name_pt: string
          slug: string
          sort_order?: number
          subcategory_slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name_en?: string | null
          name_pt?: string
          slug?: string
          sort_order?: number
          subcategory_slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      trolley_recipients: {
        Row: {
          activated_at: string | null
          bank_account_json: Json | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          kyc_status: string
          metadata: Json
          payout_method: string
          paypal_email: string | null
          professional_id: string
          trolley_recipient_id: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          bank_account_json?: Json | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          kyc_status?: string
          metadata?: Json
          payout_method?: string
          paypal_email?: string | null
          professional_id: string
          trolley_recipient_id: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          bank_account_json?: Json | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          kyc_status?: string
          metadata?: Json
          payout_method?: string
          paypal_email?: string | null
          professional_id?: string
          trolley_recipient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trolley_recipients_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          country: string | null
          created_at: string | null
          email: string
          firstname: string
          id: string
          origem_lead: string | null
          status: string | null
          tipo_lead: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          email: string
          firstname: string
          id?: string
          origem_lead?: string | null
          status?: string | null
          tipo_lead?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          email?: string
          firstname?: string
          id?: string
          origem_lead?: string | null
          status?: string | null
          tipo_lead?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_batch_bookings_with_payment: {
        Args: {
          p_bookings: Json
          p_captured_at: string
          p_payment_amount_total: number
          p_payment_currency: string
          p_payment_metadata: Json
          p_payment_provider: string
          p_payment_status: string
          p_professional_id: string
          p_user_id: string
        }
        Returns: {
          booking_id: string
        }[]
      }
      create_booking_with_payment: {
        Args: {
          p_booking_metadata: Json
          p_booking_type: string
          p_cancellation_policy_snapshot: Json
          p_captured_at: string
          p_confirmation_mode_snapshot: string
          p_duration_minutes: number
          p_end_time_utc: string
          p_notes: string
          p_payment_amount_total: number
          p_payment_currency: string
          p_payment_metadata: Json
          p_payment_provider: string
          p_payment_status: string
          p_price_brl: number
          p_price_total: number
          p_price_user_currency: number
          p_professional_id: string
          p_scheduled_at: string
          p_session_purpose: string
          p_start_time_utc: string
          p_status: string
          p_timezone_professional: string
          p_timezone_user: string
          p_user_currency: string
          p_user_id: string
        }
        Returns: {
          booking_id: string
          payment_id: string
        }[]
      }
      create_ledger_transaction_atomic: {
        Args: {
          p_booking_id?: string
          p_currency?: string
          p_description?: string
          p_entries?: Json
          p_payment_id?: string
          p_payout_batch_id?: string
          p_transaction_id: string
        }
        Returns: {
          account_id: string
          amount: number
          entry_id: string
          entry_type: string
        }[]
      }
      create_recurring_booking_with_payment: {
        Args: {
          p_captured_at: string
          p_children: Json
          p_parent: Json
          p_payment_amount_total: number
          p_payment_currency: string
          p_payment_metadata: Json
          p_payment_provider: string
          p_payment_status: string
          p_professional_id: string
          p_sessions: Json
          p_user_id: string
        }
        Returns: {
          child_booking_ids: string[]
          parent_booking_id: string
          payment_id: string
          session_ids: string[]
        }[]
      }
      current_actor_is_admin_or_service_role: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      normalize_taxonomy_text: { Args: { input_text: string }; Returns: string }
      professional_tier_limits: {
        Args: { p_tier: string }
        Returns: {
          max_notice_hours: number
          max_services: number
          max_specialties: number
          max_tags: number
          max_window_days: number
          min_notice_hours: number
        }[]
      }
      recalc_professional_rating: {
        Args: { p_professional_id: string }
        Returns: undefined
      }
      search_public_professionals_pgtrgm:
        | {
            Args: {
              p_category?: string
              p_language?: string
              p_limit?: number
              p_location?: string
              p_max_price_brl?: number
              p_min_price_brl?: number
              p_query?: string
              p_specialty?: string
            }
            Returns: {
              professional_id: string
              text_rank: number
            }[]
          }
        | {
            Args: {
              p_category?: string
              p_language?: string
              p_limit?: number
              p_location?: string
              p_market?: string
              p_max_price_brl?: number
              p_min_price_brl?: number
              p_query?: string
              p_specialty?: string
            }
            Returns: {
              professional_id: string
              text_rank: number
            }[]
          }
      search_text_from_array: { Args: { input: string[] }; Returns: string }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_professional_balance_atomic:
        | {
            Args: {
              p_available_delta?: number
              p_debt_delta?: number
              p_pending_delta?: number
              p_professional_id: string
              p_withheld_delta?: number
            }
            Returns: {
              available_balance: number
              currency: string
              last_calculated_at: string
              last_payout_at: string
              pending_balance: number
              professional_id: string
              total_debt: number
              withheld_balance: number
            }[]
          }
        | {
            Args: {
              p_available_delta?: number
              p_debt_delta?: number
              p_last_payout_at?: string
              p_pending_delta?: number
              p_professional_id: string
              p_withheld_delta?: number
            }
            Returns: {
              available_balance: number
              currency: string
              last_calculated_at: string
              last_payout_at: string
              pending_balance: number
              professional_id: string
              total_debt: number
              withheld_balance: number
            }[]
          }
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
        | "rescheduled"
      case_status:
        | "open"
        | "under_review"
        | "waiting_info"
        | "resolved"
        | "closed"
      case_type:
        | "cancelation_dispute"
        | "no_show_claim"
        | "quality_issue"
        | "refund_request"
      notification_event_type:
        | "booking_confirmed"
        | "booking_cancelled"
        | "booking_rescheduled"
        | "session_reminder_24h"
        | "session_reminder_1h"
        | "session_completed"
        | "session_no_show"
        | "renewal_due"
        | "renewal_completed"
        | "renewal_expired"
        | "payment_success"
        | "payment_failed"
        | "payout_sent"
        | "review_received"
        | "professional_approved"
        | "professional_rejected"
        | "welcome_user"
        | "welcome_professional"
      package_status: "active" | "expired" | "cancelled"
      payment_status:
        | "pending"
        | "processing"
        | "succeeded"
        | "failed"
        | "refunded"
        | "partially_refunded"
      payout_status: "pending" | "processing" | "sent" | "failed"
      professional_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "rejected"
        | "suspended"
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
      booking_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
        "rescheduled",
      ],
      case_status: [
        "open",
        "under_review",
        "waiting_info",
        "resolved",
        "closed",
      ],
      case_type: [
        "cancelation_dispute",
        "no_show_claim",
        "quality_issue",
        "refund_request",
      ],
      notification_event_type: [
        "booking_confirmed",
        "booking_cancelled",
        "booking_rescheduled",
        "session_reminder_24h",
        "session_reminder_1h",
        "session_completed",
        "session_no_show",
        "renewal_due",
        "renewal_completed",
        "renewal_expired",
        "payment_success",
        "payment_failed",
        "payout_sent",
        "review_received",
        "professional_approved",
        "professional_rejected",
        "welcome_user",
        "welcome_professional",
      ],
      package_status: ["active", "expired", "cancelled"],
      payment_status: [
        "pending",
        "processing",
        "succeeded",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      payout_status: ["pending", "processing", "sent", "failed"],
      professional_status: [
        "draft",
        "pending_review",
        "approved",
        "rejected",
        "suspended",
      ],
    },
  },
} as const
