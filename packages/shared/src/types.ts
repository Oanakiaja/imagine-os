// Window 状态类型
export type WindowStatus = 'creating' | 'loading' | 'ready' | 'error';

export interface ImagineWindow {
  id: string;
  title: string;
  status: WindowStatus;
  content: string | null;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
}

// Agent 动作类型
export type AgentAction =
  | { type: 'WINDOW_NEW'; id: string; title: string; size?: WindowSize }
  | { type: 'WINDOW_UPDATE'; id: string; content: string }
  | { type: 'WINDOW_CLOSE'; id: string };

// Agent 消息类型
export interface AgentMessage {
  type: 'text' | 'error' | 'complete';
  data: AgentAction | string;
  timestamp: number;
}

// 窗口尺寸类型
export type WindowSize = 'sm' | 'md' | 'lg' | 'xl';

export const WINDOW_SIZES: Record<WindowSize, { width: number; height: number }> = {
  sm: { width: 400, height: 300 },
  md: { width: 600, height: 400 },
  lg: { width: 800, height: 600 },
  xl: { width: 1000, height: 700 },
} as const;

// API 请求/响应类型
export interface ImagineRequest {
  prompt: string;
  sessionId?: string;
}

export interface ImagineResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Sticky Note 类型
export interface StickyNote {
  id: string;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: 'yellow' | 'pink' | 'blue' | 'green';
  createdAt: number;
  updatedAt: number;
}

// Desktop App 类型
export interface DesktopApp {
  id: string;
  name: string;
  icon: string; // URL or emoji
  action: 'window' | 'external' | 'system';
  actionData?: any; // Window ID, URL, etc.
  position: { x: number; y: number };
}

// Error Recovery 类型
export interface ErrorState {
  id: string;
  type: 'network' | 'agent' | 'parsing' | 'unknown';
  message: string;
  timestamp: number;
  recoverable: boolean;
  retryCount: number;
}

// Claude Code output-format json
export interface ClaudeCodeResult {
  type: 'result';
  subtype: 'success' | 'error';
  is_error: boolean;
  duration_ms: number;
  duration_api_ms: number;
  num_turns: number;
  result: string;
  session_id: string;
  total_cost_usd: number;
  usage: {
    input_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
    output_tokens: number;
    server_tool_use: {
      web_search_requests: number;
    };
    service_tier: string;
    cache_creation: {
      ephemeral_1h_input_tokens: number;
      ephemeral_5m_input_tokens: number;
    };
  };
  modelUsage: {
    // claude-sonnet-4-5-20250929
    [modelName: string]: {
      inputTokens: number;
      outputTokens: number;
      cacheReadInputTokens: number;
      cacheCreationInputTokens: number;
      webSearchRequests: number;
      costUSD: number;
      contextWindow: number;
    };
  };
  permission_denials: string[];
  uuid: string;
}
