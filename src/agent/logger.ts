// src/agent/logger.ts

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";

export interface LLMCallLog {
  timestamp: string;
  callId: string;
  model: string;

  // Token usage
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;

  // Timing
  durationMs: number;

  // Request details
  messageCount: number;
  toolCallsRequested: string[];

  // Response details
  stopReason: string;
  toolCallsInResponse: string[];

  // Context (truncated for readability)
  systemPromptPreview: string;
  lastUserMessage: string;
  responsePreview: string;
}

export interface SessionLog {
  sessionId: string;
  startTime: string;
  workDir: string;
  model: string;
  calls: LLMCallLog[];

  // Aggregates
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalCalls: number;
}

export class LLMLogger {
  private logPath: string;
  private session: SessionLog;

  constructor(workDir: string, model: string) {
    const logsDir = join(workDir, ".buildmatic-logs");
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    this.logPath = join(logsDir, `session-${timestamp}.json`);

    this.session = {
      sessionId: `session-${Date.now()}`,
      startTime: new Date().toISOString(),
      workDir,
      model,
      calls: [],
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheReadTokens: 0,
      totalCalls: 0,
    };

    this.save();
  }

  logCall(params: {
    model: string;
    messages: unknown[];
    systemPrompt: unknown;
    response: {
      usage?: {
        input_tokens: number;
        output_tokens: number;
      };
      stop_reason?: string | null;
      content: unknown[];
    };
    durationMs: number;
  }): void {
    const { model, messages, systemPrompt, response, durationMs } = params;

    // Extract cache tokens from usage
    const usage = response.usage as Record<string, number> | undefined;
    const cacheReadTokens = usage?.["cache_read_input_tokens"] || 0;
    const cacheCreationTokens = usage?.["cache_creation_input_tokens"] || 0;

    // Extract tool calls from response
    const toolCallsInResponse = (response.content as Array<{ type: string; name?: string }>)
      .filter(b => b.type === "tool_use")
      .map(b => b.name || "unknown");

    // Get last user message preview
    const lastMsg = messages[messages.length - 1] as { content?: unknown };
    let lastUserMessage = "";
    if (typeof lastMsg?.content === "string") {
      lastUserMessage = lastMsg.content.slice(0, 200);
    } else if (Array.isArray(lastMsg?.content)) {
      const firstBlock = lastMsg.content[0] as { type?: string; content?: string };
      if (firstBlock?.type === "tool_result") {
        lastUserMessage = `[tool_result] ${(firstBlock.content || "").slice(0, 100)}`;
      }
    }

    // Get response preview
    const textBlock = (response.content as Array<{ type: string; text?: string }>)
      .find(b => b.type === "text");
    const responsePreview = textBlock?.text?.slice(0, 200) || "[no text]";

    // Get system prompt preview
    let systemPromptPreview = "";
    if (typeof systemPrompt === "string") {
      systemPromptPreview = systemPrompt.slice(0, 100);
    } else if (Array.isArray(systemPrompt)) {
      const first = systemPrompt[0] as { text?: string };
      systemPromptPreview = (first?.text || "").slice(0, 100);
    }

    const callLog: LLMCallLog = {
      timestamp: new Date().toISOString(),
      callId: `call-${this.session.calls.length + 1}`,
      model,
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
      cacheReadTokens,
      cacheCreationTokens,
      durationMs,
      messageCount: messages.length,
      toolCallsRequested: [], // Could parse from messages if needed
      stopReason: response.stop_reason || "unknown",
      toolCallsInResponse,
      systemPromptPreview,
      lastUserMessage,
      responsePreview,
    };

    this.session.calls.push(callLog);
    this.session.totalCalls++;
    this.session.totalInputTokens += callLog.inputTokens;
    this.session.totalOutputTokens += callLog.outputTokens;
    this.session.totalCacheReadTokens += callLog.cacheReadTokens;

    this.save();
  }

  private save(): void {
    writeFileSync(this.logPath, JSON.stringify(this.session, null, 2));
  }

  getLogPath(): string {
    return this.logPath;
  }

  getSummary(): string {
    return `Calls: ${this.session.totalCalls}, Input: ${this.session.totalInputTokens}, Output: ${this.session.totalOutputTokens}, Cache: ${this.session.totalCacheReadTokens}`;
  }
}
