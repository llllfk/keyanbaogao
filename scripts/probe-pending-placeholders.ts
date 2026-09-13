import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(process.cwd(), '.env.local') });

import { getPool } from '../src/lib/db';

const PROJECT_ID = '0dfd966b-3cda-48c5-a6bb-0fed656ceebc';

async function main() {
  const pool = getPool();
  const { rows } = await pool.query<{
    report_chapters: Array<{
      chapterId: string;
      title: string;
      status: string;
      content: string;
    }>;
  }>(`SELECT report_chapters FROM projects WHERE id = $1`, [PROJECT_ID]);

  const chapters = rows[0]?.report_chapters ?? [];
  let total = 0;
  for (const chapter of chapters) {
    const content = chapter.content ?? '';
    const count = (content.match(/待补充/g) ?? []).length;
    if (count > 0) {
      total += count;
      console.log(
        `${chapter.chapterId}\t${chapter.status}\t${count}\t${chapter.title}`,
      );
    }
  }
  console.log('---');
  console.log(`chapters_with_placeholder=${chapters.filter(c => (c.content ?? '').includes('待补充')).length}`);
  console.log(`total_placeholder_mentions=${total}`);
  console.log(`done=${chapters.filter(c => c.status === 'done').length} / ${chapters.length}`);
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
