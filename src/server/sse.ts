// src/server/sse.ts

import type { Response } from "express";
import type { AgentEvent } from "../agent/types.js";

export function setupSSE(res: Response): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
}

export function sendSSE(res: Response, event: AgentEvent): void {
  res.write(`event: ${event.type}\n`);
  res.write(`data: ${JSON.stringify(event.data)}\n\n`);
}

export function endSSE(res: Response): void {
  res.end();
}
