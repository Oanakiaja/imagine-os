/**
 * Window Component - V1.0
 *
 * 改进的窗口组件，包含以下新功能：
 * - 平滑的最小化/最大化动画
 * - 从边缘/角落调整窗口大小
 * - HTML 内容清理（DOMPurify）
 * - 改进的错误处理
 * - 双击标题栏最大化
 *
 * 架构说明：
 * - 使用 React Hooks 管理拖拽和调整大小状态
 * - 使用 CSS transitions 实现平滑动画
 * - 使用 DOMPurify 清理用户生成的 HTML
 * - 通过 Zustand store 更新全局窗口状态
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@imagine/ui';
import type { ImagineWindow } from '@imagine/shared';
import { useWindowStore } from '../store/window';
import DOMPurify from 'dompurify';

interface WindowProps {
  window: ImagineWindow;
}

// 调整大小的边缘检测阈值（像素）
const RESIZE_HANDLE_SIZE = 8;

// 调整大小的方向类型
type ResizeDirection =
  | 'n'
  | 's'
  | 'e'
  | 'w' // 上下左右
  | 'ne'
  | 'nw'
  | 'se'
  | 'sw' // 四个角
  | null;

export function Window({ window }: WindowProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 调整大小状态
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // 鼠标悬停状态（用于显示调整大小光标）
  const [hoverDirection, setHoverDirection] = useState<ResizeDirection>(null);

  const { closeWindow, focusWindow, moveWindow, resizeWindow, toggleMinimize, toggleMaximize } =
    useWindowStore();

  /**
   * 渲染并清理 HTML 内容
   * 使用 DOMPurify 防止 XSS 攻击
   */
  useEffect(() => {
    if (window.status === 'ready' && window.content && contentRef.current) {
      // 清理 HTML，移除潜在的恶意脚本
      const cleanHTML = DOMPurify.sanitize(window.content, {
        ALLOWED_TAGS: [
          'div',
          'span',
          'p',
          'a',
          'b',
          'i',
          'u',
          'strong',
          'em',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'ul',
          'ol',
          'li',
          'br',
          'hr',
          'table',
          'thead',
          'tbody',
          'tr',
          'th',
          'td',
          'button',
          'input',
          'select',
          'textarea',
          'label',
          'img',
          'svg',
          'path',
          'circle',
          'rect',
          'line',
        ],
        ALLOWED_ATTR: [
          'class',
          'id',
          'style',
          'data-action',
          'data-value',
          'href',
          'target',
          'src',
          'alt',
          'title',
          'type',
          'value',
          'placeholder',
          'checked',
          'disabled',
          'width',
          'height',
          'viewBox',
          'd',
          'fill',
          'stroke',
        ],
        // 允许 data-* 属性用于交互
        ALLOW_DATA_ATTR: true,
      });

      contentRef.current.innerHTML = cleanHTML;
    }
  }, [window.status, window.content]);

  /**
   * 检测鼠标位置是否在调整大小的边缘
   */
  const getResizeDirection = useCallback((e: React.MouseEvent): ResizeDirection => {
    if (!windowRef.current) return null;

    const rect = windowRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nearTop = y < RESIZE_HANDLE_SIZE;
    const nearBottom = y > rect.height - RESIZE_HANDLE_SIZE;
    const nearLeft = x < RESIZE_HANDLE_SIZE;
    const nearRight = x > rect.width - RESIZE_HANDLE_SIZE;

    // 角落优先（更容易抓取）
    if (nearTop && nearLeft) return 'nw';
    if (nearTop && nearRight) return 'ne';
    if (nearBottom && nearLeft) return 'sw';
    if (nearBottom && nearRight) return 'se';

    // 边缘
    if (nearTop) return 'n';
    if (nearBottom) return 's';
    if (nearLeft) return 'w';
    if (nearRight) return 'e';

    return null;
  }, []);

  /**
   * 获取调整大小方向对应的光标样式
   */
  const getCursorForDirection = (direction: ResizeDirection): string => {
    const cursors: Record<string, string> = {
      n: 'ns-resize',
      s: 'ns-resize',
      e: 'ew-resize',
      w: 'ew-resize',
      ne: 'nesw-resize',
      sw: 'nesw-resize',
      nw: 'nwse-resize',
      se: 'nwse-resize',
    };
    return direction ? cursors[direction] : 'default';
  };

  /**
   * 鼠标移动时检测调整大小区域
   */
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging || isResizing || window.isMaximized) return;

    const direction = getResizeDirection(e);
    setHoverDirection(direction);
  };

  /**
   * 开始拖拽窗口
   */
  const handleDragStart = (e: React.MouseEvent) => {
    // 只有点击标题栏才能拖拽
    if (e.target !== headerRef.current && !headerRef.current?.contains(e.target as Node)) {
      return;
    }

    // 如果窗口最大化，不允许拖拽
    if (window.isMaximized) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - window.position.x,
      y: e.clientY - window.position.y,
    });
    focusWindow(window.id);
  };

  /**
   * 开始调整窗口大小
   */
  const handleResizeStart = (e: React.MouseEvent) => {
    const direction = getResizeDirection(e);
    if (!direction || window.isMaximized) return;

    e.stopPropagation(); // 防止触发拖拽

    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: window.size.width,
      height: window.size.height,
    });
    focusWindow(window.id);
  };

  /**
   * 双击标题栏切换最大化
   */
  const handleDoubleClick = () => {
    toggleMaximize(window.id);
  };

  /**
   * 全局鼠标移动处理（拖拽和调整大小）
   */
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // 拖拽窗口
        moveWindow(window.id, e.clientX - dragOffset.x, e.clientY - dragOffset.y);
      } else if (isResizing && resizeDirection) {
        // 调整窗口大小
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = window.position.x;
        let newY = window.position.y;

        // 根据调整方向计算新尺寸
        if (resizeDirection.includes('e')) {
          newWidth = Math.max(300, resizeStart.width + deltaX);
        }
        if (resizeDirection.includes('w')) {
          newWidth = Math.max(300, resizeStart.width - deltaX);
          newX = window.position.x + deltaX;
        }
        if (resizeDirection.includes('s')) {
          newHeight = Math.max(200, resizeStart.height + deltaY);
        }
        if (resizeDirection.includes('n')) {
          newHeight = Math.max(200, resizeStart.height - deltaY);
          newY = window.position.y + deltaY;
        }

        // 更新窗口尺寸和位置
        resizeWindow(window.id, newWidth, newHeight);
        if (newX !== window.position.x || newY !== window.position.y) {
          moveWindow(window.id, newX, newY);
        }
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection(null);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [
    isDragging,
    isResizing,
    resizeDirection,
    dragOffset,
    resizeStart,
    window.id,
    window.position.x,
    window.position.y,
    moveWindow,
    resizeWindow,
  ]);

  // 最小化状态下不渲染
  if (window.isMinimized) {
    return null;
  }

  // 窗口样式（支持动画）
  const windowStyle: React.CSSProperties = {
    position: 'absolute',
    left: window.isMaximized ? 0 : window.position.x,
    top: window.isMaximized ? 0 : window.position.y,
    width: window.isMaximized ? '100vw' : window.size.width,
    height: window.isMaximized ? '100vh' : window.size.height,
    zIndex: window.zIndex,
    cursor: hoverDirection ? getCursorForDirection(hoverDirection) : 'default',
    transition: window.isMaximized
      ? 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)' // 最大化动画
      : 'none',
  };

  return (
    <div
      ref={windowRef}
      className="bg-white rounded-lg shadow-2xl overflow-hidden"
      style={windowStyle}
      onMouseDown={(e) => {
        focusWindow(window.id);
        const direction = getResizeDirection(e);
        if (direction) {
          handleResizeStart(e);
        } else {
          handleDragStart(e);
        }
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverDirection(null)}
    >
      {/* 窗口标题栏 */}
      <div
        ref={headerRef}
        className="h-10 bg-gray-800 flex items-center justify-between px-4 cursor-move select-none"
        onDoubleClick={handleDoubleClick}
      >
        <span className="text-white text-sm font-medium truncate">{window.title}</span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white hover:bg-gray-700 transition-colors"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              toggleMinimize(window.id);
            }}
            title="最小化"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white hover:bg-gray-700 transition-colors"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              toggleMaximize(window.id);
            }}
            title={window.isMaximized ? '还原' : '最大化'}
          >
            {window.isMaximized ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white hover:bg-red-600 transition-colors"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              closeWindow(window.id);
            }}
            title="关闭"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 窗口内容区域 */}
      <div className="p-4 overflow-auto bg-white" style={{ height: 'calc(100% - 2.5rem)' }}>
        {/* 加载状态 - 创建中 */}
        {window.status === 'creating' && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
              <p className="text-gray-500 text-sm">创建窗口中...</p>
            </div>
          </div>
        )}

        {/* 加载状态 - 加载中 */}
        {window.status === 'loading' && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-pulse h-8 w-8 bg-blue-500 rounded-full" />
              <p className="text-gray-500 text-sm">加载内容中...</p>
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {window.status === 'error' && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3 p-6 bg-red-50 rounded-lg">
              <div className="text-red-500 text-4xl">⚠️</div>
              <p className="text-red-600 font-medium">内容加载失败</p>
              <p className="text-gray-600 text-sm text-center">
                窗口内容无法加载，请重试或关闭窗口
              </p>
            </div>
          </div>
        )}

        {/* 实际内容（已清理的 HTML） */}
        <div ref={contentRef} className="w-full h-full" />
      </div>
    </div>
  );
}
