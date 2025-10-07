/**
 * Error Recovery Store - V1.0
 *
 * 错误恢复状态管理
 *
 * 功能：
 * - 记录系统错误
 * - 提供错误恢复机制
 * - 自动重试失败的操作
 * - 显示用户友好的错误提示
 *
 * 架构说明：
 * - 使用 Zustand 管理错误状态
 * - 支持错误分类（network, agent, parsing, unknown）
 * - 提供重试计数器，防止无限重试
 * - 自动清理过期错误
 */

import { create } from 'zustand';
import type { ErrorState } from '@imagine/shared';

interface ErrorStore {
  errors: Map<string, ErrorState>;
  maxRetries: number;

  // Actions
  addError: (type: ErrorState['type'], message: string, recoverable?: boolean) => string;
  removeError: (id: string) => void;
  retryError: (id: string, retryFn: () => Promise<void>) => Promise<void>;
  clearErrors: () => void;
  clearOldErrors: (maxAge: number) => void;
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useErrorStore = create<ErrorStore>((set, get) => ({
  errors: new Map(),
  maxRetries: 3,

  /**
   * 添加错误
   */
  addError: (type, message, recoverable = true) => {
    const id = generateId();
    const error: ErrorState = {
      id,
      type,
      message,
      timestamp: Date.now(),
      recoverable,
      retryCount: 0,
    };

    set((state) => {
      const newErrors = new Map(state.errors);
      newErrors.set(id, error);
      return { errors: newErrors };
    });

    // 自动清理 30 秒前的错误
    setTimeout(() => {
      get().removeError(id);
    }, 30000);

    return id;
  },

  /**
   * 移除错误
   */
  removeError: (id) => {
    set((state) => {
      const newErrors = new Map(state.errors);
      newErrors.delete(id);
      return { errors: newErrors };
    });
  },

  /**
   * 重试错误操作
   */
  retryError: async (id, retryFn) => {
    const { errors, maxRetries } = get();
    const error = errors.get(id);

    if (!error) return;

    // 检查是否可恢复和重试次数
    if (!error.recoverable || error.retryCount >= maxRetries) {
      console.error(`Error ${id} cannot be retried:`, error);
      return;
    }

    // 增加重试计数
    set((state) => {
      const newErrors = new Map(state.errors);
      const updatedError = newErrors.get(id);
      if (updatedError) {
        updatedError.retryCount++;
        newErrors.set(id, updatedError);
      }
      return { errors: newErrors };
    });

    try {
      // 执行重试函数
      await retryFn();

      // 成功后移除错误
      get().removeError(id);
    } catch (retryError) {
      console.error(`Retry failed for error ${id}:`, retryError);

      // 如果重试次数用完，标记为不可恢复
      const currentError = get().errors.get(id);
      if (currentError && currentError.retryCount >= maxRetries) {
        set((state) => {
          const newErrors = new Map(state.errors);
          const errorToUpdate = newErrors.get(id);
          if (errorToUpdate) {
            errorToUpdate.recoverable = false;
            newErrors.set(id, errorToUpdate);
          }
          return { errors: newErrors };
        });
      }
    }
  },

  /**
   * 清除所有错误
   */
  clearErrors: () => {
    set({ errors: new Map() });
  },

  /**
   * 清除超过指定时间的旧错误
   */
  clearOldErrors: (maxAge) => {
    const now = Date.now();
    set((state) => {
      const newErrors = new Map(state.errors);
      for (const [id, error] of newErrors) {
        if (now - error.timestamp > maxAge) {
          newErrors.delete(id);
        }
      }
      return { errors: newErrors };
    });
  },
}));

/**
 * 错误恢复工具函数
 */
export const ErrorRecovery = {
  /**
   * 网络错误恢复
   */
  async handleNetworkError(error: Error, retryFn: () => Promise<void>) {
    const store = useErrorStore.getState();
    const errorId = store.addError('network', error.message, true);

    // 等待 2 秒后自动重试
    setTimeout(async () => {
      await store.retryError(errorId, retryFn);
    }, 2000);

    return Promise.resolve(errorId);
  },

  /**
   * Agent 错误恢复
   */
  async handleAgentError(error: Error) {
    const store = useErrorStore.getState();
    return Promise.resolve(store.addError('agent', error.message, false));
  },

  /**
   * 解析错误恢复
   */
  async handleParsingError(error: Error, rawData: string) {
    const store = useErrorStore.getState();
    const message = `解析失败: ${error.message}\n原始数据: ${rawData.substring(0, 100)}...`;
    return Promise.resolve(store.addError('parsing', message, false));
  },

  /**
   * 未知错误
   */
  async handleUnknownError(error: unknown) {
    const store = useErrorStore.getState();
    const message = error instanceof Error ? error.message : String(error);
    return Promise.resolve(store.addError('unknown', message, false));
  },
};
