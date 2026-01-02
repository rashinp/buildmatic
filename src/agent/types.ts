// src/agent/types.ts

import type { MessageParam, ContentBlock, ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";

export interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
  };
}

export interface ToolResult {
  type: "tool_result";
  tool_use_id: string;
  content: string;
}

export interface AgentConfig {
  apiKey: string;
  baseUrl?: string;
  model: string;
  modelFast?: string;  // Cheaper model for exploration/planning (default: haiku)
  workDir: string;
  skillsDir: string;
  maxContextMessages?: number;  // Max messages before summarization (default: 20)
  maxToolOutputLength?: number; // Max chars for tool output (default: 5000)
  enableCaching?: boolean;      // Enable prompt caching (default: true)
}

export type AgentType = "explore" | "code" | "plan";

export interface AgentTypeConfig {
  description: string;
  tools: string[] | "*";
  prompt: string;
}

export interface TodoItem {
  content: string;
  status: "pending" | "in_progress" | "completed";
  activeForm: string;
}

export interface Skill {
  name: string;
  description: string;
  body: string;
  path: string;
  dir: string;
}

export interface AgentEvent {
  type: "text" | "tool_start" | "tool_result" | "done" | "error";
  data: Record<string, unknown>;
}

export type { MessageParam, ContentBlock, ToolUseBlock };
