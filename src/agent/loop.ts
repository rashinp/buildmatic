// src/agent/loop.ts

import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";
import type { AgentConfig, AgentEvent, AgentType } from "./types.js";
import { AGENT_TYPES } from "./config.js";
import { getAllTools, getToolsForAgent, executeTool, ToolContext, TodoManager, SkillLoader } from "../tools/index.js";

export interface AgentOptions {
  config: AgentConfig;
  onEvent?: (event: AgentEvent) => void;
}

export async function runAgent(
  messages: MessageParam[],
  options: AgentOptions
): Promise<MessageParam[]> {
  const { config, onEvent } = options;

  const client = config.baseUrl
    ? new Anthropic({ apiKey: config.apiKey, baseURL: config.baseUrl })
    : new Anthropic({ apiKey: config.apiKey });

  const todoManager = new TodoManager();
  const skillLoader = new SkillLoader(config.skillsDir);

  const context: ToolContext = {
    workDir: config.workDir,
    todoManager,
    skillLoader,
  };

  const tools = getAllTools(skillLoader);

  const systemPrompt = `You are a coding agent at ${config.workDir}.

Loop: plan -> act with tools -> report.

**Skills available** (invoke with Skill tool when task matches):
${skillLoader.getDescriptions()}

**Subagents available** (invoke with Task tool for focused subtasks):
${Object.entries(AGENT_TYPES).map(([n, c]) => `- ${n}: ${c.description}`).join("\n")}

Rules:
- Use Skill tool IMMEDIATELY when a task matches a skill description
- Use Task tool for subtasks needing focused exploration or implementation
- Use TodoWrite to track multi-step work
- Prefer tools over prose. Act, don't just explain.
- After finishing, summarize what changed.`;

  const emit = (event: AgentEvent) => onEvent?.(event);

  const runSubagent = async (description: string, prompt: string, agentType: AgentType): Promise<string> => {
    const subConfig = AGENT_TYPES[agentType];
    const subTools = getToolsForAgent(agentType);
    const subSystem = `You are a ${agentType} subagent at ${config.workDir}.\n\n${subConfig.prompt}\n\nComplete the task and return a clear, concise summary.`;

    let subMessages: MessageParam[] = [{ role: "user", content: prompt }];

    emit({ type: "text", data: { content: `[${agentType}] ${description}` } });

    while (true) {
      const response = await client.messages.create({
        model: config.model,
        system: subSystem,
        messages: subMessages,
        tools: subTools,
        max_tokens: 8000,
      });

      if (response.stop_reason !== "tool_use") {
        const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
        return textBlock?.text || "(subagent returned no text)";
      }

      const toolCalls = response.content.filter((b): b is ToolUseBlock => b.type === "tool_use");
      const results = [];

      for (const tc of toolCalls) {
        const output = await executeTool(tc.name, tc.input as Record<string, unknown>, context);
        results.push({ type: "tool_result" as const, tool_use_id: tc.id, content: output });
      }

      subMessages.push({ role: "assistant", content: response.content });
      subMessages.push({ role: "user", content: results });
    }
  };

  while (true) {
    const response = await client.messages.create({
      model: config.model,
      system: systemPrompt,
      messages,
      tools,
      max_tokens: 8000,
    });

    // Process response content
    for (const block of response.content) {
      if (block.type === "text") {
        emit({ type: "text", data: { content: block.text } });
      }
    }

    // Check if done
    if (response.stop_reason !== "tool_use") {
      messages.push({ role: "assistant", content: response.content });
      emit({ type: "done", data: { response: response.content } });
      return messages;
    }

    // Execute tools
    const toolCalls = response.content.filter((b): b is ToolUseBlock => b.type === "tool_use");
    const results = [];

    for (const tc of toolCalls) {
      emit({ type: "tool_start", data: { name: tc.name, input: tc.input } });

      const output = await executeTool(
        tc.name,
        tc.input as Record<string, unknown>,
        context,
        runSubagent
      );

      emit({ type: "tool_result", data: { name: tc.name, output } });
      results.push({ type: "tool_result" as const, tool_use_id: tc.id, content: output });
    }

    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: results });
  }
}
