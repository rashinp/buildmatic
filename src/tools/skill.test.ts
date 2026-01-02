// src/tools/skill.test.ts

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { SkillLoader, skillTool } from "./skill.js";

describe("SkillLoader", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `buildmatic-skills-${Date.now()}`);
    mkdirSync(join(testDir, "pdf"), { recursive: true });
    writeFileSync(
      join(testDir, "pdf", "SKILL.md"),
      `---
name: pdf
description: Process PDF files
---

# PDF Skill

Use pdftotext to extract text.`
    );
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test("loads skills from directory", () => {
    const loader = new SkillLoader(testDir);
    const skills = loader.listSkills();
    assert.ok(skills.includes("pdf"));
  });

  test("gets skill descriptions", () => {
    const loader = new SkillLoader(testDir);
    const desc = loader.getDescriptions();
    assert.ok(desc.includes("pdf"));
    assert.ok(desc.includes("Process PDF"));
  });

  test("gets skill content", () => {
    const loader = new SkillLoader(testDir);
    const content = loader.getSkillContent("pdf");
    assert.ok(content?.includes("pdftotext"));
  });

  test("returns null for unknown skill", () => {
    const loader = new SkillLoader(testDir);
    const content = loader.getSkillContent("unknown");
    assert.strictEqual(content, null);
  });
});
