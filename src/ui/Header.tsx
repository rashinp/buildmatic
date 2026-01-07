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
