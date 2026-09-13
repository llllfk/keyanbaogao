'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * App Router 页面切换顶部进度条（零第三方依赖，避免 Coze 环境缺包）。
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timers = useRef<number[]>([]);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    const clearTimers = () => {
      for (const id of timers.current) {
        window.clearTimeout(id);
      }
      timers.current = [];
    };

    clearTimers();
    setVisible(true);
    setWidth(18);

    timers.current.push(
      window.setTimeout(() => setWidth(55), 80),
      window.setTimeout(() => setWidth(78), 220),
      window.setTimeout(() => setWidth(100), 420),
      window.setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 620),
    );

    return clearTimers;
  }, [pathname]);

  if (!visible && width === 0) {
    return null;
  }

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        height: 3,
        width: `${width}%`,
        background: '#0f766e',
        boxShadow: '0 0 8px #0f766e55',
        opacity: visible ? 1 : 0,
        transition:
          width === 0
            ? 'opacity 160ms ease'
            : 'width 280ms ease, opacity 160ms ease',
        pointerEvents: 'none',
      }}
    />
  );
}
