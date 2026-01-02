// src/tools/file.test.ts

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { runRead, runWrite, runEdit, readFileTool, writeFileTool, editFileTool } from "./file.js";

describe("file tools", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `buildmatic-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test("read_file reads content", async () => {
    writeFileSync(join(testDir, "test.txt"), "hello world");
    const result = await runRead("test.txt", testDir);
    assert.strictEqual(result, "hello world");
  });

  test("read_file with limit", async () => {
    writeFileSync(join(testDir, "test.txt"), "line1\nline2\nline3");
    const result = await runRead("test.txt", testDir, 2);
    assert.ok(result.includes("line1"));
    assert.ok(result.includes("line2"));
  });

  test("write_file creates file", async () => {
    const result = await runWrite("new.txt", "content", testDir);
    assert.ok(result.includes("Wrote"));
  });

  test("edit_file replaces text", async () => {
    writeFileSync(join(testDir, "test.txt"), "hello world");
    const result = await runEdit("test.txt", "world", "universe", testDir);
    assert.ok(result.includes("Edited"));
  });

  test("blocks path traversal", async () => {
    const result = await runRead("../../../etc/passwd", testDir);
    assert.ok(result.includes("Error"));
  });
});
