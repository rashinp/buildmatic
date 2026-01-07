// src/ui/App.tsx

import React, { useState, useCallback, useRef } from 'react';
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

  // Ref to track streaming text for final message
  const streamingRef = useRef('');

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
    streamingRef.current = '';

    // Update history for agent
    const newHistory: MessageParam[] = [...history, { role: 'user', content: trimmed }];

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
              } else if (!content.startsWith('[')) {
                // Skip other bracketed status messages
                streamingRef.current += content;
                setStreamingText(streamingRef.current);
              }
              break;
            }
            case 'tool_start':
              setActiveTool(event.data.name as string);
              break;
            case 'tool_result': {
              setActiveTool(null);
              const toolMessage: Message = {
                id: `tool-${Date.now()}-${Math.random()}`,
                role: 'tool',
                content: (event.data.output as string).slice(0, 100),
                toolName: event.data.name as string,
              };
              setMessages((prev) => [...prev, toolMessage]);
              break;
            }
            case 'done':
              // Move streaming text to messages
              if (streamingRef.current) {
                const assistantMessage: Message = {
                  id: `assistant-${Date.now()}`,
                  role: 'assistant',
                  content: streamingRef.current,
                };
                setMessages((prev) => [...prev, assistantMessage]);
              }
              break;
          }
        },
      });

      setHistory(updatedHistory);
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : String(error)}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setStreamingText('');
      streamingRef.current = '';
      setActiveTool(null);
      setIsProcessing(false);
    }
  }, [config, exit, history]);

  return (
    <Box flexDirection="column">
      <Header
        model={config.model}
        workDir={config.workDir}
        tokensIn={tokensIn}
        tokensOut={tokensOut}
        cacheRead={cacheRead}
      />
      <Box flexDirection="column" paddingY={1}>
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
