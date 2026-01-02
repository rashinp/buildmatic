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

/**
 * Smart truncation: keeps beginning and end, with context about what was cut
 */
function smartTruncate(output: string, maxLength: number): string {
  if (output.length <= maxLength) return output;

  const headLength = Math.floor(maxLength * 0.7);  // 70% from start
  const tailLength = Math.floor(maxLength * 0.25); // 25% from end
  const head = output.slice(0, headLength);
  const tail = output.slice(-tailLength);
  const truncatedCount = output.length - headLength - tailLength;

  return `${head}\n\n... [${truncatedCount} characters truncated] ...\n\n${tail}`;
}

/**
 * Summarize old messages to reduce context size
 */
function summarizeMessages(messages: MessageParam[], keepLast: number): MessageParam[] {
  if (messages.length <= keepLast) return messages;

  const oldMessages = messages.slice(0, -keepLast);
  const recentMessages = messages.slice(-keepLast);

  // Create a summary of old messages
  const summary = oldMessages
    .filter(m => m.role === "user" && typeof m.content === "string")
    .map(m => `- ${(m.content as string).slice(0, 100)}`)
    .join("\n");

  const summaryMessage: MessageParam = {
    role: "user",
    content: `[Previous conversation summary - ${oldMessages.length} messages]\n${summary}\n[End summary]`
  };

  return [summaryMessage, ...recentMessages];
}

/**
 * Build system prompt with optional caching
 */
function buildSystemPrompt(
  config: AgentConfig,
  skillLoader: SkillLoader
): string | Anthropic.Messages.TextBlockParam[] {
  const promptText = `You are a coding agent at ${config.workDir}.

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

  // Return with cache control if caching is enabled
  if (config.enableCaching !== false) {
    return [
      {
        type: "text" as const,
        text: promptText,
        cache_control: { type: "ephemeral" as const }
      }
    ];
  }

  return promptText;
}

export async function runAgent(
  messages: MessageParam[],
  options: AgentOptions
): Promise<MessageParam[]> {
  const { config, onEvent } = options;

  // Defaults
  const maxToolOutput = config.maxToolOutputLength ?? 5000;
  const maxContextMessages = config.maxContextMessages ?? 20;
  const modelFast = config.modelFast ?? "claude-haiku-3-5-20241022";

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
  const systemPrompt = buildSystemPrompt(config, skillLoader);

  const emit = (event: AgentEvent) => onEvent?.(event);

  /**
   * Run a subagent with the appropriate model based on type
   * - explore/plan: Use fast model (Haiku) - read-only, cheaper
   * - code: Use main model (Sonnet) - needs full capability
   */
  const runSubagent = async (description: string, prompt: string, agentType: AgentType): Promise<string> => {
    const subConfig = AGENT_TYPES[agentType];
    const subTools = getToolsForAgent(agentType);

    // Use fast model for read-only agents, main model for coding
    const subModel = agentType === "code" ? config.model : modelFast;

    const subSystem = `You are a ${agentType} subagent at ${config.workDir}.

${subConfig.prompt}

Complete the task and return a clear, concise summary.`;

    let subMessages: MessageParam[] = [{ role: "user", content: prompt }];

    emit({ type: "text", data: { content: `[${agentType}:${subModel.includes("haiku") ? "haiku" : "sonnet"}] ${description}` } });

    while (true) {
      const response = await client.messages.create({
        model: subModel,
        system: subSystem,
        messages: subMessages,
        tools: subTools,
        max_tokens: 4000,  // Reduced from 8000 for subagents
      });

      if (response.stop_reason !== "tool_use") {
        const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
        return textBlock?.text || "(subagent returned no text)";
      }

      const toolCalls = response.content.filter((b): b is ToolUseBlock => b.type === "tool_use");
      const results = [];

      for (const tc of toolCalls) {
        let output = await executeTool(tc.name, tc.input as Record<string, unknown>, context);
        // Apply smart truncation to tool output
        output = smartTruncate(output, maxToolOutput);
        results.push({ type: "tool_result" as const, tool_use_id: tc.id, content: output });
      }

      subMessages.push({ role: "assistant", content: response.content });
      subMessages.push({ role: "user", content: results });
    }
  };

  // Main agent loop
  while (true) {
    // Apply context window management
    const managedMessages = summarizeMessages(messages, maxContextMessages);

    const response = await client.messages.create({
      model: config.model,
      system: systemPrompt,
      messages: managedMessages,
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

      let output = await executeTool(
        tc.name,
        tc.input as Record<string, unknown>,
        context,
        runSubagent
      );

      // Apply smart truncation to tool output
      output = smartTruncate(output, maxToolOutput);

      emit({ type: "tool_result", data: { name: tc.name, output } });
      results.push({ type: "tool_result" as const, tool_use_id: tc.id, content: output });
    }

    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: results });
  }
}
