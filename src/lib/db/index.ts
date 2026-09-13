import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, type QueryResult, type QueryResultRow } from 'pg';

import * as schema from './schema';

declare global {
  // eslint-disable-next-line no-var
  var __keyanPgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('缺少 DATABASE_URL，请在 .env.local 中配置');
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    // 远程库（如 Supabase）常会掐空闲连接；keepAlive + 较短 idle 可降低 Failed query
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 20_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
    allowExitOnIdle: false,
  });

  pool.on('error', error => {
    console.error('[pg pool] idle client error', error.message);
  });

  return pool;
}

export function getPool(): Pool {
  if (!globalThis.__keyanPgPool) {
    globalThis.__keyanPgPool = createPool();
  }
  return globalThis.__keyanPgPool;
}

/** 连接被服务端掐断时重建池并重试一次 */
export async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const retryable =
      /Failed query|Connection terminated|ECONNRESET|server closed the connection|timeout|Cannot use a pool after calling end/i.test(
        message,
      );
    if (!retryable) {
      throw error;
    }
    console.warn('[pg] retry after connection error:', message);
    try {
      await globalThis.__keyanPgPool?.end();
    } catch {
      // ignore
    }
    globalThis.__keyanPgPool = createPool();
    return fn();
  }
}

export function getDb() {
  return drizzle(getPool(), { schema });
}

export async function queryWithRetry<
  R extends QueryResultRow = QueryResultRow,
>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<R>> {
  return withDbRetry(() => getPool().query<R>(text, params));
}

export type Db = ReturnType<typeof getDb>;
