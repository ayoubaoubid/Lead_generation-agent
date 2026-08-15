import "server-only";

import { DomainError } from "@/domain/errors/domain-error";
import { resolveActiveClientTenant } from "@/lib/tenancy/server-tenant-context";

function failure(error: unknown, fallback: string) {
  return {
    ok: false as const,
    message: error instanceof DomainError ? error.publicMessage : fallback,
  };
}

export async function getIntegrationsData() {
  try {
    const { supabase, tenant } =
      await resolveActiveClientTenant("settings.read");
    const [domains, accounts, checks, calendars] = await Promise.all([
      supabase
        .from("sending_domains")
        .select("id,domain,status,last_checked_at")
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId)
        .is("archived_at", null)
        .order("created_at"),
      supabase
        .from("sending_accounts")
        .select(
          "id,email_address,provider,status,timezone,daily_limit,sent_today,bounce_rate,complaint_rate,last_connection_test_at",
        )
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId)
        .is("archived_at", null)
        .order("created_at"),
      supabase
        .from("deliverability_checks")
        .select("id,kind,status,is_critical,checked_at")
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId)
        .order("checked_at", { ascending: false })
        .limit(50),
      supabase
        .from("calendar_connections")
        .select("id,provider,status,timezone,last_sync_at,last_error_code")
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId)
        .is("archived_at", null)
        .order("created_at"),
    ]);
    const firstError =
      domains.error ?? accounts.error ?? checks.error ?? calendars.error;
    if (firstError) throw firstError;
    return {
      ok: true as const,
      data: {
        domains: domains.data ?? [],
        accounts: accounts.data ?? [],
        checks: checks.data ?? [],
        calendars: calendars.data ?? [],
      },
    };
  } catch (error) {
    return failure(
      error,
      "Les intégrations sont temporairement indisponibles.",
    );
  }
}

export async function getInboxData() {
  try {
    const { supabase, tenant } = await resolveActiveClientTenant("reply.read");
    const response = await supabase
      .from("inbound_messages")
      .select(
        "id,sender_address,subject,body_text,received_at,category,classification_confidence,classification_explanation,review_status",
      )
      .eq("agency_id", tenant.agencyId)
      .eq("client_id", tenant.clientId)
      .order("received_at", { ascending: false })
      .limit(100);
    if (response.error) throw response.error;
    return { ok: true as const, data: response.data };
  } catch (error) {
    return failure(error, "La boîte de réception est indisponible.");
  }
}

export async function getMeetingsData() {
  try {
    const { supabase, tenant } =
      await resolveActiveClientTenant("meeting.read");
    const response = await supabase
      .from("meetings")
      .select(
        "id,title,status,starts_at,ends_at,timezone,video_url,contact_id,campaign_id",
      )
      .eq("agency_id", tenant.agencyId)
      .eq("client_id", tenant.clientId)
      .order("starts_at")
      .limit(100);
    if (response.error) throw response.error;
    return { ok: true as const, data: response.data };
  } catch (error) {
    return failure(error, "Les rendez-vous sont indisponibles.");
  }
}

export async function getPipelineData() {
  try {
    const { supabase, tenant } =
      await resolveActiveClientTenant("pipeline.read");
    const [stages, opportunities] = await Promise.all([
      supabase
        .from("pipeline_stages")
        .select("id,code,name,position,default_probability,is_closed")
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId)
        .eq("active", true)
        .order("position"),
      supabase
        .from("opportunities")
        .select(
          "id,stage_id,title,status,value_amount,currency,probability,next_action,next_action_due_at,updated_at",
        )
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId)
        .is("archived_at", null)
        .order("updated_at", { ascending: false }),
    ]);
    if (stages.error || opportunities.error)
      throw stages.error ?? opportunities.error;
    return {
      ok: true as const,
      data: { stages: stages.data, opportunities: opportunities.data },
    };
  } catch (error) {
    return failure(error, "Le pipeline est indisponible.");
  }
}

export async function getAnalyticsData() {
  try {
    const { supabase, tenant } =
      await resolveActiveClientTenant("analytics.read");
    const end = new Date();
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 29);
    const response = await supabase.rpc("get_client_funnel_analytics", {
      requested_agency_id: tenant.agencyId,
      requested_client_id: tenant.clientId,
      requested_period_start: start.toISOString().slice(0, 10),
      requested_period_end: end.toISOString().slice(0, 10),
    });
    if (response.error) throw response.error;
    const data =
      response.data &&
      !Array.isArray(response.data) &&
      typeof response.data === "object"
        ? response.data
        : {};
    return { ok: true as const, data };
  } catch (error) {
    return failure(error, "Les analytics sont indisponibles.");
  }
}

export async function getComplianceData() {
  try {
    const { supabase, tenant } =
      await resolveActiveClientTenant("compliance.read");
    const [profile, suppressions, requests] = await Promise.all([
      supabase
        .from("client_compliance_profiles")
        .select(
          "purpose,legal_basis,audience_type,countries,channels,retention_days,configuration_status,legal_reviewed_at",
        )
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId)
        .maybeSingle(),
      supabase
        .from("suppression_entries")
        .select("id,masked_email,reason,scope,effective_at")
        .eq("agency_id", tenant.agencyId)
        .or(`client_id.eq.${tenant.clientId},client_id.is.null`)
        .order("effective_at", { ascending: false })
        .limit(100),
      supabase
        .from("data_subject_requests")
        .select("id,request_type,status,due_at,created_at")
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    if (profile.error || suppressions.error || requests.error)
      throw profile.error ?? suppressions.error ?? requests.error;
    return {
      ok: true as const,
      data: {
        profile: profile.data,
        suppressions: suppressions.data,
        requests: requests.data,
      },
    };
  } catch (error) {
    return failure(error, "Le module conformité est indisponible.");
  }
}

export async function getOperationalCenterData() {
  try {
    const { supabase, tenant } = await resolveActiveClientTenant("audit.read");
    const [
      failedTasks,
      disconnectedAccounts,
      disconnectedCalendars,
      pausedCampaigns,
      highBounceAccounts,
      quotaAccounts,
      providerFailures,
      pendingReviews,
    ] = await Promise.all([
      supabase
        .from("async_task_runs")
        .select("id,task_id,error_code,updated_at")
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId)
        .eq("status", "failed")
        .order("updated_at", { ascending: false })
        .limit(20),
      supabase
        .from("sending_accounts")
        .select("id,email_address,status,last_connection_error_code")
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId)
        .in("status", ["degraded", "disconnected"]),
      supabase
        .from("calendar_connections")
        .select("id,provider,status,last_error_code")
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId)
        .in("status", ["degraded", "disconnected"]),
      supabase
        .from("campaigns")
        .select("id,name,status,updated_at")
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId)
        .eq("status", "paused"),
      supabase
        .from("sending_accounts")
        .select("id,email_address,bounce_rate,status")
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId)
        .gte("bounce_rate", 0.05),
      supabase
        .from("sending_accounts")
        .select("id,email_address,sent_today,daily_limit,status")
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId),
      supabase
        .from("provider_operations")
        .select("id,operation_kind,provider,error_code,updated_at")
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId)
        .eq("status", "failed")
        .order("updated_at", { ascending: false })
        .limit(20),
      supabase
        .from("campaign_message_versions")
        .select("id,status,updated_at")
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId)
        .eq("status", "human_review_pending"),
    ]);

    const firstError = [
      failedTasks,
      disconnectedAccounts,
      disconnectedCalendars,
      pausedCampaigns,
      highBounceAccounts,
      quotaAccounts,
      providerFailures,
      pendingReviews,
    ].find((response) => response.error)?.error;
    if (firstError) throw firstError;

    return {
      ok: true as const,
      data: {
        failedTasks: failedTasks.data ?? [],
        disconnectedAccounts: disconnectedAccounts.data ?? [],
        disconnectedCalendars: disconnectedCalendars.data ?? [],
        pausedCampaigns: pausedCampaigns.data ?? [],
        highBounceAccounts: highBounceAccounts.data ?? [],
        quotaAccounts: (quotaAccounts.data ?? []).filter(
          (account) => account.sent_today >= account.daily_limit,
        ),
        providerFailures: providerFailures.data ?? [],
        pendingReviews: pendingReviews.data ?? [],
      },
    };
  } catch (error) {
    return failure(error, "Le centre opérationnel est indisponible.");
  }
}
