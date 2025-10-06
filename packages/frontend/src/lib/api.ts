import type { AgentMessage, ImagineRequest } from '@imagine/shared';
import { parseSSE } from '@imagine/shared';

export async function* streamImagine(prompt: string): AsyncGenerator<AgentMessage> {
  const request: ImagineRequest = { prompt };

  const response = await fetch('/api/imagine', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is null');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line === 'data: [DONE]') {
        return;
      }

      const data = parseSSE(line);
      if (data) {
        yield data as AgentMessage;
      }
    }
  }
}
