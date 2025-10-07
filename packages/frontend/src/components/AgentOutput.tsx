/**
 * AgentOutput Component
 *
 * 显示 Claude Code 的实时输出
 * 位于屏幕中央上方的红框区域
 */

import { useEffect, useRef } from 'react';

interface AgentOutputProps {
  messages: string[];
  isGenerating: boolean;
}

export function AgentOutput({ messages, isGenerating }: AgentOutputProps) {
  const outputRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2  w-full max-w-2xl px-4 z-30  duration-300 opacity-70">
      <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-lg rounded-3xl shadow-2xl  overflow-hidden">
        {/* Output Content */}
        <div
          ref={outputRef}
          className="max-h-80 overflow-y-auto p-6 space-y-3 bg-gray-900 text-gray-100 font-mono text-sm scrollbar-thin scrollbar-thumb-red-500 scrollbar-track-gray-800"
        >
          {messages.length === 0 ? (
            <div className="text-gray-500 italic flex items-center gap-2">
              <span>hi I'am imagine os...</span>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className="leading-relaxed whitespace-pre-wrap break-words animate-in fade-in slide-in-from-bottom-2 duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-red-400 mr-2">›</span>
                <span className="text-gray-100">{message}</span>
              </div>
            ))
          )}
          {isGenerating && (
            <div className="flex items-center gap-2 text-red-400">
              <span className="animate-pulse text-xl">▋</span>
              <span className="text-xs text-gray-500">Claude 回复中...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
