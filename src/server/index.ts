// src/server/index.ts

import express from "express";
import type { AgentConfig } from "../agent/types.js";
import { createRoutes } from "./routes.js";

export function startServer(config: AgentConfig, port: number): void {
  const app = express();

  app.use(express.json());
  app.use("/api", createRoutes(config));

  app.listen(port, () => {
    console.log(`\nbuildmatic API server running at http://localhost:${port}`);
    console.log(`\nEndpoints:`);
    console.log(`  GET  /api/status      - Health check`);
    console.log(`  POST /api/chat        - Streaming chat (SSE)`);
    console.log(`  POST /api/chat/sync   - Synchronous chat`);
    console.log(`\nModel: ${config.model}`);
  });
}
