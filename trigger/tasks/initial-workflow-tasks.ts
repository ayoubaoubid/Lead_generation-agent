import { schemaTask } from "@trigger.dev/sdk";

import type { Json } from "../../apps/web/src/types/database.generated";
import {
  DurableTaskError,
  durableTaskCatchError,
  executeDurableTask,
  type VerifiedTaskResource,
} from "../lib/durable-task";
import {
  durableTaskPayloadSchema,
  triggerRetryPolicy,
  type DurableTaskPayload,
} from "../lib/task-payload";
import type { TriggerSupabaseClient } from "../lib/supabase-worker";

type ResourceLoader = (
  client: TriggerSupabaseClient,
  id: string,
) => Promise<VerifiedTaskResource>;

const queues = {
  enrichment: { name: "enrichment", concurrencyLimit: 10 },
  verification: { name: "verification", concurrencyLimit: 15 },
  qualification: { name: "qualification", concurrencyLimit: 10 },
  generation: { name: "campaign-generation", concurrencyLimit: 5 },
  campaign: { name: "campaign-control", concurrencyLimit: 10 },
  inbound: { name: "inbound-replies", concurrencyLimit: 10 },
  reports: { name: "reports", concurrencyLimit: 3 },
} as const;

async function loadCompany(
  client: TriggerSupabaseClient,
  id: string,
): Promise<VerifiedTaskResource> {
  const response = await client
    .from("companies")
    .select("agency_id,client_id,created_by")
    .eq("id", id)
    .single();
  if (response.error) throw response.error;
  return {
    agencyId: response.data.agency_id,
    clientId: response.data.client_id,
    createdBy: response.data.created_by,
    resourceType: "company",
  };
}

async function loadContact(
  client: TriggerSupabaseClient,
  id: string,
): Promise<VerifiedTaskResource> {
  const response = await client
    .from("contacts")
    .select("agency_id,client_id,created_by")
    .eq("id", id)
    .single();
  if (response.error) throw response.error;
  return {
    agencyId: response.data.agency_id,
    clientId: response.data.client_id,
    createdBy: response.data.created_by,
    resourceType: "contact",
  };
}

async function loadCampaign(
  client: TriggerSupabaseClient,
  id: string,
): Promise<VerifiedTaskResource> {
  const response = await client
    .from("campaigns")
    .select("agency_id,client_id,created_by")
    .eq("id", id)
    .single();
  if (response.error) throw response.error;
  return {
    agencyId: response.data.agency_id,
    clientId: response.data.client_id,
    createdBy: response.data.created_by,
    resourceType: "campaign",
  };
}

async function loadOutboundMessage(
  client: TriggerSupabaseClient,
  id: string,
): Promise<VerifiedTaskResource> {
  const response = await client
    .from("outbound_messages")
    .select("agency_id,client_id,created_by")
    .eq("id", id)
    .single();
  if (response.error) throw response.error;
  return {
    agencyId: response.data.agency_id,
    clientId: response.data.client_id,
    createdBy: response.data.created_by,
    resourceType: "outbound_message",
  };
}

async function loadCampaignProspect(
  client: TriggerSupabaseClient,
  id: string,
): Promise<VerifiedTaskResource> {
  const response = await client
    .from("campaign_prospects")
    .select("agency_id,client_id,campaign_id")
    .eq("id", id)
    .single();
  if (response.error) throw response.error;
  const campaign = await client
    .from("campaigns")
    .select("created_by")
    .eq("id", response.data.campaign_id)
    .eq("agency_id", response.data.agency_id)
    .eq("client_id", response.data.client_id)
    .single();
  if (campaign.error) throw campaign.error;
  return {
    agencyId: response.data.agency_id,
    clientId: response.data.client_id,
    createdBy: campaign.data.created_by,
    resourceType: "campaign_prospect",
  };
}

async function loadInboundWebhook(
  client: TriggerSupabaseClient,
  id: string,
): Promise<VerifiedTaskResource> {
  const response = await client
    .from("inbound_webhook_events")
    .select("agency_id,client_id")
    .eq("id", id)
    .single();
  if (response.error) throw response.error;
  if (!response.data.agency_id || !response.data.client_id) {
    throw new DurableTaskError(
      "INBOUND_TENANT_UNRESOLVED",
      "intervention_required",
      "Le tenant du webhook entrant n’est pas encore résolu.",
    );
  }
  const clientRow = await client
    .from("clients")
    .select("created_by")
    .eq("agency_id", response.data.agency_id)
    .eq("id", response.data.client_id)
    .single();
  if (clientRow.error || !clientRow.data.created_by) {
    throw (
      clientRow.error ??
      new DurableTaskError(
        "INBOUND_ACTOR_UNRESOLVED",
        "intervention_required",
        "L’acteur d’origine du webhook n’est pas résolu.",
      )
    );
  }
  return {
    agencyId: response.data.agency_id,
    clientId: response.data.client_id,
    createdBy: clientRow.data.created_by,
    resourceType: "inbound_webhook_event",
  };
}

async function loadClient(
  client: TriggerSupabaseClient,
  id: string,
): Promise<VerifiedTaskResource> {
  const response = await client
    .from("clients")
    .select("agency_id,id,created_by")
    .eq("id", id)
    .single();
  if (response.error || !response.data.created_by) {
    throw (
      response.error ??
      new DurableTaskError(
        "REPORT_ACTOR_UNRESOLVED",
        "intervention_required",
        "L’acteur du rapport quotidien n’est pas résolu.",
      )
    );
  }
  return {
    agencyId: response.data.agency_id,
    clientId: response.data.id,
    createdBy: response.data.created_by,
    resourceType: "client",
  };
}

function deferredExecution(moduleName: string) {
  return async (): Promise<{
    result: Readonly<Record<string, Json | undefined>>;
  }> => {
    throw new DurableTaskError(
      "MODULE_ADAPTER_NOT_CONFIGURED",
      "intervention_required",
      `Le module ${moduleName} est installé, mais son fournisseur réel n’est pas configuré.`,
    );
  };
}

function createDurableWorkflowTask(
  id: string,
  loader: ResourceLoader,
  queue: Readonly<{ name: string; concurrencyLimit: number }>,
  maxDuration: number,
  execute = deferredExecution(id),
) {
  return schemaTask({
    id,
    schema: durableTaskPayloadSchema,
    queue,
    retry: triggerRetryPolicy,
    maxDuration,
    catchError: durableTaskCatchError,
    run: async (payload: DurableTaskPayload, { ctx }) =>
      executeDurableTask({
        taskId: id,
        triggerRunId: ctx.run.id,
        payload,
        loadResource: loader,
        execute,
      }),
  });
}

export const enrichCompany = createDurableWorkflowTask(
  "enrichment.enrichCompany",
  loadCompany,
  queues.enrichment,
  300,
);
export const enrichContact = createDurableWorkflowTask(
  "enrichment.enrichContact",
  loadContact,
  queues.enrichment,
  300,
);
export const verifyEmail = createDurableWorkflowTask(
  "verification.verifyEmail",
  loadContact,
  queues.verification,
  180,
);
export const calculateScores = createDurableWorkflowTask(
  "qualification.calculateScores",
  loadContact,
  queues.qualification,
  180,
);
export const generateMessages = createDurableWorkflowTask(
  "campaign.generateMessages",
  loadCampaign,
  queues.generation,
  600,
);
export const prepareRecipients = createDurableWorkflowTask(
  "campaign.prepareRecipients",
  loadCampaign,
  queues.campaign,
  300,
);
export const scheduleMessage = createDurableWorkflowTask(
  "campaign.scheduleMessage",
  loadOutboundMessage,
  queues.campaign,
  180,
);
export const stopSequence = createDurableWorkflowTask(
  "campaign.stopSequence",
  loadCampaignProspect,
  queues.campaign,
  120,
);
export const processInbound = createDurableWorkflowTask(
  "reply.processInbound",
  loadInboundWebhook,
  queues.inbound,
  300,
);
export const generateDailyReport = createDurableWorkflowTask(
  "report.generateDaily",
  loadClient,
  queues.reports,
  600,
);
