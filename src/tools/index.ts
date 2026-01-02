// src/tools/index.ts

import type { Tool, AgentType } from "../agent/types.js";
import { AGENT_TYPES } from "../agent/config.js";
import { bashTool, runBash } from "./bash.js";
import { readFileTool, writeFileTool, editFileTool, runRead, runWrite, runEdit } from "./file.js";
import { todoTool, TodoManager } from "./todo.js";
import { SkillLoader, createSkillTool, runSkill } from "./skill.js";

export const BASE_TOOLS: Tool[] = [bashTool, readFileTool, writeFileTool, editFileTool, todoTool];

export interface ToolContext {
  workDir: string;
  todoManager: TodoManager;
  skillLoader: SkillLoader;
}

export function getAllTools(skillLoader: SkillLoader): Tool[] {
  return [
    ...BASE_TOOLS,
    createTaskTool(),
    createSkillTool(skillLoader),
  ];
}

export function getToolsForAgent(agentType: AgentType): Tool[] {
  const allowed = AGENT_TYPES[agentType].tools;
  if (allowed === "*") return BASE_TOOLS;
  return BASE_TOOLS.filter((t) => allowed.includes(t.name));
}

function createTaskTool(): Tool {
  const agentDescriptions = Object.entries(AGENT_TYPES)
    .map(([name, cfg]) => `- ${name}: ${cfg.description}`)
    .join("\n");

  return {
    name: "Task",
    description: `Spawn a subagent for a focused subtask.\n\nAgent types:\n${agentDescriptions}`,
    input_schema: {
      type: "object",
      properties: {
        description: { type: "string", description: "Short task description (3-5 words)" },
        prompt: { type: "string", description: "Detailed instructions for the subagent" },
        agent_type: { type: "string", enum: Object.keys(AGENT_TYPES) },
      },
      required: ["description", "prompt", "agent_type"],
    },
  };
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  context: ToolContext,
  runSubagent?: (desc: string, prompt: string, type: AgentType) => Promise<string>
): Promise<string> {
  switch (name) {
    case "bash":
      return runBash(args.command as string, context.workDir);

    case "read_file":
      return runRead(args.path as string, context.workDir, args.limit as number | undefined);

    case "write_file":
      return runWrite(args.path as string, args.content as string, context.workDir);

    case "edit_file":
      return runEdit(args.path as string, args.old_text as string, args.new_text as string, context.workDir);

    case "TodoWrite":
      try {
        return context.todoManager.update(args.items as any[]);
      } catch (e) {
        return `Error: ${e instanceof Error ? e.message : String(e)}`;
      }

    case "Skill":
      return runSkill(args.skill as string, context.skillLoader);

    case "Task":
      if (!runSubagent) return "Error: Subagent not available";
      return runSubagent(
        args.description as string,
        args.prompt as string,
        args.agent_type as AgentType
      );

    default:
      return `Unknown tool: ${name}`;
  }
}

export { TodoManager } from "./todo.js";
export { SkillLoader } from "./skill.js";
