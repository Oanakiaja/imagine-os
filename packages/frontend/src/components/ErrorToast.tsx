/**
 * ErrorToast Component - V1.0
 *
 * 错误提示组件
 *
 * 功能：
 * - 显示系统错误
 * - 支持重试操作
 * - 自动消失
 * - 分类显示（network, agent, parsing, unknown）
 *
 * 架构说明：
 * - 从 error store 读取错误列表
 * - 使用 Toast 样式显示错误
 * - 支持点击重试或关闭
 */

import { useEffect } from 'react';
import { X, RefreshCw, AlertCircle, Wifi, Brain, FileQuestion } from 'lucide-react';
import { useErrorStore } from '../store/error';
import type { ErrorState } from '@imagine/shared';

// 错误类型图标映射
const ERROR_ICONS = {
  network: Wifi,
  agent: Brain,
  parsing: FileQuestion,
  unknown: AlertCircle,
};

// 错误类型颜色映射
const ERROR_COLORS = {
  network: 'bg-orange-500',
  agent: 'bg-red-500',
  parsing: 'bg-yellow-500',
  unknown: 'bg-gray-500',
};

interface ErrorToastItemProps {
  error: ErrorState;
  onRetry: () => void;
  onClose: () => void;
}

function ErrorToastItem({ error, onRetry, onClose }: ErrorToastItemProps) {
  const Icon = ERROR_ICONS[error.type];
  const colorClass = ERROR_COLORS[error.type];

  return (
    <div className="bg-white rounded-lg shadow-xl border-l-4 border-red-500 p-4 mb-3 max-w-md animate-slide-in-right">
      <div className="flex items-start gap-3">
        {/* 图标 */}
        <div className={`${colorClass} p-2 rounded-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-semibold text-gray-900">
              {error.type === 'network' && '网络错误'}
              {error.type === 'agent' && 'Agent 错误'}
              {error.type === 'parsing' && '解析错误'}
              {error.type === 'unknown' && '未知错误'}
            </h4>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-2 break-words">{error.message}</p>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            {error.recoverable && error.retryCount < 3 && (
              <button
                onClick={onRetry}
                className="text-xs px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                重试 ({error.retryCount}/3)
              </button>
            )}

            {error.retryCount >= 3 && (
              <span className="text-xs text-red-600 font-medium">重试次数已用完</span>
            )}

            <span className="text-xs text-gray-400">
              {new Date(error.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ErrorToast() {
  const { errors, removeError, clearOldErrors } = useErrorStore();

  // 定期清理旧错误（超过 2 分钟）
  useEffect(() => {
    const interval = setInterval(() => {
      clearOldErrors(120000); // 2 分钟
    }, 30000); // 每 30 秒检查一次

    return () => clearInterval(interval);
  }, [clearOldErrors]);

  // 如果没有错误，不渲染
  if (errors.size === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] max-h-screen overflow-y-auto">
      {Array.from(errors.values()).map((error) => (
        <ErrorToastItem
          key={error.id}
          error={error}
          onRetry={() => {
            // 重试逻辑需要外部提供具体的重试函数
            // 这里只是示例，实际应用中需要根据错误类型决定重试操作
            console.log('Retry error:', error.id);
          }}
          onClose={() => removeError(error.id)}
        />
      ))}
    </div>
  );
}
