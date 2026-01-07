#!/usr/bin/env node
// src/index.ts

import { Command } from "commander";
import { loadConfig } from "./agent/config.js";
import { startUI } from "./ui/index.js";
import { runCommand } from "./cli/commands.js";
import { startServer } from "./server/index.js";

const program = new Command();

program
  .name("buildmatic")
  .description("AI coding agent CLI with REST API")
  .version("1.0.0");

program
  .argument("[command]", "One-shot command to execute")
  .option("-c, --command <cmd>", "Alternative way to specify command")
  .action(async (commandArg?: string, options?: { command?: string }) => {
    const config = loadConfig();
    const command = commandArg || options?.command;

    if (command) {
      await runCommand(command, config);
    } else {
      await startUI(config);
    }
  });

program
  .command("serve")
  .description("Start the API server")
  .option("-p, --port <port>", "Port to listen on", "3000")
  .action((options: { port: string }) => {
    const config = loadConfig();
    const port = parseInt(options.port, 10);
    startServer(config, port);
  });

program.parse();
