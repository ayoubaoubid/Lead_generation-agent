import type { AiExecutionResult } from "@/domain/ai/ai-execution";
import { AiExecutionError } from "@/domain/ai/ai-execution";
import type { ServiceContext } from "@/services/service-context";
import {
  campaignMessageGenerationInputSchema,
  type CampaignMessageGenerationInput,
} from "@/validations/messages/campaign-message.schema";
import { commercialSkillSchemas } from "@/validations/ai/commercial-skill.schemas";

type SkillRunner = Readonly<{
  execute(
    command: Readonly<{
      agentId:
        "personalization-agent" | "message-quality-agent" | "compliance-agent";
      skillId:
        | "cold-email-personalization"
        | "made-to-stick"
        | "message-compliance-review";
      input: unknown;
    }>,
    context: ServiceContext,
  ): Promise<AiExecutionResult>;
}>;

type GenerationResult =
  | Readonly<{
      status: "human_review_pending";
      personalization: AiExecutionResult;
      quality: AiExecutionResult;
      compliance: AiExecutionResult;
      variant: {
        subject: string;
        body: string;
        mainIdea: string;
        callToAction: string;
        wordCount: number;
        usedStatements: unknown;
        missingEvidence: readonly string[];
      };
    }>
  | Readonly<{
      status: "requires_revision" | "rejected";
      stage: "quality" | "compliance";
      personalization: AiExecutionResult;
      review: AiExecutionResult;
    }>;

export class CampaignMessageGenerationService {
  constructor(private readonly skillRunner: SkillRunner) {}

  async generate(
    rawInput: CampaignMessageGenerationInput,
    context: ServiceContext,
  ): Promise<GenerationResult> {
    const input = campaignMessageGenerationInputSchema.parse(rawInput);
    const personalization = await this.skillRunner.execute(
      {
        agentId: "personalization-agent",
        skillId: "cold-email-personalization",
        input: {
          objective: input.objective,
          knownStatements: input.knownStatements,
          evidenceReferences: input.evidenceReferences,
          constraints: input.constraints,
          validatedPositioning: input.validatedPositioning,
          validatedOffer: input.validatedOffer,
          language: input.language,
          tone: input.tone,
          mainIdea: input.mainIdea,
          callToAction: input.callToAction,
          prospectStatements: input.knownStatements,
        },
      },
      context,
    );
    const variantResult = commercialSkillSchemas[
      "cold-email-personalization"
    ].output.safeParse(personalization.output);
    if (!variantResult.success) {
      throw new AiExecutionError(
        "output_invalid",
        "The personalization output is invalid.",
        false,
        variantResult.error,
      );
    }
    const variant = variantResult.data;

    const quality = await this.skillRunner.execute(
      {
        agentId: "message-quality-agent",
        skillId: "made-to-stick",
        input: {
          objective: "Review the exact campaign message before compliance.",
          knownStatements: input.knownStatements,
          evidenceReferences: input.evidenceReferences,
          constraints: input.constraints,
          content: `${variant.subject}\n\n${variant.body}`,
          format: "cold_email",
          intendedAudience: input.intendedAudience,
        },
      },
      context,
    );
    const qualityResult = commercialSkillSchemas[
      "made-to-stick"
    ].output.safeParse(quality.output);
    if (!qualityResult.success) {
      throw new AiExecutionError(
        "output_invalid",
        "The quality review output is invalid.",
        false,
        qualityResult.error,
      );
    }
    if (qualityResult.data.decision !== "approve") {
      return {
        status:
          qualityResult.data.decision === "reject"
            ? "rejected"
            : "requires_revision",
        stage: "quality",
        personalization,
        review: quality,
      };
    }

    const compliance = await this.skillRunner.execute(
      {
        agentId: "compliance-agent",
        skillId: "message-compliance-review",
        input: {
          objective: "Identify compliance blockers before human review.",
          knownStatements: input.knownStatements,
          evidenceReferences: input.evidenceReferences,
          constraints: input.constraints,
          content: `${variant.subject}\n\n${variant.body}`,
          recipientCountry: input.recipientCountry,
          senderIdentity: input.senderIdentity,
          suppressionStatus: input.suppressionStatus,
          processingJustificationDocumented:
            input.processingJustificationDocumented,
          policyVersion: input.compliancePolicyVersion,
        },
      },
      context,
    );
    const complianceResult = commercialSkillSchemas[
      "message-compliance-review"
    ].output.safeParse(compliance.output);
    if (!complianceResult.success) {
      throw new AiExecutionError(
        "output_invalid",
        "The compliance review output is invalid.",
        false,
        complianceResult.error,
      );
    }
    if (complianceResult.data.decision !== "approve") {
      return {
        status:
          complianceResult.data.decision === "reject"
            ? "rejected"
            : "requires_revision",
        stage: "compliance",
        personalization,
        review: compliance,
      };
    }

    return {
      status: "human_review_pending",
      personalization,
      quality,
      compliance,
      variant: {
        subject: variant.subject,
        body: variant.body,
        mainIdea: variant.mainIdea,
        callToAction: variant.callToAction,
        wordCount: variant.wordCount,
        usedStatements: variant.usedStatements,
        missingEvidence: variant.missingEvidence,
      },
    };
  }
}
