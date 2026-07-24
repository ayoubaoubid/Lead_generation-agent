import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { aiAgentIds, commercialSkillIds } from "@/domain/ai/commercial-skill";
import { aiAgentRegistry } from "@/services/ai/agent-registry";
import { commercialSkillRegistry } from "@/services/ai/commercial-skill-registry";

const repositoryRoot = resolve(process.cwd(), "../..");

function repositoryFile(relativePath: string): string {
  return readFileSync(resolve(repositoryRoot, relativePath), "utf8");
}

describe("versioned skill catalog files", () => {
  it("provides all required documentation, prompt and eval files", () => {
    const requiredSections = [
      "## Mission",
      "## Cas d’utilisation",
      "## Entrées",
      "## Sorties",
      "## Règles",
      "## Actions interdites",
      "## Agents utilisateurs",
      "## Tests attendus",
    ];

    for (const skillId of commercialSkillIds) {
      const definition = commercialSkillRegistry[skillId];
      expect(definition.version).toBe("1.0.0");
      expect(definition.promptVersion).toBe("1");
      expect(definition.limits.maxOutputTokens).toBeGreaterThan(0);
      expect(definition.limits.timeoutMs).toBeGreaterThan(0);
      const skillDirectory = definition.promptPath.replace(
        /\/prompts\/system\.v1\.md$/u,
        "",
      );
      const skillMarkdown = repositoryFile(`${skillDirectory}/SKILL.md`);
      const prompt = repositoryFile(definition.promptPath);
      const evals = JSON.parse(
        repositoryFile(`${skillDirectory}/evals/evals.json`),
      ) as {
        skill_name: string;
        evals: readonly unknown[];
      };

      expect(skillMarkdown).toMatch(
        new RegExp(`^---\\nname: ${skillId}\\ndescription: .+\\n---`, "u"),
      );
      for (const section of requiredSections) {
        expect(skillMarkdown).toContain(section);
      }
      expect(prompt).toContain("system prompt v1");
      expect(prompt.toLowerCase()).toContain("structuré");
      expect(evals.skill_name).toBe(skillId);
      expect(evals.evals).toHaveLength(2);
    }
  });

  it("keeps the file-based agent allowlists aligned with TypeScript", () => {
    const catalog = JSON.parse(
      repositoryFile(".codex/agents/catalog.v1.json"),
    ) as {
      version: string;
      agents: readonly {
        id: (typeof aiAgentIds)[number];
        version: string;
        allowedSkills: readonly string[];
      }[];
    };

    expect(catalog.version).toBe("1.0.0");
    expect(catalog.agents.map((agent) => agent.id)).toEqual(aiAgentIds);

    for (const agent of catalog.agents) {
      expect(agent.version).toBe(aiAgentRegistry[agent.id].version);
      expect(agent.allowedSkills).toEqual(
        aiAgentRegistry[agent.id].allowedSkills,
      );
    }
  });

  it("does not contain common secret assignments in the AI catalog", () => {
    for (const skillId of commercialSkillIds) {
      const definition = commercialSkillRegistry[skillId];
      const skillDirectory = definition.promptPath.replace(
        /\/prompts\/system\.v1\.md$/u,
        "",
      );
      const combined = [
        repositoryFile(`${skillDirectory}/SKILL.md`),
        repositoryFile(definition.promptPath),
        repositoryFile(`${skillDirectory}/evals/evals.json`),
      ].join("\n");

      expect(combined).not.toMatch(
        /(api[_-]?key|secret|token)\s*[:=]\s*["'][^"']+["']/iu,
      );
    }
  });
});
