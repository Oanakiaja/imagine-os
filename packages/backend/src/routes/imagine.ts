import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { startImagineAgent } from '../lib/agent';
import type { ImagineRequest } from '@imagine/shared';

export const imagineRouter = new Hono();

imagineRouter.post('/', async (c) => {
  const body = await c.req.json<ImagineRequest>();
  const { prompt } = body;

  if (!prompt) {
    return c.json({ error: 'Prompt is required' }, 400);
  }

  return stream(c, async (stream) => {
    // 设置 SSE headers
    stream.onAbort(() => {
      console.log('Client disconnected');
    });

    try {
      for await (const message of startImagineAgent(prompt)) {
        await stream.write(`data: ${JSON.stringify(message)}\n\n`);
      }

      await stream.write('data: [DONE]\n\n');
    } catch (error) {
      console.error('Stream error:', error);
      await stream.write(
        `data: ${JSON.stringify({
          type: 'error',
          data: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        })}\n\n`
      );
    }
  });
});

// 测试端点
imagineRouter.get('/test', (c) => {
  return c.json({
    message: 'Imagine API is working',
    timestamp: Date.now(),
  });
});
