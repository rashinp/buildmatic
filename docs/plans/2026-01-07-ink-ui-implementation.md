# Ink UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace readline REPL with polished Ink terminal UI featuring persistent header, streaming text, and tool status indicators.

**Architecture:** React/Ink component tree with centralized state in App component. Events from agent loop drive state updates. Static rendering for completed messages prevents flicker.

**Tech Stack:** Ink 5, React 18, ink-spinner, ink-text-input, cli-highlight, marked-terminal, TypeScript with JSX

---

### Task 1: Install Dependencies & Configure TSX

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`

**Step 1: Install Ink and React dependencies**

Run:
```bash
npm install ink@^5.0.1 ink-spinner@^5.0.0 ink-text-input@^6.0.0 react@^18.2.0 cli-highlight@^2.1.11 marked@^12.0.0 marked-terminal@^7.0.0
```

**Step 2: Install React types**

Run:
```bash
npm install -D @types/react
```

**Step 3: Update tsconfig.json for JSX**

Add to `compilerOptions`:
```json
{
  "jsx": "react-jsx",
  "esModuleInterop": true
}
```

**Step 4: Verify build still works**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 5: Commit**

```bash
git add package.json package-lock.json tsconfig.json
git commit -m "chore: add Ink and React dependencies for terminal UI"
```

---

### Task 2: Create Theme Constants

**Files:**
- Create: `src/ui/theme.ts`

**Step 1: Create theme file with color constants**

```typescript
// src/ui/theme.ts

export const colors = {
  primary: '#6366f1',      // Indigo - branding
  success: '#22c55e',      // Green - success states
  warning: '#f59e0b',      // Amber - warnings
  error: '#ef4444',        // Red - errors
  muted: '#6b7280',        // Gray - secondary text
  text: '#f3f4f6',         // Light gray - primary text
  dim: '#4b5563',          // Dark gray - borders, separators
};

export const symbols = {
  dot: '●',
  arrow: '→',
  check: '✓',
  cross: '✗',
  spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
};
```

**Step 2: Verify file created**

Run: `cat src/ui/theme.ts`
Expected: File contents displayed

**Step 3: Commit**

```bash
git add src/ui/theme.ts
git commit -m "feat(ui): add theme constants for colors and symbols"
```

---

### Task 3: Create Header Component

**Files:**
- Create: `src/ui/Header.tsx`

**Step 1: Create Header component**

```tsx
// src/ui/Header.tsx

import React from 'react';
import { Box, Text } from 'ink';
import { colors, symbols } from './theme.js';

interface HeaderProps {
  model: string;
  workDir: string;
  tokensIn: number;
  tokensOut: number;
  cacheRead: number;
}

export const Header: React.FC<HeaderProps> = ({
  model,
  workDir,
  tokensIn,
  tokensOut,
  cacheRead,
}) => {
  const shortDir = workDir.replace(process.env.HOME || '', '~');

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={colors.dim} paddingX={1}>
      <Box gap={1}>
        <Text color={colors.primary} bold>buildmatic</Text>
        <Text color={colors.muted}>{symbols.dot}</Text>
        <Text color={colors.text}>{model}</Text>
        <Text color={colors.muted}>{symbols.dot}</Text>
        <Text color={colors.muted}>{shortDir}</Text>
      </Box>
      <Box gap={1}>
        <Text color={colors.muted}>
          tokens: <Text color={colors.text}>{tokensIn}</Text> in / <Text color={colors.text}>{tokensOut}</Text> out
        </Text>
        {cacheRead > 0 && (
          <Text color={colors.muted}>
            {symbols.dot} cache: <Text color={colors.success}>{cacheRead}</Text> read
          </Text>
        )}
      </Box>
    </Box>
  );
};
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/ui/Header.tsx
git commit -m "feat(ui): add Header component with model and token stats"
```

---

### Task 4: Create ToolStatus Component

**Files:**
- Create: `src/ui/ToolStatus.tsx`

**Step 1: Create ToolStatus component with spinner**

```tsx
// src/ui/ToolStatus.tsx

import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { colors, symbols } from './theme.js';

interface ToolStatusProps {
  toolName: string | null;
}

export const ToolStatus: React.FC<ToolStatusProps> = ({ toolName }) => {
  if (!toolName) return null;

  return (
    <Box gap={1} paddingLeft={1}>
      <Text color={colors.warning}>
        <Spinner type="dots" />
      </Text>
      <Text color={colors.muted}>{toolName}</Text>
    </Box>
  );
};
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/ui/ToolStatus.tsx
git commit -m "feat(ui): add ToolStatus component with spinner"
```

---

### Task 5: Create MessageList Component

**Files:**
- Create: `src/ui/MessageList.tsx`

**Step 1: Create Message type and MessageList component**

```tsx
// src/ui/MessageList.tsx

import React from 'react';
import { Box, Text, Static } from 'ink';
import { colors, symbols } from './theme.js';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolName?: string;
}

interface MessageListProps {
  messages: Message[];
}

const MessageItem: React.FC<{ message: Message }> = ({ message }) => {
  if (message.role === 'user') {
    return (
      <Box paddingY={0}>
        <Text color={colors.primary} bold>You: </Text>
        <Text>{message.content}</Text>
      </Box>
    );
  }

  if (message.role === 'tool') {
    return (
      <Box paddingLeft={1}>
        <Text color={colors.success}>{symbols.check} </Text>
        <Text color={colors.muted}>{message.toolName}</Text>
        {message.content && (
          <Text color={colors.dim}> {symbols.arrow} {message.content.slice(0, 50)}...</Text>
        )}
      </Box>
    );
  }

  // Assistant message
  return (
    <Box paddingY={0}>
      <Text>{message.content}</Text>
    </Box>
  );
};

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <Static items={messages}>
      {(message) => (
        <Box key={message.id} flexDirection="column">
          <MessageItem message={message} />
        </Box>
      )}
    </Static>
  );
};
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/ui/MessageList.tsx
git commit -m "feat(ui): add MessageList component with Static rendering"
```

---

### Task 6: Create StreamingText Component

**Files:**
- Create: `src/ui/StreamingText.tsx`

**Step 1: Create StreamingText component**

```tsx
// src/ui/StreamingText.tsx

import React from 'react';
import { Box, Text } from 'ink';

interface StreamingTextProps {
  text: string;
}

export const StreamingText: React.FC<StreamingTextProps> = ({ text }) => {
  if (!text) return null;

  return (
    <Box>
      <Text>{text}</Text>
    </Box>
  );
};
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/ui/StreamingText.tsx
git commit -m "feat(ui): add StreamingText component for live responses"
```

---

### Task 7: Create InputPrompt Component

**Files:**
- Create: `src/ui/InputPrompt.tsx`

**Step 1: Create InputPrompt component**

```tsx
// src/ui/InputPrompt.tsx

import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { colors } from './theme.js';

interface InputPromptProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  disabled: boolean;
}

export const InputPrompt: React.FC<InputPromptProps> = ({
  value,
  onChange,
  onSubmit,
  disabled,
}) => {
  return (
    <Box borderStyle="single" borderColor={colors.dim} paddingX={1}>
      <Text color={colors.primary} bold>You: </Text>
      {disabled ? (
        <Text color={colors.muted}>...</Text>
      ) : (
        <TextInput
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          placeholder="Type a message..."
        />
      )}
    </Box>
  );
};
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/ui/InputPrompt.tsx
git commit -m "feat(ui): add InputPrompt component with TextInput"
```

---

### Task 8: Create Main App Component

**Files:**
- Create: `src/ui/App.tsx`

**Step 1: Create App component with state management**

```tsx
// src/ui/App.tsx

import React, { useState, useCallback } from 'react';
import { Box, useApp, useInput } from 'ink';
import { Header } from './Header.js';
import { MessageList, Message } from './MessageList.js';
import { StreamingText } from './StreamingText.js';
import { ToolStatus } from './ToolStatus.js';
import { InputPrompt } from './InputPrompt.js';
import type { AgentConfig, AgentEvent } from '../agent/types.js';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import { runAgent } from '../agent/loop.js';

interface AppProps {
  config: AgentConfig;
}

export const App: React.FC<AppProps> = ({ config }) => {
  const { exit } = useApp();

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<MessageParam[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tokensIn, setTokensIn] = useState(0);
  const [tokensOut, setTokensOut] = useState(0);
  const [cacheRead, setCacheRead] = useState(0);

  // Handle Ctrl+C
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
    }
  });

  const handleSubmit = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (['exit', 'quit', 'q'].includes(trimmed.toLowerCase())) {
      exit();
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);
    setStreamingText('');

    // Update history for agent
    const newHistory: MessageParam[] = [...history, { role: 'user', content: trimmed }];
    setHistory(newHistory);

    try {
      const updatedHistory = await runAgent(newHistory, {
        config,
        onEvent: (event: AgentEvent) => {
          switch (event.type) {
            case 'text': {
              const content = event.data.content as string;
              // Check for token info
              if (content.startsWith('[tokens:')) {
                const match = content.match(/in=(\d+).*out=(\d+).*cache_read=(\d+)/);
                if (match) {
                  setTokensIn((prev) => prev + parseInt(match[1], 10));
                  setTokensOut((prev) => prev + parseInt(match[2], 10));
                  setCacheRead((prev) => prev + parseInt(match[3], 10));
                }
              } else {
                setStreamingText((prev) => prev + content);
              }
              break;
            }
            case 'tool_start':
              setActiveTool(event.data.name as string);
              break;
            case 'tool_result': {
              setActiveTool(null);
              const toolMessage: Message = {
                id: `tool-${Date.now()}`,
                role: 'tool',
                content: (event.data.output as string).slice(0, 100),
                toolName: event.data.name as string,
              };
              setMessages((prev) => [...prev, toolMessage]);
              break;
            }
            case 'done':
              break;
          }
        },
      });

      setHistory(updatedHistory);

      // Move streaming text to messages
      setMessages((prev) => {
        const current = streamingText;
        if (current) {
          return [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: 'assistant' as const,
              content: current,
            },
          ];
        }
        return prev;
      });
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : String(error)}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setStreamingText('');
      setActiveTool(null);
      setIsProcessing(false);
    }
  }, [config, exit, history, streamingText]);

  return (
    <Box flexDirection="column" height="100%">
      <Header
        model={config.model}
        workDir={config.workDir}
        tokensIn={tokensIn}
        tokensOut={tokensOut}
        cacheRead={cacheRead}
      />
      <Box flexDirection="column" flexGrow={1} paddingY={1}>
        <MessageList messages={messages} />
        <StreamingText text={streamingText} />
        <ToolStatus toolName={activeTool} />
      </Box>
      <InputPrompt
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        disabled={isProcessing}
      />
    </Box>
  );
};
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/ui/App.tsx
git commit -m "feat(ui): add main App component with state management"
```

---

### Task 9: Create UI Entry Point

**Files:**
- Create: `src/ui/index.tsx`

**Step 1: Create entry point that renders App**

```tsx
// src/ui/index.tsx

import React from 'react';
import { render } from 'ink';
import { App } from './App.js';
import type { AgentConfig } from '../agent/types.js';

export async function startUI(config: AgentConfig): Promise<void> {
  const { waitUntilExit } = render(<App config={config} />);
  await waitUntilExit();
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/ui/index.tsx
git commit -m "feat(ui): add entry point for Ink UI"
```

---

### Task 10: Update Main Entry Point

**Files:**
- Modify: `src/index.ts`
- Delete: `src/cli/repl.ts`

**Step 1: Update src/index.ts to use startUI**

Replace line 6:
```typescript
import { startRepl } from "./cli/repl.js";
```

With:
```typescript
import { startUI } from "./ui/index.js";
```

Replace line 27:
```typescript
await startRepl(config);
```

With:
```typescript
await startUI(config);
```

**Step 2: Delete old repl.ts**

Run: `rm src/cli/repl.ts`

**Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/index.ts
git rm src/cli/repl.ts
git commit -m "feat: switch REPL to Ink UI"
```

---

### Task 11: Manual Testing

**Step 1: Test the UI**

Run: `npm run dev`

Expected behavior:
- Header displays with model name and working directory
- Input prompt shows at bottom
- Type "hello" and press Enter
- See spinner while processing
- See response stream in
- Token counts update in header

**Step 2: Test exit**

Type: `exit`
Expected: App exits cleanly

**Step 3: Test Ctrl+C**

Press: Ctrl+C
Expected: App exits cleanly

---

### Task 12: Push to Remote

**Step 1: Push all commits**

Run: `git push`

**Step 2: Verify on GitHub**

Check that all files are present in the repository.
