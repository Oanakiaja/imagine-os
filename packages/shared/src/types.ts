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
  | { type: 'WINDOW_CLOSE'; id: string }
  | { type: 'TEXT_STREAM'; text: string }
  | { type: 'THINKING'; text: string }
  | { type: 'INIT_TOOL'; tool: string }
  | { type: 'ERROR'; message: string }
  | { type: 'COMPLETE' };

// Agent 消息类型
export interface AgentMessage {
  type: 'action' | 'text' | 'error' | 'complete';
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
