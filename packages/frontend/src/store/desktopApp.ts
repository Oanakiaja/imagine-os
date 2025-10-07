/**
 * Desktop App Store - V1.0
 *
 * 桌面应用状态管理
 *
 * 功能：
 * - 管理桌面应用图标
 * - 预定义系统应用（Trash, Claude Code, Claw'd）
 * - 支持添加自定义应用
 *
 * 架构说明：
 * - 使用 Zustand 管理应用列表
 * - 预置常用系统应用
 * - 支持持久化到 localStorage
 */

import { create } from 'zustand';
import type { DesktopApp } from '@imagine/shared';

interface DesktopAppStore {
  apps: Map<string, DesktopApp>;

  // Actions
  addApp: (app: Omit<DesktopApp, 'id'>) => void;
  removeApp: (id: string) => void;
  updateApp: (id: string, updates: Partial<DesktopApp>) => void;
  initializeDefaultApps: () => void;
}

// localStorage 键名
const STORAGE_KEY = 'imagine-os-desktop-apps';

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 默认桌面应用
 */
const DEFAULT_APPS: DesktopApp[] = [
  {
    id: 'app-trash',
    name: 'Trash',
    icon: '🗑️',
    action: 'system',
    actionData: 'trash',
    position: { x: 20, y: 20 },
  },
  {
    id: 'app-claude-code',
    name: 'Code',
    icon: '🤖',
    action: 'external',
    actionData: 'https://claude.ai/code',
    position: { x: 20, y: 120 },
  },
  {
    id: 'app-clawd',
    name: "Claw'd",
    icon: '🦀',
    action: 'window',
    actionData: {
      title: "Claw'd Game",
      prompt: 'Create an interactive crab game with pixel art character that can move around',
    },
    position: { x: 20, y: 220 },
  },
];

/**
 * 从 localStorage 加载应用
 */
function loadAppsFromStorage(): Map<string, DesktopApp> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const appsArray: DesktopApp[] = JSON.parse(data);
      return new Map(appsArray.map((app) => [app.id, app]));
    }
  } catch (error) {
    console.error('Failed to load apps from localStorage:', error);
  }
  return new Map();
}

/**
 * 保存应用到 localStorage
 */
function saveAppsToStorage(apps: Map<string, DesktopApp>) {
  try {
    const appsArray = Array.from(apps.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appsArray));
  } catch (error) {
    console.error('Failed to save apps to localStorage:', error);
  }
}

export const useDesktopAppStore = create<DesktopAppStore>((set) => ({
  apps: new Map(),

  /**
   * 添加应用
   */
  addApp: (appData) => {
    const id = generateId();
    const newApp: DesktopApp = {
      ...appData,
      id,
    };

    set((state) => {
      const newApps = new Map(state.apps);
      newApps.set(id, newApp);
      saveAppsToStorage(newApps);
      return { apps: newApps };
    });
  },

  /**
   * 移除应用
   */
  removeApp: (id) => {
    set((state) => {
      const newApps = new Map(state.apps);
      newApps.delete(id);
      saveAppsToStorage(newApps);
      return { apps: newApps };
    });
  },

  /**
   * 更新应用
   */
  updateApp: (id, updates) => {
    set((state) => {
      const newApps = new Map(state.apps);
      const app = newApps.get(id);
      if (app) {
        newApps.set(id, { ...app, ...updates });
        saveAppsToStorage(newApps);
      }
      return { apps: newApps };
    });
  },

  /**
   * 初始化默认应用
   * 如果 localStorage 为空，加载默认应用
   * 否则加载保存的应用
   */
  initializeDefaultApps: () => {
    const savedApps = loadAppsFromStorage();

    if (savedApps.size === 0) {
      // 没有保存的应用，使用默认应用
      const defaultAppsMap = new Map(DEFAULT_APPS.map((app) => [app.id, app]));
      saveAppsToStorage(defaultAppsMap);
      set({ apps: defaultAppsMap });
    } else {
      // 加载保存的应用
      set({ apps: savedApps });
    }
  },
}));
