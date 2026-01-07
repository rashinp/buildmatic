// src/agent/loop.ts

import Anthropic from "@anthropic-ai/sdk";
import type {
  MessageParam,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages";
import type { AgentConfig, AgentEvent, AgentType } from "./types.js";
import { AGENT_TYPES } from "./config.js";
import {
  getAllTools,
  getToolsForAgent,
  executeTool,
  ToolContext,
  TodoManager,
  SkillLoader,
} from "../tools/index.js";

export interface AgentOptions {
  config: AgentConfig;
  onEvent?: (event: AgentEvent) => void;
}

/**
 * Smart truncation: keeps beginning and end, with context about what was cut
 */
function smartTruncate(output: string, maxLength: number): string {
  if (output.length <= maxLength) return output;

  const headLength = Math.floor(maxLength * 0.7); // 70% from start
  const tailLength = Math.floor(maxLength * 0.25); // 25% from end
  const head = output.slice(0, headLength);
  const tail = output.slice(-tailLength);
  const truncatedCount = output.length - headLength - tailLength;

  return `${head}\n\n... [${truncatedCount} characters truncated] ...\n\n${tail}`;
}

/**
 * Sanitize assistant message for history - truncate very large tool inputs
 * Balance: keep enough for context (class names, structure) but prevent bloat
 */
function sanitizeAssistantMessage(content: Anthropic.Messages.ContentBlock[]): Anthropic.Messages.ContentBlock[] {
  return content.map(block => {
    if (block.type === 'tool_use') {
      const input = block.input as Record<string, unknown>;
      const sanitizedInput: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(input)) {
        if (typeof value === 'string' && value.length > 4000) {
          // Only truncate VERY large inputs (>4KB)
          // Keep 3KB to preserve class names, structure, key code
          sanitizedInput[key] = value.slice(0, 3000) + `\n... [${value.length - 3000} chars truncated]`;
        } else {
          sanitizedInput[key] = value;
        }
      }

      return { ...block, input: sanitizedInput };
    }
    return block;
  });
}

/**
 * Summarize old messages to reduce context size while preserving key information
 */
function summarizeMessages(
  messages: MessageParam[],
  keepLast: number
): MessageParam[] {
  if (messages.length <= keepLast) return messages;

  const oldMessages = messages.slice(0, -keepLast);
  const recentMessages = messages.slice(-keepLast);

  // Extract key information from old messages - be very concise
  const summaryParts: string[] = [];
  const filesWritten: string[] = [];

  for (const msg of oldMessages) {
    if (msg.role === "user") {
      if (typeof msg.content === "string") {
        summaryParts.push(`User: ${msg.content.slice(0, 100)}`);
      } else if (Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if (block.type === "tool_result" && typeof block.content === "string") {
            // Extract file write confirmations
            const writeMatch = block.content.match(/Wrote (\d+) bytes to (.+)/);
            if (writeMatch) {
              filesWritten.push(`${writeMatch[2]} (${writeMatch[1]}b)`);
            }
          }
        }
      }
    } else if (msg.role === "assistant" && Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === "tool_use") {
          // Just note tool usage, not content
          const input = block.input as Record<string, unknown>;
          if (block.name === "write_file" && input.path) {
            // Already tracked in filesWritten
          } else if (block.name === "Skill") {
            summaryParts.push(`Loaded skill: ${input.skill}`);
          } else {
            summaryParts.push(`Used: ${block.name}`);
          }
        }
      }
    }
  }

  // Build concise summary
  let summary = `[Earlier context: ${oldMessages.length} messages]\n`;
  if (filesWritten.length > 0) {
    summary += `Files created: ${filesWritten.join(", ")}\n`;
  }
  summary += summaryParts.slice(0, 10).join("\n");
  summary += "\n[Recent messages follow]";

  const summaryMessage: MessageParam = {
    role: "user",
    content: summary,
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
${Object.entries(AGENT_TYPES)
  .map(([n, c]) => `- ${n}: ${c.description}`)
  .join("\n")}

Rules:
- Use Skill tool IMMEDIATELY when a task matches a skill description
- Use Task tool for subtasks needing focused exploration or implementation
- Use TodoWrite to track multi-step work
- Prefer tools over prose. Act, don't just explain.
- After finishing, summarize what changed.

**IMPORTANT: Project Organization**
When creating any application, website, or multi-file project:
1. ALWAYS create a dedicated project folder first (e.g., "my-app/", "landing-page/")
2. Use a descriptive, kebab-case folder name based on the project purpose
3. Place ALL project files inside this folder - never in the root directory
4. Example: For a todo app, create "todo-app/" then "todo-app/index.html", "todo-app/styles.css", etc.`;

  // Return with cache control if caching is enabled
  if (config.enableCaching !== false) {
    return [
      {
        type: "text" as const,
        text: promptText,
        cache_control: { type: "ephemeral" as const },
      },
    ];
  }

  return promptText;
}

export async function runAgent(
  messages: MessageParam[],
  options: AgentOptions
): Promise<MessageParam[]> {
  const { config, onEvent } = options;

  // Defaults - balanced for token savings + quality
  const maxToolOutput = config.maxToolOutputLength ?? 4000;
  const maxContextMessages = config.maxContextMessages ?? 12; // Summarize older messages sooner
  const modelFast = config.modelFast ?? "claude-3-5-haiku-20241022";

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
  const runSubagent = async (
    description: string,
    prompt: string,
    agentType: AgentType
  ): Promise<string> => {
    const subConfig = AGENT_TYPES[agentType];
    const subTools = getToolsForAgent(agentType);

    // Use fast model for read-only agents, main model for coding
    const subModel = agentType === "code" ? config.model : modelFast;

    const subSystem = `You are a ${agentType} subagent at ${config.workDir}.

${subConfig.prompt}

Complete the task and return a clear, concise summary.`;

    let subMessages: MessageParam[] = [{ role: "user", content: prompt }];

    emit({
      type: "text",
      data: {
        content: `[${agentType}:${
          subModel.includes("haiku") ? "haiku" : "sonnet"
        }] ${description}`,
      },
    });

    while (true) {
      const response = await client.messages.create({
        model: subModel,
        system: subSystem,
        messages: subMessages,
        tools: subTools,
        max_tokens: 4000, // Reduced from 8000 for subagents
      });

      if (response.stop_reason !== "tool_use") {
        const textBlock = response.content.find(
          (b): b is Anthropic.TextBlock => b.type === "text"
        );
        return textBlock?.text || "(subagent returned no text)";
      }

      const toolCalls = response.content.filter(
        (b): b is ToolUseBlock => b.type === "tool_use"
      );
      const results = [];

      for (const tc of toolCalls) {
        let output = await executeTool(
          tc.name,
          tc.input as Record<string, unknown>,
          context
        );
        // Apply smart truncation - but NOT for file reads (need complete content for edits)
        const noTruncateTools = ["read_file", "Skill"];
        if (!noTruncateTools.includes(tc.name)) {
          output = smartTruncate(output, maxToolOutput);
        }
        results.push({
          type: "tool_result" as const,
          tool_use_id: tc.id,
          content: output,
        });
      }

      subMessages.push({ role: "assistant", content: response.content });
      subMessages.push({ role: "user", content: results });
    }
  };

  // Main agent loop
  while (true) {
    // Apply context window management
    const managedMessages = summarizeMessages(messages, maxContextMessages);

    // Build request with optional caching
    const requestParams: Anthropic.Messages.MessageCreateParams = {
      model: config.model,
      system: systemPrompt,
      messages: managedMessages,
      tools,
      max_tokens: 8000,
    };

    // Make API call - cache_control in system prompt enables caching automatically
    const response = await client.messages.create(requestParams);

    // Always report token usage
    if (response.usage) {
      const usage = response.usage as unknown as Record<string, number>;
      const cacheRead = usage["cache_read_input_tokens"] || 0;
      const cacheCreated = usage["cache_creation_input_tokens"] || 0;
      emit({
        type: "text",
        data: {
          content: `[tokens: in=${response.usage.input_tokens}, out=${response.usage.output_tokens}, cache_read=${cacheRead}, cache_created=${cacheCreated}]`,
        },
      });
    }

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
    const toolCalls = response.content.filter(
      (b): b is ToolUseBlock => b.type === "tool_use"
    );
    const results = [];

    for (const tc of toolCalls) {
      emit({ type: "tool_start", data: { name: tc.name, input: tc.input } });

      let output = await executeTool(
        tc.name,
        tc.input as Record<string, unknown>,
        context,
        runSubagent
      );

      // Apply smart truncation to tool output - but NOT for file reads
      // File content must be complete for accurate edits
      const noTruncateTools = ["read_file", "Skill"];
      if (!noTruncateTools.includes(tc.name)) {
        output = smartTruncate(output, maxToolOutput);
      }

      emit({ type: "tool_result", data: { name: tc.name, output } });
      results.push({
        type: "tool_result" as const,
        tool_use_id: tc.id,
        content: output,
      });
    }

    // Sanitize assistant message to truncate large tool inputs before storing in history
    const sanitizedContent = sanitizeAssistantMessage(response.content);
    messages.push({ role: "assistant", content: sanitizedContent });
    messages.push({ role: "user", content: results });
  }
}
