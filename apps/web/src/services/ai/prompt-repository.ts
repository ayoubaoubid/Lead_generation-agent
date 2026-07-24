export type PromptReference = Readonly<{
  skillId: string;
  skillVersion: string;
  promptVersion: string;
  path: string;
}>;

export interface PromptRepository {
  load(reference: PromptReference): Promise<string>;
}
