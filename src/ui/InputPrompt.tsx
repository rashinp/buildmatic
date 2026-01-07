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
