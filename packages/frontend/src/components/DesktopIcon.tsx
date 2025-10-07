/**
 * DesktopIcon Component - V1.0
 *
 * 桌面应用图标组件
 *
 * 功能：
 * - 显示应用图标和名称
 * - 单击打开应用
 * - 双击快速启动
 * - 悬停效果
 *
 * 架构说明：
 * - 支持 emoji 图标或图片 URL
 * - 通过 action 属性决定点击行为
 * - 可触发窗口创建、外部链接或系统命令
 */

import { useState } from 'react';
import type { DesktopApp } from '@imagine/shared';

interface DesktopIconProps {
  app: DesktopApp;
  onAction: (app: DesktopApp) => void;
}

export function DesktopIcon({ app, onAction }: DesktopIconProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [lastClick, setLastClick] = useState(0);

  /**
   * 处理点击事件
   * 检测双击以快速启动
   */
  const handleClick = () => {
    const now = Date.now();
    const isDoubleClick = now - lastClick < 300;

    if (isDoubleClick) {
      // 双击 - 执行操作
      onAction(app);
    }

    setLastClick(now);
  };

  /**
   * 判断图标是图片还是 emoji
   */
  const isImageUrl = (icon: string) => {
    return icon.startsWith('http') || icon.startsWith('/') || icon.includes('.');
  };

  return (
    <div
      className="flex flex-col items-center gap-2 p-3 rounded-lg cursor-pointer select-none transition-all hover:bg-white/20"
      style={{
        position: 'absolute',
        left: app.position.x,
        top: app.position.y,
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`double click to open ${app.name}`}
    >
      {/* 图标 */}
      <div
        className={`w-16 h-16 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-xl border-2 border-white/20 transition-transform ${
          isHovered ? 'scale-110 shadow-lg' : ''
        }`}
      >
        {isImageUrl(app.icon) ? (
          <img src={app.icon} alt={app.name} className="w-12 h-12 object-contain" />
        ) : (
          <span className="text-4xl">{app.icon}</span>
        )}
      </div>

      {/* 应用名称 */}
      <span
        className={`text-sm font-medium text-white drop-shadow-lg transition-all ${
          isHovered ? 'scale-105' : ''
        }`}
      >
        {app.name}
      </span>
    </div>
  );
}
