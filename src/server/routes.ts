// src/server/routes.ts

import { Router, Request, Response } from "express";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import type { AgentConfig } from "../agent/types.js";
import { runAgent } from "../agent/loop.js";
import { SkillLoader } from "../tools/skill.js";
import { setupSSE, sendSSE, endSSE } from "./sse.js";

export function createRoutes(config: AgentConfig): Router {
  const router = Router();
  const skillLoader = new SkillLoader(config.skillsDir);

  // Health check
  router.get("/status", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      model: config.model,
      skills: skillLoader.listSkills(),
    });
  });

  // Streaming chat endpoint
  router.post("/chat", async (req: Request, res: Response) => {
    const { message, history = [] } = req.body as {
      message: string;
      history?: MessageParam[];
    };

    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    setupSSE(res);

    const messages: MessageParam[] = [...history, { role: "user", content: message }];

    try {
      await runAgent(messages, {
        config,
        onEvent: (event) => sendSSE(res, event),
      });
    } catch (error) {
      sendSSE(res, {
        type: "error",
        data: { message: error instanceof Error ? error.message : String(error) },
      });
    }

    endSSE(res);
  });

  // Synchronous chat endpoint
  router.post("/chat/sync", async (req: Request, res: Response) => {
    const { message, history = [] } = req.body as {
      message: string;
      history?: MessageParam[];
    };

    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    const messages: MessageParam[] = [...history, { role: "user", content: message }];
    let responseText = "";

    try {
      const result = await runAgent(messages, {
        config,
        onEvent: (event) => {
          if (event.type === "text") {
            responseText += event.data.content;
          }
        },
      });

      res.json({ response: responseText, history: result });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return router;
}
