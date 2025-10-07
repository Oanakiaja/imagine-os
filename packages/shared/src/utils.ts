import type { AgentAction, WindowSize } from './types';

/**
 * 解析 Agent 输出为结构化的 Action
 *
 * 支持的格式：
 * - WINDOW NEW → id: xxx, title: "xxx", size: md
 * - DOM REPLACE HTML → selector: #xxx
 *   HTML CONTENT: <html>
 * - WINDOW CLOSE → id: xxx
 *
 * 注意：selector 中的 #xxx 是 window-id，不是真的 CSS selector
 */
export function parseAgentOutput(text: string): AgentAction[] {
  // 清理文本，移除多余空白
  const cleanText = text.trim();
  const actions: AgentAction[] = [];
  // WINDOW NEW → id: xxx, title: "xxx", size: md
  const windowNewMatch = cleanText.match(
    /WINDOW NEW\s*→\s*id:\s*([a-zA-Z0-9-_]+)[\s,]*title:\s*"([^"]+)"(?:[\s,]*size:\s*(sm|md|lg|xl))?/i
  );
  if (windowNewMatch) {
    actions.push({
      type: 'WINDOW_NEW',
      id: windowNewMatch[1],
      title: windowNewMatch[2],
      size: (windowNewMatch[3] as WindowSize) || 'md',
    });
  }

  // DOM REPLACE HTML + HTML CONTENT (可能在同一消息或累积的缓冲区中)
  // 先查找 selector
  const selectorMatch = cleanText.match(/DOM REPLACE HTML\s*→\s*selector:\s*#([a-zA-Z0-9-_]+)/i);
  if (selectorMatch) {
    const windowId = selectorMatch[1];

    // 然后查找 HTML CONTENT，但要在遇到 WINDOW SCRIPT 之前停止
    // 使用非贪婪匹配，并且在遇到 WINDOW 关键字时停止
    const htmlContentMatch = cleanText.match(
      /HTML CONTENT:\s*([\s\S]+?)(?=\n\s*WINDOW\s+(?:SCRIPT|CLOSE|NEW)|$)/i
    );

    if (htmlContentMatch) {
      let htmlContent = htmlContentMatch[1].trim();

      // 移除可能包含的 <style> 标签后的内容（如果紧跟着 WINDOW 命令）
      htmlContent = htmlContent.replace(/\n\s*WINDOW\s+(?:SCRIPT|CLOSE|NEW)[\s\S]*$/i, '').trim();

      // 验证 HTML 至少有一些标签
      if (htmlContent.includes('<') && htmlContent.includes('>')) {
        actions.push({
          type: 'WINDOW_UPDATE',
          id: windowId,
          content: htmlContent,
        });
      }
    }
  }

  // WINDOW SCRIPT → id: xxx
  const scriptMatch = cleanText.match(/WINDOW SCRIPT\s*→\s*id:\s*([a-zA-Z0-9-_]+)/i);
  if (scriptMatch) {
    const windowId = scriptMatch[1];

    // 查找 SCRIPT CONTENT，到文件结尾或下一个 WINDOW 命令
    const scriptContentMatch = cleanText.match(
      /SCRIPT CONTENT:\s*([\s\S]+?)(?=\n\s*WINDOW\s+(?:NEW|CLOSE|SCRIPT)|$)/i
    );

    if (scriptContentMatch) {
      const scriptContent = scriptContentMatch[1].trim();

      actions.push({
        type: 'WINDOW_SCRIPT',
        id: windowId,
        script: scriptContent,
      });
    }
  }

  // WINDOW CLOSE → id: xxx
  const windowCloseMatch = cleanText.match(/WINDOW CLOSE\s*→\s*id:\s*([a-zA-Z0-9-_]+)/i);
  if (windowCloseMatch) {
    actions.push({
      type: 'WINDOW_CLOSE',
      id: windowCloseMatch[1],
    });
  }

  return actions;
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
