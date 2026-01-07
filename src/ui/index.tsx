// src/ui/index.tsx

import React from 'react';
import { render } from 'ink';
import { App } from './App.js';
import type { AgentConfig } from '../agent/types.js';

export async function startUI(config: AgentConfig): Promise<void> {
  const { waitUntilExit } = render(<App config={config} />);
  await waitUntilExit();
}
