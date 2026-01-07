# Buildmatic Ink UI Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace readline-based REPL with polished Ink (React) terminal UI like Claude Code

**Architecture:** Hybrid approach - streaming text with persistent header showing session info

**Tech Stack:** Ink 5, React 18, ink-spinner, ink-text-input, cli-highlight, marked-terminal

---

## Layout

```
┌─────────────────────────────────────────────────┐
│ buildmatic • claude-sonnet-4 • ~/projects/app   │  ← Header (persistent)
│ tokens: 1.2k in / 450 out • cache: 800 read     │
├─────────────────────────────────────────────────┤
│                                                 │
│ You: explain the auth flow                      │  ← Message stream
│                                                 │
│ ● read_file src/auth/login.ts                   │  ← Tool indicator
│                                                 │
│ The authentication uses JWT tokens stored in... │  ← Assistant response
│ ```typescript                                   │
│ const token = await signJWT(payload)            │  ← Syntax highlighted
│ ```                                             │
│                                                 │
├─────────────────────────────────────────────────┤
│ You: █                                          │  ← Input (bottom)
└─────────────────────────────────────────────────┘
```

## Dependencies

```json
{
  "ink": "^5.0.1",
  "ink-spinner": "^5.0.0",
  "ink-text-input": "^6.0.0",
  "react": "^18.2.0",
  "cli-highlight": "^2.1.11",
  "marked": "^12.0.0",
  "marked-terminal": "^7.0.0"
}
```

## Components

| Component | Purpose |
|-----------|---------|
| `<App>` | Root, manages state |
| `<Header>` | Model/tokens/path display |
| `<MessageList>` | Rendered conversation history |
| `<StreamingText>` | Current response with markdown |
| `<ToolStatus>` | Spinner + tool name |
| `<InputPrompt>` | Text input at bottom |

## State

```typescript
interface AppState {
  model: string;
  workDir: string;
  tokensIn: number;
  tokensOut: number;
  cacheRead: number;
  messages: Message[];
  streamingText: string;
  activeTool: string | null;
  inputValue: string;
  isProcessing: boolean;
}

interface Message {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolName?: string;
}
```

## Data Flow

1. User types → `inputValue` updates
2. User submits → `isProcessing = true`, call `runAgent()`
3. Agent emits `tool_start` → `activeTool = toolName`
4. Agent emits `tool_result` → Push to `messages`, `activeTool = null`
5. Agent emits `text` → Append to `streamingText`
6. Agent emits `done` → Move `streamingText` to `messages`, `isProcessing = false`

## File Structure

```
src/
├── ui/
│   ├── App.tsx
│   ├── Header.tsx
│   ├── MessageList.tsx
│   ├── StreamingText.tsx
│   ├── ToolStatus.tsx
│   ├── InputPrompt.tsx
│   ├── theme.ts
│   └── index.tsx
├── cli/
│   ├── repl.ts           # DELETE
│   └── commands.ts       # KEEP
```

## Changes to Existing Files

- `src/index.ts` - Import `startUI` from `ui/index.tsx`
- `tsconfig.json` - Add `"jsx": "react-jsx"`
- `package.json` - Add dependencies
