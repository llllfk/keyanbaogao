/**
 * 解除卡在 generating 的完整测试项目，便于继续打开页面。
 */
import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(process.cwd(), '.env.local') });

import { getPool } from '../src/lib/db';
import type { ReportChapter } from '../src/lib/project/schema';

const PROJECT_ID = '0dfd966b-3cda-48c5-a6bb-0fed656ceebc';

async function main() {
  const pool = getPool();
  const { rows } = await pool.query<{
    status: string;
    report_chapters: ReportChapter[];
  }>(`SELECT status, report_chapters FROM projects WHERE id = $1`, [
    PROJECT_ID,
  ]);
  const row = rows[0];
  if (!row) {
    throw new Error('项目不存在');
  }

  const chapters = (row.report_chapters ?? []).map(chapter => {
    if (chapter.status === 'generating') {
      return {
        ...chapter,
        status: 'failed' as const,
        error: chapter.error || '生成中断（数据库连接失败），请续写或重试',
      };
    }
    return chapter;
  });

  const allDone =
    chapters.length > 0 &&
    chapters.every(
      item => item.status === 'done' || item.status === 'skipped',
    );
  const hasPending = chapters.some(
    item =>
      item.status === 'pending' ||
      item.status === 'failed' ||
      item.status === 'generating',
  );

  const nextStatus = allDone
    ? 'generated'
    : hasPending
      ? 'finance_done'
      : row.status === 'generating'
        ? 'finance_done'
        : row.status;

  await pool.query(
    `UPDATE projects
     SET status = $1,
         report_chapters = $2::jsonb,
         updated_at = NOW()
     WHERE id = $3`,
    [nextStatus, JSON.stringify(chapters), PROJECT_ID],
  );

  console.log(
    JSON.stringify(
      {
        id: PROJECT_ID,
        from: row.status,
        to: nextStatus,
        done: chapters.filter(c => c.status === 'done').length,
        failed: chapters.filter(c => c.status === 'failed').length,
        pending: chapters.filter(c => c.status === 'pending').length,
      },
      null,
      2,
    ),
  );
  await pool.end();
}

main().catch(async e => {
  console.error(e);
  try {
    await getPool().end();
  } catch {
    // ignore
  }
  process.exit(1);
});
