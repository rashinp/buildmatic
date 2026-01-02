// src/tools/file.ts

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import type { Tool } from "../agent/types.js";

function safePath(p: string, workDir: string): string {
  const resolved = resolve(workDir, p);
  if (!resolved.startsWith(resolve(workDir))) {
    throw new Error(`Path escapes workspace: ${p}`);
  }
  return resolved;
}

export const readFileTool: Tool = {
  name: "read_file",
  description: "Read file contents. Returns UTF-8 text.",
  input_schema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative path to the file" },
      limit: { type: "integer", description: "Max lines to read (default: all)" },
    },
    required: ["path"],
  },
};

export async function runRead(path: string, workDir: string, limit?: number): Promise<string> {
  try {
    const content = readFileSync(safePath(path, workDir), "utf-8");
    const lines = content.split("\n");

    if (limit && limit < lines.length) {
      return lines.slice(0, limit).join("\n") + `\n... (${lines.length - limit} more lines)`;
    }

    return content.slice(0, 50000);
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export const writeFileTool: Tool = {
  name: "write_file",
  description: "Write content to a file. Creates parent directories if needed.",
  input_schema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative path for the file" },
      content: { type: "string", description: "Content to write" },
    },
    required: ["path", "content"],
  },
};

export async function runWrite(path: string, content: string, workDir: string): Promise<string> {
  try {
    const fullPath = safePath(path, workDir);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content);
    return `Wrote ${content.length} bytes to ${path}`;
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export const editFileTool: Tool = {
  name: "edit_file",
  description: "Replace exact text in a file. Use for surgical edits.",
  input_schema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative path to the file" },
      old_text: { type: "string", description: "Exact text to find" },
      new_text: { type: "string", description: "Replacement text" },
    },
    required: ["path", "old_text", "new_text"],
  },
};

export async function runEdit(
  path: string,
  oldText: string,
  newText: string,
  workDir: string
): Promise<string> {
  try {
    const fullPath = safePath(path, workDir);
    const content = readFileSync(fullPath, "utf-8");

    if (!content.includes(oldText)) {
      return `Error: Text not found in ${path}`;
    }

    writeFileSync(fullPath, content.replace(oldText, newText));
    return `Edited ${path}`;
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}
