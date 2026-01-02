// src/cli/commands.ts

import type { AgentConfig } from "../agent/types.js";
import { runAgent } from "../agent/loop.js";

export async function runCommand(command: string, config: AgentConfig): Promise<void> {
  console.log(`> Running: ${command}\n`);

  try {
    await runAgent([{ role: "user", content: command }], {
      config,
      onEvent: (event) => {
        switch (event.type) {
          case "text":
            console.log(event.data.content);
            break;
          case "tool_start":
            console.log(`\n> ${event.data.name}`);
            break;
          case "tool_result": {
            const output = String(event.data.output);
            const preview = output.length > 200 ? output.slice(0, 200) + "..." : output;
            console.log(`  ${preview}`);
            break;
          }
          case "done":
            console.log("\n> Done");
            break;
          case "error":
            console.error(`Error: ${event.data.message}`);
            break;
        }
      },
    });
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
