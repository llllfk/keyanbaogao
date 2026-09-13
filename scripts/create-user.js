/**
 * 管理员开通账号（无公开注册）。
 * 用法：
 *   node scripts/create-user.js --email=admin@example.com --password=secret123 --name=管理员
 */
const { Pool } = require('pg');
const { hash } = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

function parseArgs(argv) {
  const out = { email: '', password: '', name: '' };
  for (const arg of argv) {
    if (arg.startsWith('--email=')) out.email = arg.slice(8).trim();
    if (arg.startsWith('--password=')) out.password = arg.slice(11);
    if (arg.startsWith('--name=')) out.name = arg.slice(7).trim();
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.email || !args.password) {
    console.error(
      '用法: node scripts/create-user.js --email=a@b.com --password=至少6位 [--name=名称]',
    );
    process.exit(1);
  }
  if (args.password.length < 6) {
    console.error('密码至少 6 位');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const client = await pool.connect();

  try {
    const email = args.email.toLowerCase();
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [email],
    );
    if (existing.rowCount && existing.rowCount > 0) {
      console.error('该邮箱已存在');
      process.exit(1);
    }

    const displayName = args.name || email.split('@')[0] || '用户';
    const passwordHash = await hash(args.password, 10);

    await client.query('BEGIN');
    const tenant = await client.query(
      `INSERT INTO tenants (name, config) VALUES ($1, '{}'::jsonb) RETURNING id`,
      [`${displayName}的工作区`],
    );
    const user = await client.query(
      `INSERT INTO users (tenant_id, email, name, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, tenant_id`,
      [tenant.rows[0].id, email, displayName, passwordHash],
    );
    await client.query('COMMIT');

    console.log('OK created user:');
    console.log(JSON.stringify(user.rows[0], null, 2));
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error('FAIL', error.message);
  process.exit(1);
});
