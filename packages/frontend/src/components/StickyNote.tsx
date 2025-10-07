/**
 * StickyNote Component - V1.0
 *
 * 可编辑的便签组件
 *
 * 功能：
 * - 点击编辑内容
 * - 拖拽移动位置
 * - 多种颜色选择
 * - 自动保存（通过 store）
 * - 删除便签
 *
 * 架构说明：
 * - 使用 contentEditable 实现富文本编辑
 * - 拖拽逻辑与 Window 组件类似
 * - 通过 Zustand store 持久化便签状态
 */

import { useRef, useState, useEffect } from 'react';
import { X, GripVertical } from 'lucide-react';
import type { StickyNote as StickyNoteType } from '@imagine/shared';

interface StickyNoteProps {
  note: StickyNoteType;
  onUpdate: (id: string, updates: Partial<StickyNoteType>) => void;
  onDelete: (id: string) => void;
}

// 颜色映射
const COLOR_CLASSES = {
  yellow: 'bg-yellow-200 border-yellow-300',
  pink: 'bg-pink-200 border-pink-300',
  blue: 'bg-blue-200 border-blue-300',
  green: 'bg-green-200 border-green-300',
};

export function StickyNote({ note, onUpdate, onDelete }: StickyNoteProps) {
  const noteRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const gripRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);

  /**
   * 开始拖拽
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    // 只有点击握把或非内容区域才能拖拽
    if (
      e.target === gripRef.current ||
      gripRef.current?.contains(e.target as Node) ||
      (e.target === noteRef.current && !isEditing)
    ) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - note.position.x,
        y: e.clientY - note.position.y,
      });
    }
  };

  /**
   * 拖拽逻辑
   */
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      onUpdate(note.id, {
        position: {
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        },
        updatedAt: Date.now(),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, note.id, note.position, onUpdate]);

  /**
   * 内容编辑处理
   */
  const handleContentChange = () => {
    if (contentRef.current) {
      const newContent = contentRef.current.innerText;
      onUpdate(note.id, {
        content: newContent,
        updatedAt: Date.now(),
      });
    }
  };

  /**
   * 点击便签进入编辑模式
   */
  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
      setTimeout(() => {
        contentRef.current?.focus();
      }, 0);
    }
  };

  /**
   * 失去焦点退出编辑模式
   */
  const handleBlur = () => {
    setIsEditing(false);
    handleContentChange();
  };

  /**
   * 快捷键支持
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Esc 退出编辑
    if (e.key === 'Escape') {
      contentRef.current?.blur();
    }
  };

  return (
    <div
      ref={noteRef}
      className={`absolute shadow-lg border-2 rounded-lg p-3 cursor-move select-none transition-transform hover:scale-105 ${
        COLOR_CLASSES[note.color]
      } ${isDragging ? 'scale-105 shadow-2xl' : ''}`}
      style={{
        left: note.position.x,
        top: note.position.y,
        width: note.size.width,
        minHeight: note.size.height,
        zIndex: isDragging ? 1000 : 10,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between mb-2 opacity-60 hover:opacity-100 transition-opacity">
        <div ref={gripRef} className="cursor-grab active:cursor-grabbing p-1" title="拖动便签">
          <GripVertical className="h-4 w-4 text-gray-600" />
        </div>
        <button
          className="p-1 hover:bg-red-200 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          title="删除便签"
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* 便签内容（可编辑） */}
      <div
        ref={contentRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        className={`outline-none text-gray-800 font-handwriting min-h-[80px] ${
          isEditing ? 'cursor-text' : 'cursor-move'
        }`}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{
          WebkitUserModify: isEditing ? 'read-write' : 'read-only',
        }}
      >
        {note.content}
      </div>

      {/* 编辑提示 */}
      {!isEditing && note.content === '' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-gray-400 text-sm italic">点击编辑...</p>
        </div>
      )}
    </div>
  );
}
