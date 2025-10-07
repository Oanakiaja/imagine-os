/**
 * Desktop Component - V1.0
 *
 * 改进的桌面组件，集成所有新功能
 *
 * 新功能：
 * - 可编辑的便签系统
 * - 桌面应用图标
 * - 错误恢复提示
 * - HTML 清理后的窗口
 * - 平滑动画
 *
 * 架构说明：
 * - 统一管理所有桌面元素（窗口、便签、图标）
 * - 集成错误处理和恢复
 * - 支持右键菜单（未来扩展）
 * - 使用新版 Window 组件
 */

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Window } from './Window';
import { StickyNote } from './StickyNote';
import { DesktopIcon } from './DesktopIcon';
import { CommandInput } from './CommandInput';
import { ErrorToast } from './ErrorToast';
import { useWindowStore } from '../store/window';
import { useStickyNoteStore } from '../store/stickyNote';
import { useDesktopAppStore } from '../store/desktopApp';
import { ErrorRecovery } from '../store/error';
import { streamImagine } from '../lib/api';
import { parseAgentOutput } from '@imagine/shared';
import type { DesktopApp } from '@imagine/shared';

export function Desktop() {
  // Windows
  const { windows, createWindow, updateWindow } = useWindowStore();

  // Sticky Notes
  const { notes, createNote, updateNote, deleteNote, loadNotes } = useStickyNoteStore();

  // Desktop Apps
  const { apps, initializeDefaultApps } = useDesktopAppStore();

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * 初始化：加载便签和桌面应用
   */
  useEffect(() => {
    loadNotes();
    initializeDefaultApps();
  }, [loadNotes, initializeDefaultApps]);

  /**
   * 处理命令输入
   */
  const handleCommand = async (prompt: string) => {
    setIsGenerating(true);

    try {
      for await (const message of streamImagine(prompt)) {
        // 处理文本消息
        if (
          message.type === 'text' &&
          typeof message.data === 'object' &&
          'content' in message.data
        ) {
          const content = message.data.content;

          if (Array.isArray(content)) {
            for (const item of content) {
              if (item.type === 'text') {
                const action = parseAgentOutput(item.text);

                if (action) {
                  switch (action.type) {
                    case 'WINDOW_NEW':
                      createWindow(action.id, action.title, action.size);
                      break;

                    case 'WINDOW_UPDATE':
                      updateWindow(action.id, action.content);
                      break;

                    // 未来可以添加更多 action 类型
                  }
                }
              }
            }
          }
        }

        // 处理错误消息
        if (message.type === 'error') {
          await ErrorRecovery.handleAgentError(
            new Error(typeof message.data === 'string' ? message.data : 'Unknown error')
          );
        }
      }
    } catch (error) {
      // 网络错误恢复
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
          await ErrorRecovery.handleNetworkError(error, () => handleCommand(prompt));
        } else {
          await ErrorRecovery.handleUnknownError(error);
        }
      }
      console.error('Error generating:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 处理桌面应用点击
   */
  const handleAppAction = async (app: DesktopApp) => {
    switch (app.action) {
      case 'window':
        // 创建窗口
        if (app.actionData?.prompt) {
          await handleCommand(app.actionData.prompt);
        }
        break;

      case 'external':
        // 打开外部链接
        if (app.actionData) {
          window.open(app.actionData, '_blank');
        }
        break;

      case 'system':
        // 系统操作（如 Trash）
        if (app.actionData === 'trash') {
          // 未来可以实现回收站功能
          console.log('Open trash');
        }
        break;
    }
  };

  /**
   * 右键菜单：创建便签
   */
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // 未来可以添加完整的右键菜单
    console.log('Right click at:', e.clientX, e.clientY);
  };

  /**
   * 快捷键：创建便签
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N / Cmd+N - 创建新便签
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createNote();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNote]);

  return (
    <div
      className="relative w-screen h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-200 overflow-hidden"
      onContextMenu={handleContextMenu}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none" />

      {/* 桌面应用图标 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="pointer-events-auto">
          {Array.from(apps.values()).map((app) => (
            <DesktopIcon key={app.id} app={app} onAction={(app) => void handleAppAction(app)} />
          ))}
        </div>
      </div>

      {/* 便签 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="pointer-events-auto">
          {Array.from(notes.values()).map((note) => (
            <StickyNote key={note.id} note={note} onUpdate={updateNote} onDelete={deleteNote} />
          ))}
        </div>
      </div>

      {/* 窗口 */}
      {Array.from(windows.values()).map((window) => (
        <Window key={window.id} window={window} />
      ))}

      {/* 命令输入 */}
      <CommandInput onSubmit={(prompt) => void handleCommand(prompt)} disabled={isGenerating} />

      {/* 加载指示器 */}
      {isGenerating && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 z-50">
          <div className="animate-spin h-5 w-5 border-3 border-blue-500 border-t-transparent rounded-full" />
          <span className="text-sm font-medium text-gray-700">Agent 正在生成...</span>
        </div>
      )}

      {/* 错误提示 */}
      <ErrorToast />

      {/* 快速操作按钮（右下角） */}
      <div className="fixed bottom-24 right-8 flex flex-col gap-3 z-40">
        {/* 创建便签按钮 */}
        <button
          onClick={() => createNote()}
          className="group bg-white hover:bg-yellow-100 p-4 rounded-full shadow-lg hover:shadow-xl transition-all"
          title="创建便签 (Ctrl+N)"
        >
          <Plus className="h-6 w-6 text-gray-700 group-hover:text-yellow-600 transition-colors" />
        </button>

        {/* 颜色选择菜单（悬停显示） */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
          <div className="flex flex-col gap-2 bg-white p-2 rounded-lg shadow-lg">
            <button
              onClick={() => createNote('yellow')}
              className="w-8 h-8 bg-yellow-200 border-2 border-yellow-300 rounded hover:scale-110 transition-transform"
              title="黄色便签"
            />
            <button
              onClick={() => createNote('pink')}
              className="w-8 h-8 bg-pink-200 border-2 border-pink-300 rounded hover:scale-110 transition-transform"
              title="粉色便签"
            />
            <button
              onClick={() => createNote('blue')}
              className="w-8 h-8 bg-blue-200 border-2 border-blue-300 rounded hover:scale-110 transition-transform"
              title="蓝色便签"
            />
            <button
              onClick={() => createNote('green')}
              className="w-8 h-8 bg-green-200 border-2 border-green-300 rounded hover:scale-110 transition-transform"
              title="绿色便签"
            />
          </div>
        </div>
      </div>

      {/* 统计信息（左下角，开发模式） */}
      {/* 在开发环境显示统计 - 可以通过按 Ctrl+Shift+D 切换显示 */}
    </div>
  );
}
