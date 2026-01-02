// src/tools/bash.ts

import { exec } from "child_process";
import { promisify } from "util";
import type { Tool } from "../agent/types.js";

const execAsync = promisify(exec);

const DANGEROUS_PATTERNS = ["rm -rf /", "sudo", "shutdown", "reboot", "> /dev/"];

export const bashTool: Tool = {
  name: "bash",
  description: "Run a shell command. Use for: ls, find, grep, git, npm, python, etc.",
  input_schema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The shell command to execute",
      },
    },
    required: ["command"],
  },
};

export async function runBash(
  command: string,
  workDir: string,
  timeoutMs: number = 60000
): Promise<string> {
  // Block dangerous commands
  if (DANGEROUS_PATTERNS.some((p) => command.includes(p))) {
    return "Error: Dangerous command blocked";
  }

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: workDir,
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
    });

    const output = (stdout + stderr).trim();
    return output.slice(0, 50000) || "(no output)";
  } catch (error: unknown) {
    if (error && typeof error === "object" && "killed" in error && error.killed) {
      return `Error: Command timed out (${timeoutMs}ms)`;
    }
    const message = error instanceof Error ? error.message : String(error);
    return `Error: ${message}`;
  }
}
