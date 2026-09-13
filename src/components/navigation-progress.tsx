'use client';

import NextTopLoader from 'nextjs-toploader';

/** App Router 页面切换顶部进度条 */
export function NavigationProgress() {
  return (
    <NextTopLoader
      color="#0f766e"
      height={3}
      showSpinner={false}
      crawl
      crawlSpeed={200}
      speed={200}
      shadow="0 0 8px #0f766e55"
      zIndex={9999}
    />
  );
}
