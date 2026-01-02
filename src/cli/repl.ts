// src/cli/repl.ts

import * as readline from "readline";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import type { AgentConfig } from "../agent/types.js";
import { runAgent } from "../agent/loop.js";
import { SkillLoader } from "../tools/skill.js";

export async function startRepl(config: AgentConfig): Promise<void> {
  const skillLoader = new SkillLoader(config.skillsDir);

  console.log(`\nbuildmatic - ${config.workDir}`);
  console.log(`Skills: ${skillLoader.listSkills().join(", ") || "none"}`);
  console.log(`Model: ${config.model}`);
  console.log("Type 'exit' to quit.\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const history: MessageParam[] = [];

  const prompt = (): void => {
    rl.question("You: ", async (input) => {
      const trimmed = input.trim();

      if (!trimmed || ["exit", "quit", "q"].includes(trimmed.toLowerCase())) {
        rl.close();
        return;
      }

      history.push({ role: "user", content: trimmed });

      try {
        await runAgent(history, {
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
            }
          },
        });
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }

      console.log();
      prompt();
    });
  };

  prompt();
}
