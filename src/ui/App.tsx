// src/ui/App.tsx

import React, { useState, useCallback, useReducer } from 'react';
import { Box, useApp, useInput, Text } from 'ink';
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

// Use reducer for more predictable state updates
interface UIState {
  messages: Message[];
  streamingText: string;
  activeTool: string | null;
  isProcessing: boolean;
  tokensIn: number;
  tokensOut: number;
  cacheRead: number;
}

type UIAction =
  | { type: 'ADD_MESSAGE'; message: Message }
  | { type: 'SET_STREAMING'; text: string }
  | { type: 'APPEND_STREAMING'; text: string }
  | { type: 'SET_TOOL'; name: string | null }
  | { type: 'SET_PROCESSING'; value: boolean }
  | { type: 'UPDATE_TOKENS'; input: number; output: number; cache: number }
  | { type: 'RESET_STREAMING' };

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    case 'SET_STREAMING':
      return { ...state, streamingText: action.text };
    case 'APPEND_STREAMING':
      return { ...state, streamingText: state.streamingText + action.text };
    case 'SET_TOOL':
      return { ...state, activeTool: action.name };
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.value };
    case 'UPDATE_TOKENS':
      return {
        ...state,
        tokensIn: state.tokensIn + action.input,
        tokensOut: state.tokensOut + action.output,
        cacheRead: state.cacheRead + action.cache,
      };
    case 'RESET_STREAMING':
      return { ...state, streamingText: '', activeTool: null };
    default:
      return state;
  }
}

export const App: React.FC<AppProps> = ({ config }) => {
  const { exit } = useApp();

  const [state, dispatch] = useReducer(uiReducer, {
    messages: [],
    streamingText: '',
    activeTool: null,
    isProcessing: false,
    tokensIn: 0,
    tokensOut: 0,
    cacheRead: 0,
  });

  const [history, setHistory] = useState<MessageParam[]>([]);
  const [inputValue, setInputValue] = useState('');

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
    dispatch({
      type: 'ADD_MESSAGE',
      message: {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
      },
    });

    setInputValue('');
    dispatch({ type: 'SET_PROCESSING', value: true });
    dispatch({ type: 'RESET_STREAMING' });

    // Update history for agent
    const newHistory: MessageParam[] = [...history, { role: 'user', content: trimmed }];

    let currentStreaming = '';

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
                  dispatch({
                    type: 'UPDATE_TOKENS',
                    input: parseInt(match[1], 10),
                    output: parseInt(match[2], 10),
                    cache: parseInt(match[3], 10),
                  });
                }
              } else if (!content.startsWith('[')) {
                currentStreaming += content;
                dispatch({ type: 'SET_STREAMING', text: currentStreaming });
              }
              break;
            }
            case 'tool_start':
              dispatch({ type: 'SET_TOOL', name: event.data.name as string });
              break;
            case 'tool_result': {
              dispatch({ type: 'SET_TOOL', name: null });
              dispatch({
                type: 'ADD_MESSAGE',
                message: {
                  id: `tool-${Date.now()}-${Math.random()}`,
                  role: 'tool',
                  content: (event.data.output as string).slice(0, 100),
                  toolName: event.data.name as string,
                },
              });
              break;
            }
            case 'done':
              // Move streaming text to messages
              if (currentStreaming) {
                dispatch({
                  type: 'ADD_MESSAGE',
                  message: {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    content: currentStreaming,
                  },
                });
              }
              break;
          }
        },
      });

      setHistory(updatedHistory);
    } catch (error) {
      dispatch({
        type: 'ADD_MESSAGE',
        message: {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      });
    } finally {
      dispatch({ type: 'RESET_STREAMING' });
      dispatch({ type: 'SET_PROCESSING', value: false });
    }
  }, [config, exit, history]);

  return (
    <Box flexDirection="column">
      <Header
        model={config.model}
        workDir={config.workDir}
        tokensIn={state.tokensIn}
        tokensOut={state.tokensOut}
        cacheRead={state.cacheRead}
      />
      <Box flexDirection="column" paddingY={1}>
        <MessageList messages={state.messages} />
        {state.activeTool && <ToolStatus toolName={state.activeTool} />}
        {state.streamingText && <StreamingText text={state.streamingText} />}
      </Box>
      <InputPrompt
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        disabled={state.isProcessing}
      />
    </Box>
  );
};
