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
