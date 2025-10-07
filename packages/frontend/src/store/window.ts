import { create } from 'zustand';
import type { ImagineWindow, WindowSize } from '@imagine/shared';
import { WINDOW_SIZES } from '@imagine/shared';

interface WindowStore {
  windows: Map<string, ImagineWindow>;
  maxZIndex: number;

  // Actions
  createWindow: (id: string, title: string, size?: WindowSize) => void;
  updateWindow: (id: string, content: string) => void;
  setWindowScript: (id: string, script: string) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, width: number, height: number) => void;
  toggleMinimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
}

export const useWindowStore = create<WindowStore>((set) => ({
  windows: new Map(),
  maxZIndex: 1,

  createWindow: (id, title, size = 'md') => {
    const sizeConfig = WINDOW_SIZES[size];
    const centerX = (window.innerWidth - sizeConfig.width) / 2;
    const centerY = (window.innerHeight - sizeConfig.height) / 2;

    set((state) => {
      const newWindows = new Map(state.windows);
      newWindows.set(id, {
        id,
        title,
        status: 'creating',
        content: null,
        position: { x: centerX + Math.random() * 50, y: centerY + Math.random() * 50 },
        size: sizeConfig,
        zIndex: state.maxZIndex + 1,
        isMinimized: false,
        isMaximized: false,
      });
      return {
        windows: newWindows,
        maxZIndex: state.maxZIndex + 1,
      };
    });
  },

  updateWindow: (id, content) => {
    set((state) => {
      const newWindows = new Map(state.windows);
      const window = newWindows.get(id);
      if (window) {
        window.status = 'ready';
        window.content = content;
      }
      return { windows: newWindows };
    });
  },

  setWindowScript: (id, script) => {
    set((state) => {
      const newWindows = new Map(state.windows);
      const window = newWindows.get(id);
      if (window) {
        window.script = script;
      }
      return { windows: newWindows };
    });
  },

  closeWindow: (id) => {
    set((state) => {
      const newWindows = new Map(state.windows);
      newWindows.delete(id);
      return { windows: newWindows };
    });
  },

  focusWindow: (id) => {
    set((state) => {
      const newWindows = new Map(state.windows);
      const window = newWindows.get(id);
      if (window) {
        window.zIndex = state.maxZIndex + 1;
      }
      return {
        windows: newWindows,
        maxZIndex: state.maxZIndex + 1,
      };
    });
  },

  moveWindow: (id, x, y) => {
    set((state) => {
      const newWindows = new Map(state.windows);
      const window = newWindows.get(id);
      if (window) {
        window.position = { x, y };
      }
      return { windows: newWindows };
    });
  },

  resizeWindow: (id, width, height) => {
    set((state) => {
      const newWindows = new Map(state.windows);
      const window = newWindows.get(id);
      if (window) {
        window.size = { width, height };
      }
      return { windows: newWindows };
    });
  },

  toggleMinimize: (id) => {
    set((state) => {
      const newWindows = new Map(state.windows);
      const window = newWindows.get(id);
      if (window) {
        window.isMinimized = !window.isMinimized;
      }
      return { windows: newWindows };
    });
  },

  toggleMaximize: (id) => {
    set((state) => {
      const newWindows = new Map(state.windows);
      const window = newWindows.get(id);
      if (window) {
        window.isMaximized = !window.isMaximized;
      }
      return { windows: newWindows };
    });
  },
}));
