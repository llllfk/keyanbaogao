import { fail, ok } from '@/lib/api/response';
import { getPool } from '@/lib/db';

/** GET /api/health — 健康检查（规范推荐） */
export async function GET() {
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    return ok({ status: 'ok', database: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '数据库不可用';
    return fail(message, 500);
  }
}
