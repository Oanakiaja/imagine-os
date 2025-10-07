import { invokeClaudeCode } from './claude-code-agent';
import { IMAGINE_SYSTEM_PROMPT } from './prompt';
import type { AgentMessage } from '@imagine/shared';

export interface AgentOptions {
  maxTokens?: number;
}

const DEBUG_TEXT = ``;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function* debug() {
  yield {
    type: 'text' as const,
    data: DEBUG_TEXT,
    timestamp: Date.now(),
  };
  yield {
    type: 'complete' as const,
    data: '',
    timestamp: Date.now(),
  };
}

export async function* startImagineAgent(
  userPrompt: string,
  options: AgentOptions = {}
): AsyncGenerator<AgentMessage> {
  try {
    // yield* debug();
    // return Promise.resolve();
    const stream = invokeClaudeCode(userPrompt, IMAGINE_SYSTEM_PROMPT, {
      timeout: options.maxTokens ? options.maxTokens * 100 : undefined,
    });

    for await (const message of stream) {
      yield message;
    }
  } catch (error) {
    yield {
      type: 'error',
      data: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}
