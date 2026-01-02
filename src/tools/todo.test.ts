// src/tools/todo.test.ts

import { test, describe } from "node:test";
import assert from "node:assert";
import { TodoManager, todoTool } from "./todo.js";

describe("TodoManager", () => {
  test("adds items", () => {
    const todo = new TodoManager();
    const result = todo.update([
      { content: "Task 1", status: "pending", activeForm: "Doing task 1" },
    ]);
    assert.ok(result.includes("Task 1"));
  });

  test("enforces single in_progress", () => {
    const todo = new TodoManager();
    assert.throws(() => {
      todo.update([
        { content: "Task 1", status: "in_progress", activeForm: "Doing 1" },
        { content: "Task 2", status: "in_progress", activeForm: "Doing 2" },
      ]);
    });
  });

  test("renders progress", () => {
    const todo = new TodoManager();
    const result = todo.update([
      { content: "Task 1", status: "completed", activeForm: "Done 1" },
      { content: "Task 2", status: "pending", activeForm: "Doing 2" },
    ]);
    assert.ok(result.includes("1/2 done"));
  });
});
