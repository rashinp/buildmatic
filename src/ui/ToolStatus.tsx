// src/ui/ToolStatus.tsx

import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { colors } from './theme.js';

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
