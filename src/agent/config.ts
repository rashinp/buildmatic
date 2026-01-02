// src/agent/config.ts

import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import type { AgentConfig, AgentTypeConfig, AgentType } from "./types.js";

dotenvConfig();

export function loadConfig(workDir?: string): AgentConfig {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }

  return {
    apiKey,
    baseUrl: process.env.ANTHROPIC_BASE_URL || undefined,
    model: process.env.MODEL_NAME || "claude-sonnet-4-20250514",
    workDir: workDir || process.cwd(),
    skillsDir: resolve(workDir || process.cwd(), "skills"),
  };
}

export const AGENT_TYPES: Record<AgentType, AgentTypeConfig> = {
  explore: {
    description: "Read-only agent for exploring code, finding files, searching",
    tools: ["bash", "read_file"],
    prompt: "You are an exploration agent. Search and analyze, but never modify files. Return a concise summary.",
  },
  code: {
    description: "Full agent for implementing features and fixing bugs",
    tools: "*",
    prompt: "You are a coding agent. Implement the requested changes efficiently.",
  },
  plan: {
    description: "Planning agent for designing implementation strategies",
    tools: ["bash", "read_file"],
    prompt: "You are a planning agent. Analyze the codebase and output a numbered implementation plan. Do NOT make changes.",
  },
};
