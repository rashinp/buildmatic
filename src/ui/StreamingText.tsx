// src/ui/StreamingText.tsx

import React from 'react';
import { Box, Text } from 'ink';
import { colors } from './theme.js';

interface StreamingTextProps {
  text: string;
}

export const StreamingText: React.FC<StreamingTextProps> = ({ text }) => {
  if (!text) return null;

  return (
    <Box flexDirection="column">
      <Text color={colors.muted} dimColor>Assistant:</Text>
      <Text>{text}</Text>
    </Box>
  );
};
