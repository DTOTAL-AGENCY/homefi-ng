
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "advisors": {
                  Row: {
                    "bio_long": string | null,"bio_short": string,"cal_event_type_id": number | null,"cal_username": string | null,"created_at": string,"credentials": NonNullable<Json>,"display_name": string,"headline": string,"id": string,"languages": (string)[],"photo_url": string | null,"price_ngn_kobo": number | null,"price_usd_cents": number,"slug": string,"specialisms": (string)[],"states_covered": (string)[],"status": Database["public"]['Enums']["advisor_status"],"user_id": string,"verified_at": string | null,"years_experience": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "bio_long"?: string | null,"bio_short": string,"cal_event_type_id"?: number | null,"cal_username"?: string | null,"created_at"?: string,"credentials"?: NonNullable<Json>,"display_name": string,"headline": string,"id"?: string,"languages"?: (string)[],"photo_url"?: string | null,"price_ngn_kobo"?: number | null,"price_usd_cents"?: number,"slug": string,"specialisms"?: (string)[],"states_covered"?: (string)[],"status"?: Database["public"]['Enums']["advisor_status"],"user_id": string,"verified_at"?: string | null,"years_experience"?: number | null
                  }
                  Update: {
                    "bio_long"?: string | null,"bio_short"?: string,"cal_event_type_id"?: number | null,"cal_username"?: string | null,"created_at"?: string,"credentials"?: NonNullable<Json>,"display_name"?: string,"headline"?: string,"id"?: string,"languages"?: (string)[],"photo_url"?: string | null,"price_ngn_kobo"?: number | null,"price_usd_cents"?: number,"slug"?: string,"specialisms"?: (string)[],"states_covered"?: (string)[],"status"?: Database["public"]['Enums']["advisor_status"],"user_id"?: string,"verified_at"?: string | null,"years_experience"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "advisors_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"advisory_sessions": {
                  Row: {
                    "abandoned_email_at": string | null,"advisor_id": string,"advisor_notes": string | null,"application_id": string | null,"cal_booking_uid": string | null,"created_at": string,"end_at": string,"ended_at": string | null,"hold_expires_at": string | null,"id": string,"meeting_type": string,"meeting_url": string | null,"payment_id": string | null,"reminder_1h_sent_at": string | null,"reminder_24h_sent_at": string | null,"report_id": string | null,"review_requested_at": string | null,"start_at": string,"status": Database["public"]['Enums']["session_status"],"timezone": string,"topic": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "abandoned_email_at"?: string | null,"advisor_id": string,"advisor_notes"?: string | null,"application_id"?: string | null,"cal_booking_uid"?: string | null,"created_at"?: string,"end_at": string,"ended_at"?: string | null,"hold_expires_at"?: string | null,"id"?: string,"meeting_type"?: string,"meeting_url"?: string | null,"payment_id"?: string | null,"reminder_1h_sent_at"?: string | null,"reminder_24h_sent_at"?: string | null,"report_id"?: string | null,"review_requested_at"?: string | null,"start_at": string,"status"?: Database["public"]['Enums']["session_status"],"timezone"?: string,"topic"?: string | null,"user_id": string
                  }
                  Update: {
                    "abandoned_email_at"?: string | null,"advisor_id"?: string,"advisor_notes"?: string | null,"application_id"?: string | null,"cal_booking_uid"?: string | null,"created_at"?: string,"end_at"?: string,"ended_at"?: string | null,"hold_expires_at"?: string | null,"id"?: string,"meeting_type"?: string,"meeting_url"?: string | null,"payment_id"?: string | null,"reminder_1h_sent_at"?: string | null,"reminder_24h_sent_at"?: string | null,"report_id"?: string | null,"review_requested_at"?: string | null,"start_at"?: string,"status"?: Database["public"]['Enums']["session_status"],"timezone"?: string,"topic"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "advisory_sessions_advisor_id_fkey"
      columns: ["advisor_id"]
isOneToOne: false
      referencedRelation: "advisor_stats"
      referencedColumns: ["advisor_id"]
    },{
      foreignKeyName: "advisory_sessions_advisor_id_fkey"
      columns: ["advisor_id"]
isOneToOne: false
      referencedRelation: "advisors"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "advisory_sessions_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "advisory_sessions_payment_id_fkey"
      columns: ["payment_id"]
isOneToOne: false
      referencedRelation: "payments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "advisory_sessions_report_id_fkey"
      columns: ["report_id"]
isOneToOne: false
      referencedRelation: "reports"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "advisory_sessions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"applicants": {
                  Row: {
                    "age": number | null,"application_id": string,"existing_monthly_obligations_minor": number,"first_name": string | null,"full_name": string,"gender": string | null,"id": string,"income_currency": string,"income_source": Database["public"]['Enums']["income_source_type"],"last_name": string | null,"legacy_income_band": string | null,"marital_status": string | null,"monthly_net_income_minor": number,"other_names": string | null,"phone_e164": string | null,"role": string,"title": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "age"?: number | null,"application_id": string,"existing_monthly_obligations_minor"?: number,"first_name"?: string | null,"full_name": string,"gender"?: string | null,"id"?: string,"income_currency"?: string,"income_source": Database["public"]['Enums']["income_source_type"],"last_name"?: string | null,"legacy_income_band"?: string | null,"marital_status"?: string | null,"monthly_net_income_minor": number,"other_names"?: string | null,"phone_e164"?: string | null,"role": string,"title"?: string | null
                  }
                  Update: {
                    "age"?: number | null,"application_id"?: string,"existing_monthly_obligations_minor"?: number,"first_name"?: string | null,"full_name"?: string,"gender"?: string | null,"id"?: string,"income_currency"?: string,"income_source"?: Database["public"]['Enums']["income_source_type"],"last_name"?: string | null,"legacy_income_band"?: string | null,"marital_status"?: string | null,"monthly_net_income_minor"?: number,"other_names"?: string | null,"phone_e164"?: string | null,"role"?: string,"title"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "applicants_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    }
                  ]
                },"applications": {
                  Row: {
                    "anon_token_expires_at": string | null,"anon_token_hash": string | null,"bedrooms": string | null,"claimed_at": string | null,"costs_acknowledged": string | null,"created_at": string,"draft": NonNullable<Json>,"engine_version": string | null,"equity_available_kobo": number,"estimate": Json | null,"financial_readiness": string | null,"has_rsa": string | null,"id": string,"intended_use": string | null,"is_joint": boolean,"last_step": number,"legacy_row_index": number | null,"legacy_source": string | null,"nationality": string | null,"nhf_contributor": string | null,"non_interest_preference": string | null,"notes": string | null,"preferred_city": string | null,"preferred_states": (string)[] | null,"proceed_intent": string | null,"property_features": (string)[],"property_status": string | null,"property_type": string | null,"reference_code": string | null,"report_prompt_answer": string | null,"report_prompt_at": string | null,"residence": Database["public"]['Enums']["residence_type"] | null,"residence_city": string | null,"residence_country": string | null,"residence_state": string | null,"rsa_equity_use": string | null,"source_channel": string | null,"status": Database["public"]['Enums']["application_status"],"submitted_at": string | null,"target_exact_kobo": number | null,"target_value_max_kobo": number | null,"target_value_min_kobo": number | null,"timeline": string | null,"updated_at": string,"user_id": string | null,"utm": Json | null
                  }
                  ComputedFields: never
                  Insert: {
                    "anon_token_expires_at"?: string | null,"anon_token_hash"?: string | null,"bedrooms"?: string | null,"claimed_at"?: string | null,"costs_acknowledged"?: string | null,"created_at"?: string,"draft"?: NonNullable<Json>,"engine_version"?: string | null,"equity_available_kobo"?: number,"estimate"?: Json | null,"financial_readiness"?: string | null,"has_rsa"?: string | null,"id"?: string,"intended_use"?: string | null,"is_joint"?: boolean,"last_step"?: number,"legacy_row_index"?: number | null,"legacy_source"?: string | null,"nationality"?: string | null,"nhf_contributor"?: string | null,"non_interest_preference"?: string | null,"notes"?: string | null,"preferred_city"?: string | null,"preferred_states"?: (string)[] | null,"proceed_intent"?: string | null,"property_features"?: (string)[],"property_status"?: string | null,"property_type"?: string | null,"reference_code"?: string | null,"report_prompt_answer"?: string | null,"report_prompt_at"?: string | null,"residence"?: Database["public"]['Enums']["residence_type"] | null,"residence_city"?: string | null,"residence_country"?: string | null,"residence_state"?: string | null,"rsa_equity_use"?: string | null,"source_channel"?: string | null,"status"?: Database["public"]['Enums']["application_status"],"submitted_at"?: string | null,"target_exact_kobo"?: number | null,"target_value_max_kobo"?: number | null,"target_value_min_kobo"?: number | null,"timeline"?: string | null,"updated_at"?: string,"user_id"?: string | null,"utm"?: Json | null
                  }
                  Update: {
                    "anon_token_expires_at"?: string | null,"anon_token_hash"?: string | null,"bedrooms"?: string | null,"claimed_at"?: string | null,"costs_acknowledged"?: string | null,"created_at"?: string,"draft"?: NonNullable<Json>,"engine_version"?: string | null,"equity_available_kobo"?: number,"estimate"?: Json | null,"financial_readiness"?: string | null,"has_rsa"?: string | null,"id"?: string,"intended_use"?: string | null,"is_joint"?: boolean,"last_step"?: number,"legacy_row_index"?: number | null,"legacy_source"?: string | null,"nationality"?: string | null,"nhf_contributor"?: string | null,"non_interest_preference"?: string | null,"notes"?: string | null,"preferred_city"?: string | null,"preferred_states"?: (string)[] | null,"proceed_intent"?: string | null,"property_features"?: (string)[],"property_status"?: string | null,"property_type"?: string | null,"reference_code"?: string | null,"report_prompt_answer"?: string | null,"report_prompt_at"?: string | null,"residence"?: Database["public"]['Enums']["residence_type"] | null,"residence_city"?: string | null,"residence_country"?: string | null,"residence_state"?: string | null,"rsa_equity_use"?: string | null,"source_channel"?: string | null,"status"?: Database["public"]['Enums']["application_status"],"submitted_at"?: string | null,"target_exact_kobo"?: number | null,"target_value_max_kobo"?: number | null,"target_value_min_kobo"?: number | null,"timeline"?: string | null,"updated_at"?: string,"user_id"?: string | null,"utm"?: Json | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "applications_engine_version_fkey"
      columns: ["engine_version"]
isOneToOne: false
      referencedRelation: "engine_settings"
      referencedColumns: ["version"]
    },{
      foreignKeyName: "applications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"diff": Json | null,"entity": string,"entity_id": string,"id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"diff"?: Json | null,"entity": string,"entity_id": string,"id"?: number
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"diff"?: Json | null,"entity"?: string,"entity_id"?: string,"id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_log_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"consents": {
                  Row: {
                    "application_id": string | null,"consent_type": string,"created_at": string,"granted": boolean,"id": string,"ip": unknown,"user_agent": string | null,"user_id": string | null,"version": string
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id"?: string | null,"consent_type": string,"created_at"?: string,"granted": boolean,"id"?: string,"ip"?: unknown,"user_agent"?: string | null,"user_id"?: string | null,"version": string
                  }
                  Update: {
                    "application_id"?: string | null,"consent_type"?: string,"created_at"?: string,"granted"?: boolean,"id"?: string,"ip"?: unknown,"user_agent"?: string | null,"user_id"?: string | null,"version"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "consents_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consents_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"contact_messages": {
                  Row: {
                    "created_at": string,"email": string,"handled_at": string | null,"id": string,"message": string,"name": string,"phone": string | null,"topic": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email": string,"handled_at"?: string | null,"id"?: string,"message": string,"name": string,"phone"?: string | null,"topic": string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"handled_at"?: string | null,"id"?: string,"message"?: string,"name"?: string,"phone"?: string | null,"topic"?: string
                  }
                  Relationships: [
                    
                  ]
                },"engine_settings": {
                  Row: {
                    "affordability_den": number,"affordability_num": number,"created_at": string,"created_by": string | null,"deduct_obligations": boolean,"fx_haircut": number,"is_current": boolean,"match_weights": NonNullable<Json>,"max_age_at_maturity": number,"min_display_rounding_kobo": number,"min_useful_loan_kobo": number,"rates_snapshot": NonNullable<Json>,"repayment_method": string,"version": string
                  }
                  ComputedFields: never
                  Insert: {
                    "affordability_den"?: number,"affordability_num"?: number,"created_at"?: string,"created_by"?: string | null,"deduct_obligations"?: boolean,"fx_haircut"?: number,"is_current"?: boolean,"match_weights"?: NonNullable<Json>,"max_age_at_maturity"?: number,"min_display_rounding_kobo"?: number,"min_useful_loan_kobo"?: number,"rates_snapshot"?: NonNullable<Json>,"repayment_method"?: string,"version": string
                  }
                  Update: {
                    "affordability_den"?: number,"affordability_num"?: number,"created_at"?: string,"created_by"?: string | null,"deduct_obligations"?: boolean,"fx_haircut"?: number,"is_current"?: boolean,"match_weights"?: NonNullable<Json>,"max_age_at_maturity"?: number,"min_display_rounding_kobo"?: number,"min_useful_loan_kobo"?: number,"rates_snapshot"?: NonNullable<Json>,"repayment_method"?: string,"version"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "engine_settings_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"fx_rates": {
                  Row: {
                    "currency": string,"fetched_at": string,"live_rate_to_ngn": number,"source": string,"stressed_rate_to_ngn": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "currency": string,"fetched_at"?: string,"live_rate_to_ngn": number,"source": string,"stressed_rate_to_ngn"?: number | null
                  }
                  Update: {
                    "currency"?: string,"fetched_at"?: string,"live_rate_to_ngn"?: number,"source"?: string,"stressed_rate_to_ngn"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"lenders": {
                  Row: {
                    "active": boolean,"id": string,"licence_no": string | null,"name": string,"type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"id"?: string,"licence_no"?: string | null,"name": string,"type": string
                  }
                  Update: {
                    "active"?: boolean,"id"?: string,"licence_no"?: string | null,"name"?: string,"type"?: string
                  }
                  Relationships: [
                    
                  ]
                },"mortgage_cases": {
                  Row: {
                    "advisor_id": string | null,"application_id": string,"created_at": string,"decided_at": string | null,"disbursed_at": string | null,"id": string,"lender_id": string | null,"loan_amount_kobo": number | null,"product_code": string | null,"stage": Database["public"]['Enums']["case_stage"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "advisor_id"?: string | null,"application_id": string,"created_at"?: string,"decided_at"?: string | null,"disbursed_at"?: string | null,"id"?: string,"lender_id"?: string | null,"loan_amount_kobo"?: number | null,"product_code"?: string | null,"stage"?: Database["public"]['Enums']["case_stage"],"updated_at"?: string
                  }
                  Update: {
                    "advisor_id"?: string | null,"application_id"?: string,"created_at"?: string,"decided_at"?: string | null,"disbursed_at"?: string | null,"id"?: string,"lender_id"?: string | null,"loan_amount_kobo"?: number | null,"product_code"?: string | null,"stage"?: Database["public"]['Enums']["case_stage"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "mortgage_cases_advisor_id_fkey"
      columns: ["advisor_id"]
isOneToOne: false
      referencedRelation: "advisor_stats"
      referencedColumns: ["advisor_id"]
    },{
      foreignKeyName: "mortgage_cases_advisor_id_fkey"
      columns: ["advisor_id"]
isOneToOne: false
      referencedRelation: "advisors"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mortgage_cases_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mortgage_cases_lender_id_fkey"
      columns: ["lender_id"]
isOneToOne: false
      referencedRelation: "lenders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mortgage_cases_product_code_fkey"
      columns: ["product_code"]
isOneToOne: false
      referencedRelation: "rate_products"
      referencedColumns: ["code"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "application_id": string | null,"channel": string,"created_at": string,"id": string,"provider_message_id": string | null,"status": string,"template": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id"?: string | null,"channel": string,"created_at"?: string,"id"?: string,"provider_message_id"?: string | null,"status"?: string,"template": string,"user_id"?: string | null
                  }
                  Update: {
                    "application_id"?: string | null,"channel"?: string,"created_at"?: string,"id"?: string,"provider_message_id"?: string | null,"status"?: string,"template"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"payments": {
                  Row: {
                    "amount_minor": number,"created_at": string,"currency": string,"id": string,"paid_at": string | null,"provider": string,"provider_reference": string,"purpose": string,"raw": Json | null,"status": Database["public"]['Enums']["payment_status"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_minor": number,"created_at"?: string,"currency": string,"id"?: string,"paid_at"?: string | null,"provider": string,"provider_reference": string,"purpose": string,"raw"?: Json | null,"status"?: Database["public"]['Enums']["payment_status"],"user_id": string
                  }
                  Update: {
                    "amount_minor"?: number,"created_at"?: string,"currency"?: string,"id"?: string,"paid_at"?: string | null,"provider"?: string,"provider_reference"?: string,"purpose"?: string,"raw"?: Json | null,"status"?: Database["public"]['Enums']["payment_status"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"prequal_results": {
                  Row: {
                    "affordable_monthly_kobo": number,"application_id": string,"assessed_monthly_income_kobo": number,"capped": boolean,"created_at": string,"eligible": boolean,"engine_version": string,"equity_required_kobo": number,"first_monthly_repayment_kobo": number,"id": string,"interest_rate": number,"max_loan_kobo": number,"max_property_value_kobo": number,"notes": (string)[],"product_code": string,"rate_basis": string,"scenario": string,"tenor_months": number
                  }
                  ComputedFields: never
                  Insert: {
                    "affordable_monthly_kobo": number,"application_id": string,"assessed_monthly_income_kobo": number,"capped"?: boolean,"created_at"?: string,"eligible": boolean,"engine_version": string,"equity_required_kobo": number,"first_monthly_repayment_kobo": number,"id"?: string,"interest_rate": number,"max_loan_kobo": number,"max_property_value_kobo": number,"notes"?: (string)[],"product_code": string,"rate_basis": string,"scenario": string,"tenor_months": number
                  }
                  Update: {
                    "affordable_monthly_kobo"?: number,"application_id"?: string,"assessed_monthly_income_kobo"?: number,"capped"?: boolean,"created_at"?: string,"eligible"?: boolean,"engine_version"?: string,"equity_required_kobo"?: number,"first_monthly_repayment_kobo"?: number,"id"?: string,"interest_rate"?: number,"max_loan_kobo"?: number,"max_property_value_kobo"?: number,"notes"?: (string)[],"product_code"?: string,"rate_basis"?: string,"scenario"?: string,"tenor_months"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "prequal_results_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "prequal_results_engine_version_fkey"
      columns: ["engine_version"]
isOneToOne: false
      referencedRelation: "engine_settings"
      referencedColumns: ["version"]
    },{
      foreignKeyName: "prequal_results_product_code_fkey"
      columns: ["product_code"]
isOneToOne: false
      referencedRelation: "rate_products"
      referencedColumns: ["code"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string | null,"email_bounced_at": string | null,"email_verified_at": string | null,"first_name": string,"id": string,"last_name": string,"marketing_opt_in": boolean,"other_names": string | null,"phone_e164": string | null,"role": string,"title": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email"?: string | null,"email_bounced_at"?: string | null,"email_verified_at"?: string | null,"first_name": string,"id": string,"last_name": string,"marketing_opt_in"?: boolean,"other_names"?: string | null,"phone_e164"?: string | null,"role"?: string,"title"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string | null,"email_bounced_at"?: string | null,"email_verified_at"?: string | null,"first_name"?: string,"id"?: string,"last_name"?: string,"marketing_opt_in"?: boolean,"other_names"?: string | null,"phone_e164"?: string | null,"role"?: string,"title"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"rate_limits": {
                  Row: {
                    "count": number,"key": string,"window_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "count"?: number,"key": string,"window_start": string
                  }
                  Update: {
                    "count"?: number,"key"?: string,"window_start"?: string
                  }
                  Relationships: [
                    
                  ]
                },"rate_products": {
                  Row: {
                    "active": boolean,"category": string,"code": string,"effective_from": string,"eligibility": NonNullable<Json>,"equity_pct": number,"loan_cap_kobo": number | null,"max_tenor_years": number,"name": string,"rate_max": number,"rate_min": number,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"category": string,"code": string,"effective_from"?: string,"eligibility"?: NonNullable<Json>,"equity_pct"?: number,"loan_cap_kobo"?: number | null,"max_tenor_years": number,"name": string,"rate_max": number,"rate_min": number,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "active"?: boolean,"category"?: string,"code"?: string,"effective_from"?: string,"eligibility"?: NonNullable<Json>,"equity_pct"?: number,"loan_cap_kobo"?: number | null,"max_tenor_years"?: number,"name"?: string,"rate_max"?: number,"rate_min"?: number,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "rate_products_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"reference_counters": {
                  Row: {
                    "day": string,"last": number
                  }
                  ComputedFields: never
                  Insert: {
                    "day": string,"last"?: number
                  }
                  Update: {
                    "day"?: string,"last"?: number
                  }
                  Relationships: [
                    
                  ]
                },"reports": {
                  Row: {
                    "ai_model": string | null,"application_id": string,"attempts": number,"checks": Json | null,"created_at": string,"created_by": string | null,"downloaded_at": string | null,"emailed_at": string | null,"file_name": string,"generated_at": string | null,"id": string,"last_error": string | null,"nudge_sent_at": string | null,"opened_at": string | null,"page_count": number | null,"prompt_version": string | null,"reference_code": string,"report_number": number,"status": Database["public"]['Enums']["report_status"],"storage_path": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "ai_model"?: string | null,"application_id": string,"attempts"?: number,"checks"?: Json | null,"created_at"?: string,"created_by"?: string | null,"downloaded_at"?: string | null,"emailed_at"?: string | null,"file_name": string,"generated_at"?: string | null,"id"?: string,"last_error"?: string | null,"nudge_sent_at"?: string | null,"opened_at"?: string | null,"page_count"?: number | null,"prompt_version"?: string | null,"reference_code": string,"report_number": number,"status"?: Database["public"]['Enums']["report_status"],"storage_path"?: string | null
                  }
                  Update: {
                    "ai_model"?: string | null,"application_id"?: string,"attempts"?: number,"checks"?: Json | null,"created_at"?: string,"created_by"?: string | null,"downloaded_at"?: string | null,"emailed_at"?: string | null,"file_name"?: string,"generated_at"?: string | null,"id"?: string,"last_error"?: string | null,"nudge_sent_at"?: string | null,"opened_at"?: string | null,"page_count"?: number | null,"prompt_version"?: string | null,"reference_code"?: string,"report_number"?: number,"status"?: Database["public"]['Enums']["report_status"],"storage_path"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"reviews": {
                  Row: {
                    "advisor_id": string,"body": string | null,"created_at": string,"id": string,"published_at": string | null,"rating": number,"session_id": string,"status": Database["public"]['Enums']["review_status"],"title": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "advisor_id": string,"body"?: string | null,"created_at"?: string,"id"?: string,"published_at"?: string | null,"rating": number,"session_id": string,"status"?: Database["public"]['Enums']["review_status"],"title"?: string | null,"user_id": string
                  }
                  Update: {
                    "advisor_id"?: string,"body"?: string | null,"created_at"?: string,"id"?: string,"published_at"?: string | null,"rating"?: number,"session_id"?: string,"status"?: Database["public"]['Enums']["review_status"],"title"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_advisor_id_fkey"
      columns: ["advisor_id"]
isOneToOne: false
      referencedRelation: "advisor_stats"
      referencedColumns: ["advisor_id"]
    },{
      foreignKeyName: "reviews_advisor_id_fkey"
      columns: ["advisor_id"]
isOneToOne: false
      referencedRelation: "advisors"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_session_id_fkey"
      columns: ["session_id"]
isOneToOne: true
      referencedRelation: "advisory_sessions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "advisor_stats": {
                  Row: {
                    "advisor_id": string,"approval_rate": number | null,"avg_rating": number | null,"mortgages_approved": number | null,"mortgages_decided": number | null,"review_count": number | null,"sessions_completed": number | null
                  }
                  ComputedFields: never
                  Insert: {
                           "advisor_id"?: string | null,"approval_rate"?: never,"avg_rating"?: never,"mortgages_approved"?: never,"mortgages_decided"?: never,"review_count"?: never,"sessions_completed"?: never
                         }
                        Update: {
                           "advisor_id"?: string | null,"approval_rate"?: never,"avg_rating"?: never,"mortgages_approved"?: never,"mortgages_decided"?: never,"review_count"?: never,"sessions_completed"?: never
                         }
                        Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "advisor_can_see_application":
{ Args: { "p_application": string }; Returns: boolean
                           },
"enqueue_job":
{ Args: { "p_delay"?: number,"p_payload": Json,"p_queue": string }; Returns: number
                           },
"hit_rate_limit":
{ Args: { "p_key": string,"p_limit": number,"p_window_seconds": number }; Returns: boolean
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_staff":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"my_advisor_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"next_reference_code":
{ Args: { "p_initials": string }; Returns: string
                           }
          }
          Enums: {
            "advisor_status": "invited"|"pending_review"|"approved"|"suspended","application_status": "draft"|"submitted"|"estimated"|"claimed"|"report_sent"|"advisory_booked"|"in_processing"|"closed"|"abandoned","case_stage": "documents"|"submitted_to_lender"|"offer_received"|"property_appraisal"|"underwriting"|"approved"|"declined"|"disbursed"|"withdrawn","income_source_type": "salaried_public"|"salaried_private"|"self_employed"|"mixed"|"part_time_contract"|"pension"|"other"|"investment","payment_status": "initialised"|"success"|"failed"|"refunded","report_status": "queued"|"generating"|"ready"|"emailed"|"checks_failed"|"email_failed","residence_type": "nigeria"|"diaspora","review_status": "pending"|"published"|"rejected","session_status": "pending_payment"|"confirmed"|"rescheduled"|"completed"|"no_show"|"cancelled"|"refunded"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "advisor_status": ["invited", "pending_review", "approved", "suspended"],"application_status": ["draft", "submitted", "estimated", "claimed", "report_sent", "advisory_booked", "in_processing", "closed", "abandoned"],"case_stage": ["documents", "submitted_to_lender", "offer_received", "property_appraisal", "underwriting", "approved", "declined", "disbursed", "withdrawn"],"income_source_type": ["salaried_public", "salaried_private", "self_employed", "mixed", "part_time_contract", "pension", "other", "investment"],"payment_status": ["initialised", "success", "failed", "refunded"],"report_status": ["queued", "generating", "ready", "emailed", "checks_failed", "email_failed"],"residence_type": ["nigeria", "diaspora"],"review_status": ["pending", "published", "rejected"],"session_status": ["pending_payment", "confirmed", "rescheduled", "completed", "no_show", "cancelled", "refunded"]
          }
        }
} as const
