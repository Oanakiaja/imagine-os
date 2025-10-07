/**
 * Sticky Note Store - V1.0
 *
 * 便签状态管理
 *
 * 功能：
 * - 创建、更新、删除便签
 * - 持久化到 localStorage
 * - 自动加载保存的便签
 *
 * 架构说明：
 * - 使用 Zustand 管理便签状态
 * - 使用 localStorage 持久化数据
 * - 提供 CRUD 操作的 actions
 */

import { create } from 'zustand';
import type { StickyNote } from '@imagine/shared';

interface StickyNoteStore {
  notes: Map<string, StickyNote>;

  // Actions
  createNote: (color?: StickyNote['color']) => void;
  updateNote: (id: string, updates: Partial<StickyNote>) => void;
  deleteNote: (id: string) => void;
  loadNotes: () => void;
  saveNotes: () => void;
}

// localStorage 键名
const STORAGE_KEY = 'imagine-os-sticky-notes';

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 从 localStorage 加载便签
 */
function loadNotesFromStorage(): Map<string, StickyNote> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const notesArray: StickyNote[] = JSON.parse(data);
      return new Map(notesArray.map((note) => [note.id, note]));
    }
  } catch (error) {
    console.error('Failed to load notes from localStorage:', error);
  }
  return new Map();
}

/**
 * 保存便签到 localStorage
 */
function saveNotesToStorage(notes: Map<string, StickyNote>) {
  try {
    const notesArray = Array.from(notes.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notesArray));
  } catch (error) {
    console.error('Failed to save notes to localStorage:', error);
  }
}

export const useStickyNoteStore = create<StickyNoteStore>((set, get) => ({
  notes: new Map(),

  /**
   * 创建新便签
   */
  createNote: (color = 'yellow') => {
    const id = generateId();
    const newNote: StickyNote = {
      id,
      content: '',
      position: {
        x: 50 + Math.random() * 200,
        y: 50 + Math.random() * 200,
      },
      size: {
        width: 200,
        height: 150,
      },
      color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state) => {
      const newNotes = new Map(state.notes);
      newNotes.set(id, newNote);
      saveNotesToStorage(newNotes);
      return { notes: newNotes };
    });
  },

  /**
   * 更新便签
   */
  updateNote: (id, updates) => {
    set((state) => {
      const newNotes = new Map(state.notes);
      const note = newNotes.get(id);
      if (note) {
        newNotes.set(id, { ...note, ...updates, updatedAt: Date.now() });
        saveNotesToStorage(newNotes);
      }
      return { notes: newNotes };
    });
  },

  /**
   * 删除便签
   */
  deleteNote: (id) => {
    set((state) => {
      const newNotes = new Map(state.notes);
      newNotes.delete(id);
      saveNotesToStorage(newNotes);
      return { notes: newNotes };
    });
  },

  /**
   * 从 localStorage 加载便签
   */
  loadNotes: () => {
    const notes = loadNotesFromStorage();
    set({ notes });
  },

  /**
   * 手动保存便签到 localStorage
   */
  saveNotes: () => {
    const { notes } = get();
    saveNotesToStorage(notes);
  },
}));
