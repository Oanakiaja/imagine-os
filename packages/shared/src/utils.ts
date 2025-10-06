import type { AgentAction, WindowSize } from './types';

/**
 * 解析 Agent 输出为结构化的 Action
 */
export function parseAgentOutput(text: string): AgentAction | null {
  // WINDOW NEW → id: xxx, title: "xxx", size: md
  const windowNewMatch = text.match(/WINDOW NEW.*?id:\s*(\S+).*?title:\s*"([^"]+)"(?:.*?size:\s*(sm|md|lg|xl))?/);
  if (windowNewMatch) {
    return {
      type: 'WINDOW_NEW',
      id: windowNewMatch[1],
      title: windowNewMatch[2],
      size: (windowNewMatch[3] as WindowSize) || 'md',
    };
  }

  // DOM REPLACE HTML → selector: #xxx
  const windowUpdateMatch = text.match(/DOM REPLACE HTML.*?selector:\s*#(\S+)/);
  if (windowUpdateMatch) {
    // 内容在下一行
    const contentMatch = text.match(/HTML CONTENT:\s*([\s\S]+?)(?=\n\n|$)/);
    if (contentMatch) {
      return {
        type: 'WINDOW_UPDATE',
        id: windowUpdateMatch[1].replace(/\s+\.window-content$/, ''),
        content: contentMatch[1].trim(),
      };
    }
  }

  // INIT TOOL
  const initToolMatch = text.match(/INIT\s+(\w+)/);
  if (initToolMatch) {
    return {
      type: 'INIT_TOOL',
      tool: initToolMatch[1],
    };
  }

  // WINDOW CLOSE
  const windowCloseMatch = text.match(/WINDOW CLOSE.*?id:\s*(\S+)/);
  if (windowCloseMatch) {
    return {
      type: 'WINDOW_CLOSE',
      id: windowCloseMatch[1],
    };
  }

  return null;
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 判断代码是否完整（简单策略）
 */
export function isCodeComplete(code: string): boolean {
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  return openBraces === closeBraces && openBraces > 0;
}

/**
 * SSE 消息解析器
 */
export function parseSSE(data: string): Record<string, any> | null {
  if (!data.startsWith('data: ')) return null;
  
  try {
    return JSON.parse(data.slice(6));
  } catch {
    return null;
  }
}
