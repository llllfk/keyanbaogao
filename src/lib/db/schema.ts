import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import type { ProjectFinance } from '@/lib/finance/schema';
import type { BasicInfoInput, BasisItem, OutlineConfig, ReportChapter } from '@/lib/project/schema';

/** 租户（多租户隔离根） */
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  config: jsonb('config').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull().default(''),
  passwordHash: text('password_hash').notNull(),
  /** 加密后的 DeepSeek API Key（用户设置） */
  deepseekApiKeyEnc: text('deepseek_api_key_enc'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 32 }).notNull().default('draft'),
  basicInfo: jsonb('basic_info').$type<BasicInfoInput>().notNull(),
  basisItems: jsonb('basis_items').$type<BasisItem[]>().notNull().default([]),
  basisConfirmedAt: timestamp('basis_confirmed_at', { withTimezone: true }),
  finance: jsonb('finance').$type<ProjectFinance | null>(),
  outlineConfig: jsonb('outline_config').$type<OutlineConfig | null>(),
  reportChapters: jsonb('report_chapters')
    .$type<ReportChapter[]>()
    .notNull()
    .default([]),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * 全局共享依据包（不区分角色/租户，全站共用）
 */
export const basisPacks = pgTable('basis_packs', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull().default(''),
  /** 所有项目默认推荐 */
  matchAlways: boolean('match_always').notNull().default(false),
  /** 匹配关键词，逗号分隔，对照地点/细分/行业 */
  matchKeywords: text('match_keywords').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const basisPackItems = pgTable('basis_pack_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  packId: varchar('pack_id', { length: 64 })
    .notNull()
    .references(() => basisPacks.id, { onDelete: 'cascade' }),
  group: varchar('group', { length: 32 }).notNull(),
  title: varchar('title', { length: 300 }).notNull(),
  docCode: varchar('doc_code', { length: 100 }).notNull().default(''),
  issuer: varchar('issuer', { length: 100 }).notNull().default(''),
  sourceUrl: text('source_url').notNull().default(''),
  /** 来源网站，如中国政府网 / 国家发展改革委 */
  sourceSite: varchar('source_site', { length: 100 }).notNull().default(''),
  sortOrder: varchar('sort_order', { length: 16 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * 工具页粘贴新增的同步源（与代码内白名单合并；sync 不会冲掉）
 */
export const basisSourceUrls = pgTable('basis_source_urls', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: varchar('site_id', { length: 32 }).notNull(),
  packId: varchar('pack_id', { length: 64 })
    .notNull()
    .references(() => basisPacks.id, { onDelete: 'cascade' }),
  group: varchar('group', { length: 32 }).notNull(),
  sourceUrl: text('source_url').notNull().unique(),
  fetchMode: varchar('fetch_mode', { length: 16 }).notNull().default('document'),
  fallbackTitle: varchar('fallback_title', { length: 300 }).notNull(),
  fallbackDocCode: varchar('fallback_doc_code', { length: 100 }).notNull().default(''),
  fallbackIssuer: varchar('fallback_issuer', { length: 100 }).notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * 官方栏目/列表页：同步时自动发现详情链接并入库元数据
 */
export const basisListSources = pgTable('basis_list_sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: varchar('site_id', { length: 32 }).notNull(),
  packId: varchar('pack_id', { length: 64 })
    .notNull()
    .references(() => basisPacks.id, { onDelete: 'cascade' }),
  group: varchar('group', { length: 32 }).notNull(),
  listUrl: text('list_url').notNull().unique(),
  title: varchar('title', { length: 200 }).notNull().default(''),
  enabled: boolean('enabled').notNull().default(true),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  lastFoundCount: integer('last_found_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TenantRow = typeof tenants.$inferSelect;
export type UserRow = typeof users.$inferSelect;
export type ProjectRow = typeof projects.$inferSelect;
export type BasisPackRow = typeof basisPacks.$inferSelect;
export type BasisPackItemRow = typeof basisPackItems.$inferSelect;
export type BasisSourceUrlRow = typeof basisSourceUrls.$inferSelect;
export type BasisListSourceRow = typeof basisListSources.$inferSelect;
