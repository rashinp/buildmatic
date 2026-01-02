// src/tools/skill.ts

import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import type { Tool, Skill } from "../agent/types.js";

export class SkillLoader {
  private skills: Map<string, Skill> = new Map();

  constructor(private skillsDir: string) {
    this.loadSkills();
  }

  private parseSkillMd(path: string): Skill | null {
    const content = readFileSync(path, "utf-8");
    const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);

    if (!match) return null;

    const [, frontmatter, body] = match;
    const metadata: Record<string, string> = {};

    for (const line of frontmatter.split("\n")) {
      const colonIndex = line.indexOf(":");
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, "");
        metadata[key] = value;
      }
    }

    if (!metadata.name || !metadata.description) return null;

    return {
      name: metadata.name,
      description: metadata.description,
      body: body.trim(),
      path,
      dir: join(path, ".."),
    };
  }

  private loadSkills(): void {
    if (!existsSync(this.skillsDir)) return;

    for (const entry of readdirSync(this.skillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;

      const skillMd = join(this.skillsDir, entry.name, "SKILL.md");
      if (!existsSync(skillMd)) continue;

      const skill = this.parseSkillMd(skillMd);
      if (skill) {
        this.skills.set(skill.name, skill);
      }
    }
  }

  getDescriptions(): string {
    if (this.skills.size === 0) return "(no skills available)";

    return Array.from(this.skills.entries())
      .map(([name, skill]) => `- ${name}: ${skill.description}`)
      .join("\n");
  }

  getSkillContent(name: string): string | null {
    const skill = this.skills.get(name);
    if (!skill) return null;

    let content = `# Skill: ${skill.name}\n\n${skill.body}`;

    // Check for resources
    const resources: string[] = [];
    for (const folder of ["scripts", "references", "assets"]) {
      const folderPath = join(skill.dir, folder);
      if (existsSync(folderPath)) {
        const files = readdirSync(folderPath);
        if (files.length > 0) {
          resources.push(`${folder}: ${files.join(", ")}`);
        }
      }
    }

    if (resources.length > 0) {
      content += `\n\n**Available resources in ${skill.dir}:**\n`;
      content += resources.map((r) => `- ${r}`).join("\n");
    }

    return content;
  }

  listSkills(): string[] {
    return Array.from(this.skills.keys());
  }
}

export function createSkillTool(loader: SkillLoader): Tool {
  return {
    name: "Skill",
    description: `Load a skill for specialized knowledge.\n\nAvailable skills:\n${loader.getDescriptions()}`,
    input_schema: {
      type: "object",
      properties: {
        skill: { type: "string", description: "Name of the skill to load" },
      },
      required: ["skill"],
    },
  };
}

export function runSkill(skillName: string, loader: SkillLoader): string {
  const content = loader.getSkillContent(skillName);

  if (!content) {
    const available = loader.listSkills().join(", ") || "none";
    return `Error: Unknown skill '${skillName}'. Available: ${available}`;
  }

  return `<skill-loaded name="${skillName}">\n${content}\n</skill-loaded>\n\nFollow the instructions in the skill above.`;
}

export const skillTool: Tool = {
  name: "Skill",
  description: "Load a skill for specialized knowledge.",
  input_schema: {
    type: "object",
    properties: {
      skill: { type: "string", description: "Name of the skill to load" },
    },
    required: ["skill"],
  },
};
