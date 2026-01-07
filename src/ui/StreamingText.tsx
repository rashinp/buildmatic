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
