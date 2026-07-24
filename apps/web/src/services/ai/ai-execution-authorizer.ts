import type {
  AiAgentId,
  CommercialSkillId,
} from "@/domain/ai/commercial-skill";
import type { ServiceContext } from "@/services/service-context";

export interface AiExecutionAuthorizer {
  assertCanExecute(
    request: Readonly<{
      agentId: AiAgentId;
      skillId: CommercialSkillId;
    }>,
    context: ServiceContext,
  ): Promise<void>;
}
