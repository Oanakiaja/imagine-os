import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { imagineRouter } from './routes/imagine';
import { serve } from '@hono/node-server';
import { config } from 'dotenv';

// Load environment variables with explicit path
config();

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173'],
    credentials: true,
  })
);

// Routes
app.route('/api/imagine', imagineRouter);

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

const port = Number(process.env.PORT || 3001);

const server = serve({
  port: port,
  fetch: app.fetch,
});

console.log(`🚀 Server running on http://localhost:${port}`);

// graceful shutdown
process.on('SIGINT', () => {
  server.close();
  process.exit(0);
});
process.on('SIGTERM', () => {
  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    process.exit(0);
  });
});
