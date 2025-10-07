import { invokeClaudeCode } from './claude-code-agent';
import { IMAGINE_SYSTEM_PROMPT } from './prompt';
import type { AgentMessage } from '@imagine/shared';

export interface AgentOptions {
  maxTokens?: number;
}

export async function* startImagineAgent(
  userPrompt: string,
  options: AgentOptions = {}
): AsyncGenerator<AgentMessage> {
  try {
    const stream = invokeClaudeCode(userPrompt, IMAGINE_SYSTEM_PROMPT, {
      timeout: options.maxTokens ? options.maxTokens * 100 : 60000, // 根据 token 数估算超时
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
