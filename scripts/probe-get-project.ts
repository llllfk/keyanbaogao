import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(process.cwd(), '.env.local') });

import { getPool } from '../src/lib/db';

async function main() {
  const pool = getPool();
  const id = '0dfd966b-3cda-48c5-a6bb-0fed656ceebc';
  const tenant = '81daee8f-69a9-420f-80b4-cae8d2f491cb';

  try {
    const r = await pool.query(
      `select id, status,
        pg_column_size(finance) as finance_bytes,
        pg_column_size(report_chapters) as chapters_bytes,
        pg_column_size(basic_info) as basic_bytes,
        pg_column_size(basis_items) as basis_bytes,
        jsonb_array_length(COALESCE(report_chapters,'[]'::jsonb)) as chapter_count
       from projects where id=$1 and tenant_id=$2`,
      [id, tenant],
    );
    console.log('size', JSON.stringify(r.rows, null, 2));

    const full = await pool.query(
      `select id, status from projects where id=$1 and tenant_id=$2 limit 1`,
      [id, tenant],
    );
    console.log('select ok', full.rows[0]);

    // Try full row like drizzle
    const heavy = await pool.query(
      `select "id", "tenant_id", "user_id", "status", "basic_info", "basis_items", "basis_confirmed_at", "finance", "outline_config", "report_chapters", "created_at", "updated_at" from "projects" where ("projects"."id" = $1 and "projects"."tenant_id" = $2) limit $3`,
      [id, tenant, 1],
    );
    console.log(
      'full row ok',
      heavy.rows[0]?.id,
      'chapters',
      Array.isArray(heavy.rows[0]?.report_chapters)
        ? heavy.rows[0].report_chapters.length
        : typeof heavy.rows[0]?.report_chapters,
    );
  } catch (error) {
    console.error('FAIL');
    console.error(error);
  } finally {
    await pool.end();
  }
}

main();
