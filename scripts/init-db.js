/**
 * 初始化 / 迁移多租户表结构。
 * 用法：node scripts/init-db.js
 */
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const client = await pool.connect();

  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(100) NOT NULL,
        config jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // users：可能已有旧表，补 tenant_id
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
        email varchar(255) NOT NULL UNIQUE,
        name varchar(100) NOT NULL DEFAULT '',
        password_hash text NOT NULL,
        deepseek_api_key_enc text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS deepseek_api_key_enc text
    `);

    const usersCols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'tenant_id'
    `);
    if (usersCols.rowCount === 0) {
      await client.query(
        `ALTER TABLE users ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE`,
      );
    }

    // 为无租户的旧用户补个人租户
    const orphanUsers = await client.query(`
      SELECT id, name, email FROM users WHERE tenant_id IS NULL
    `);
    for (const row of orphanUsers.rows) {
      const tenant = await client.query(
        `INSERT INTO tenants (name, config) VALUES ($1, '{}'::jsonb) RETURNING id`,
        [`${row.name || row.email || '用户'}的工作区`],
      );
      await client.query(`UPDATE users SET tenant_id = $1 WHERE id = $2`, [
        tenant.rows[0].id,
        row.id,
      ]);
    }

    await client.query(`
      ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL
    `).catch(() => {
      // 若仍有空值则跳过
    });

    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status varchar(32) NOT NULL DEFAULT 'draft',
        basic_info jsonb NOT NULL,
        basis_items jsonb NOT NULL DEFAULT '[]'::jsonb,
        basis_confirmed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    const projectCols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'projects' AND column_name = 'tenant_id'
    `);
    if (projectCols.rowCount === 0) {
      await client.query(
        `ALTER TABLE projects ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE`,
      );
    }

    // 项目补 tenant_id（取所属用户的租户）
    await client.query(`
      UPDATE projects p
      SET tenant_id = u.tenant_id
      FROM users u
      WHERE p.user_id = u.id AND p.tenant_id IS NULL
    `);

    await client.query(`
      ALTER TABLE projects ALTER COLUMN tenant_id SET NOT NULL
    `).catch(() => undefined);

    await client.query(`
      CREATE INDEX IF NOT EXISTS projects_tenant_id_idx ON projects(tenant_id);
      CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
      CREATE INDEX IF NOT EXISTS users_tenant_id_idx ON users(tenant_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS basis_packs (
        id varchar(64) PRIMARY KEY,
        name varchar(100) NOT NULL,
        description text NOT NULL DEFAULT '',
        match_always boolean NOT NULL DEFAULT false,
        match_keywords text NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      ALTER TABLE basis_packs
        ADD COLUMN IF NOT EXISTS match_always boolean NOT NULL DEFAULT false;
      ALTER TABLE basis_packs
        ADD COLUMN IF NOT EXISTS match_keywords text NOT NULL DEFAULT '';

      CREATE TABLE IF NOT EXISTS basis_pack_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        pack_id varchar(64) NOT NULL REFERENCES basis_packs(id) ON DELETE CASCADE,
        "group" varchar(32) NOT NULL,
        title varchar(300) NOT NULL,
        doc_code varchar(100) NOT NULL DEFAULT '',
        issuer varchar(100) NOT NULL DEFAULT '',
        source_url text NOT NULL DEFAULT '',
        source_site varchar(100) NOT NULL DEFAULT '',
        sort_order varchar(16) NOT NULL DEFAULT '0',
        created_at timestamptz NOT NULL DEFAULT now()
      );

      ALTER TABLE basis_pack_items
        ADD COLUMN IF NOT EXISTS source_site varchar(100) NOT NULL DEFAULT '';

      CREATE TABLE IF NOT EXISTS basis_source_urls (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id varchar(32) NOT NULL,
        pack_id varchar(64) NOT NULL REFERENCES basis_packs(id) ON DELETE CASCADE,
        "group" varchar(32) NOT NULL,
        source_url text NOT NULL UNIQUE,
        fetch_mode varchar(16) NOT NULL DEFAULT 'document',
        fallback_title varchar(300) NOT NULL,
        fallback_doc_code varchar(100) NOT NULL DEFAULT '',
        fallback_issuer varchar(100) NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS basis_list_sources (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id varchar(32) NOT NULL,
        pack_id varchar(64) NOT NULL REFERENCES basis_packs(id) ON DELETE CASCADE,
        "group" varchar(32) NOT NULL,
        list_url text NOT NULL UNIQUE,
        enabled boolean NOT NULL DEFAULT true,
        last_synced_at timestamptz,
        last_found_count integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'tenants', 'users', 'projects',
          'basis_packs', 'basis_pack_items', 'basis_source_urls', 'basis_list_sources'
        )
      ORDER BY 1
    `);
    console.log(
      'OK tables:',
      tables.rows.map(row => row.table_name).join(','),
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error('FAIL', error.message);
  process.exit(1);
});
