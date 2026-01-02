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
  workDir: string;
  skillsDir: string;
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
