/**
 * 从白名单官网 + 栏目列表页同步全局共享依据库。
 * 用法：pnpm basis:sync
 */
import { config } from 'dotenv';

import { runBasisLibrarySync } from '@/lib/project/basis-import';

config({ path: '.env.local' });

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('缺少 DATABASE_URL（请配置 .env.local）');
  }

  const result = await runBasisLibrarySync();
  console.log(
    JSON.stringify(
      {
        ok: true,
        packs: result.packs,
        items: result.items,
        bySite: result.bySite,
        fetched: result.fetched,
        fallback: result.fallback,
        discovered: result.discovered,
        listResults: result.listResults,
        failed: result.failed,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('FAIL', message);
  process.exit(1);
});
