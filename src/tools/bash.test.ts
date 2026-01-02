// src/tools/bash.test.ts

import { test, describe } from "node:test";
import assert from "node:assert";
import { runBash, bashTool } from "./bash.js";

describe("bash tool", () => {
  test("executes simple command", async () => {
    const result = await runBash("echo hello", process.cwd());
    assert.strictEqual(result, "hello");
  });

  test("blocks dangerous commands", async () => {
    const result = await runBash("sudo rm -rf /", process.cwd());
    assert.ok(result.includes("Error"));
  });

  test("handles command timeout", async () => {
    const result = await runBash("sleep 100", process.cwd(), 100);
    assert.ok(result.includes("timed out"));
  });

  test("returns tool definition", () => {
    assert.strictEqual(bashTool.name, "bash");
    assert.ok(bashTool.input_schema.properties.command);
  });
});
