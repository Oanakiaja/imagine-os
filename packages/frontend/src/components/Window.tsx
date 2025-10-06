import { useRef, useEffect, useState } from 'react';
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@imagine/ui';
import type { ImagineWindow } from '@imagine/shared';
import { useWindowStore } from '../store/window';

interface WindowProps {
  window: ImagineWindow;
}

export function Window({ window }: WindowProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const { closeWindow, focusWindow, moveWindow, toggleMinimize, toggleMaximize } = useWindowStore();

  // 动态插入 HTML 内容
  useEffect(() => {
    if (window.status === 'ready' && window.content && contentRef.current) {
      contentRef.current.innerHTML = window.content;
    }
  }, [window.status, window.content]);

  // 拖拽逻辑
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== headerRef.current && !headerRef.current?.contains(e.target as Node)) {
      return;
    }
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - window.position.x,
      y: e.clientY - window.position.y,
    });
    focusWindow(window.id);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      moveWindow(window.id, e.clientX - dragOffset.x, e.clientY - dragOffset.y);
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
  }, [isDragging, dragOffset, window.id, moveWindow]);

  if (window.isMinimized) {
    return null;
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    left: window.isMaximized ? 0 : window.position.x,
    top: window.isMaximized ? 0 : window.position.y,
    width: window.isMaximized ? '100vw' : window.size.width,
    height: window.isMaximized ? '100vh' : window.size.height,
    zIndex: window.zIndex,
  };

  return (
    <div
      className="bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-200"
      style={style}
      onMouseDown={() => focusWindow(window.id)}
    >
      {/* Window Header */}
      <div
        ref={headerRef}
        className="h-10 bg-gray-800 flex items-center justify-between px-4 cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <span className="text-white text-sm font-medium truncate">{window.title}</span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white hover:bg-gray-700"
            onClick={() => toggleMinimize(window.id)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white hover:bg-gray-700"
            onClick={() => toggleMaximize(window.id)}
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
            className="h-6 w-6 text-white hover:bg-red-600"
            onClick={() => closeWindow(window.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Window Content */}
      <div className="p-4 overflow-auto" style={{ height: 'calc(100% - 2.5rem)' }}>
        {window.status === 'creating' && (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}
        {window.status === 'loading' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading...</div>
          </div>
        )}
        {window.status === 'error' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-red-500">Error loading content</div>
          </div>
        )}
        <div ref={contentRef} className="w-full h-full" />
      </div>
    </div>
  );
}
