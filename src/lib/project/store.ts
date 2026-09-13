import { and, desc, eq, sql } from 'drizzle-orm';

import {
  calculateFinanceV2,
} from '@/lib/finance/engine';
import {
  financeInputSchema,
  type ProjectFinance,
} from '@/lib/finance/schema';
import { getDb, getPool, withDbRetry } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { syncProgramChapters } from '@/lib/project/generate';
import {
  basicInfoSchema,
  basisItemSchema,
  defaultBasicInfo,
  normalizeBasicInfo,
  normalizeProjectRecord,
  outlineConfigSchema,
  type BasicInfoInput,
  type BasisItem,
  type OutlineConfig,
  type ProjectAttachment,
  type ProjectRecord,
  type ReportChapter,
} from '@/lib/project/schema';
import { mergeAttachmentsIntoBasicInfo } from '@/lib/project/attachments';

type Scope = {
  tenantId: string;
  userId: string;
};

let projectExtraColumnsReady = false;

export async function ensureProjectOutlineColumns(): Promise<void> {
  if (projectExtraColumnsReady) {
    return;
  }
  await withDbRetry(async () => {
    const pool = getPool();
    await pool.query(`
    ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS outline_config jsonb;
    ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS report_chapters jsonb NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS finance jsonb;
  `);
  });
  projectExtraColumnsReady = true;
}

function rowToRecord(row: typeof projects.$inferSelect): ProjectRecord {
  return normalizeProjectRecord({
    id: row.id,
    status: row.status as ProjectRecord['status'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    basicInfo: row.basicInfo,
    basisItems: row.basisItems ?? [],
    basisConfirmedAt: row.basisConfirmedAt
      ? row.basisConfirmedAt.toISOString()
      : null,
    finance: row.finance ?? null,
    outlineConfig: row.outlineConfig ?? null,
    reportChapters: row.reportChapters ?? [],
  });
}

export async function listProjects(scope: Scope): Promise<ProjectRecord[]> {
  await ensureProjectOutlineColumns();
  return withDbRetry(async () => {
    const db = getDb();
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.tenantId, scope.tenantId))
      .orderBy(desc(projects.updatedAt));
    return rows.map(rowToRecord);
  });
}

export async function getProject(
  scope: Scope,
  id: string,
): Promise<ProjectRecord | null> {
  await ensureProjectOutlineColumns();
  return withDbRetry(async () => {
    const db = getDb();
    const [row] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.tenantId, scope.tenantId)))
      .limit(1);
    return row ? rowToRecord(row) : null;
  });
}

export async function createProject(
  scope: Scope,
  input?: Partial<BasicInfoInput>,
): Promise<ProjectRecord> {
  await ensureProjectOutlineColumns();
  const db = getDb();
  const basicInfo: BasicInfoInput = {
    ...defaultBasicInfo(),
    ...input,
  };

  const [row] = await db
    .insert(projects)
    .values({
      tenantId: scope.tenantId,
      userId: scope.userId,
      status: 'draft',
      basicInfo,
      basisItems: [],
      basisConfirmedAt: null,
      outlineConfig: null,
      reportChapters: [],
    })
    .returning();

  if (!row) {
    throw new Error('创建项目失败');
  }
  return rowToRecord(row);
}

export async function updateProjectBasicInfo(
  scope: Scope,
  id: string,
  input: BasicInfoInput,
): Promise<ProjectRecord | null> {
  await ensureProjectOutlineColumns();
  const existing = await getProject(scope, id);
  if (!existing) {
    return null;
  }
  const parsed = basicInfoSchema.parse(input);
  const basicInfo = normalizeBasicInfo({
    ...parsed,
    doFinancialAnalysis: input.doFinancialAnalysis === true,
    attachments: Array.isArray(input.attachments)
      ? input.attachments
      : existing.basicInfo.attachments,
  });

  // 显式 JSON 写入，避免 jsonb 布尔字段偶发未落库
  const pool = getPool();
  const result = await pool.query(
    `UPDATE projects
     SET basic_info = $1::jsonb,
         status = 'basic_filled',
         basis_confirmed_at = NULL,
         updated_at = NOW()
     WHERE id = $2::uuid AND tenant_id = $3::uuid
     RETURNING (basic_info->>'doFinancialAnalysis') AS finance_flag`,
    [JSON.stringify(basicInfo), id, scope.tenantId],
  );
  if (result.rowCount !== 1) {
    return null;
  }
  const saved = await getProject(scope, id);
  if (
    input.doFinancialAnalysis === true &&
    saved?.basicInfo.doFinancialAnalysis !== true
  ) {
    throw new Error(
      `财务测算开关未能写入（库内=${String(result.rows[0]?.finance_flag)}）`,
    );
  }
  return saved;
}

export async function saveProjectDraft(
  scope: Scope,
  id: string,
  input: Partial<BasicInfoInput>,
): Promise<ProjectRecord | null> {
  const existing = await getProject(scope, id);
  if (!existing) {
    return null;
  }

  const basicInfo = normalizeBasicInfo({
    ...existing.basicInfo,
    ...input,
    doFinancialAnalysis:
      input.doFinancialAnalysis === undefined
        ? existing.basicInfo.doFinancialAnalysis === true
        : input.doFinancialAnalysis === true,
    attachments: Array.isArray(input.attachments)
      ? input.attachments
      : existing.basicInfo.attachments,
  });

  const pool = getPool();
  const result = await pool.query(
    `UPDATE projects
     SET basic_info = $1::jsonb,
         updated_at = NOW()
     WHERE id = $2::uuid AND tenant_id = $3::uuid`,
    [JSON.stringify(basicInfo), id, scope.tenantId],
  );
  if (result.rowCount !== 1) {
    return null;
  }
  return getProject(scope, id);
}

/** 仅切换财务测算开关（立即落库） */
export async function setProjectFinancialAnalysis(
  scope: Scope,
  id: string,
  enabled: boolean,
): Promise<ProjectRecord | null> {
  return saveProjectDraft(scope, id, { doFinancialAnalysis: enabled });
}

export async function addProjectAttachment(
  scope: Scope,
  id: string,
  attachment: ProjectAttachment,
): Promise<ProjectRecord | null> {
  const existing = await getProject(scope, id);
  if (!existing) {
    return null;
  }
  const next = mergeAttachmentsIntoBasicInfo(existing.basicInfo, [
    ...(existing.basicInfo.attachments ?? []),
    attachment,
  ]);
  const db = getDb();
  const [row] = await db
    .update(projects)
    .set({
      basicInfo: next,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, id), eq(projects.tenantId, scope.tenantId)))
    .returning();
  return row ? rowToRecord(row) : null;
}

export async function removeProjectAttachment(
  scope: Scope,
  id: string,
  attachmentId: string,
): Promise<{ project: ProjectRecord; removed: ProjectAttachment | null } | null> {
  const existing = await getProject(scope, id);
  if (!existing) {
    return null;
  }
  const current = existing.basicInfo.attachments ?? [];
  const removed = current.find(item => item.id === attachmentId) ?? null;
  if (!removed) {
    return { project: existing, removed: null };
  }
  const next = mergeAttachmentsIntoBasicInfo(
    existing.basicInfo,
    current.filter(item => item.id !== attachmentId),
  );
  const db = getDb();
  const [row] = await db
    .update(projects)
    .set({
      basicInfo: next,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, id), eq(projects.tenantId, scope.tenantId)))
    .returning();
  return row ? { project: rowToRecord(row), removed } : null;
}

export async function saveProjectBasis(
  scope: Scope,
  id: string,
  items: BasisItem[],
  confirm: boolean,
): Promise<ProjectRecord | null> {
  const existing = await getProject(scope, id);
  if (!existing) {
    return null;
  }

  const parsedItems = items.map(item => basisItemSchema.parse(item));
  if (confirm) {
    const selectedCount = parsedItems.filter(item => item.selected).length;
    if (selectedCount < 1) {
      throw new Error('请至少勾选一条编制依据后再确认');
    }
  }

  const now = new Date();
  const nextBasisConfirmedAt = confirm
    ? now
    : existing.basisConfirmedAt
      ? new Date(existing.basisConfirmedAt)
      : null;
  const reportChapters = syncProgramChapters(
    {
      ...existing,
      basisItems: parsedItems,
      basisConfirmedAt: nextBasisConfirmedAt
        ? nextBasisConfirmedAt.toISOString()
        : null,
    },
    existing.reportChapters ?? [],
  );
  const db = getDb();
  const [row] = await db
    .update(projects)
    .set({
      basisItems: parsedItems,
      basisConfirmedAt: nextBasisConfirmedAt,
      reportChapters,
      status: confirm ? 'basis_confirmed' : existing.status,
      updatedAt: now,
    })
    .where(and(eq(projects.id, id), eq(projects.tenantId, scope.tenantId)))
    .returning();
  return row ? rowToRecord(row) : null;
}

export async function saveProjectFinance(
  scope: Scope,
  id: string,
  options: {
    input: ProjectFinance['input'];
    confirm?: boolean;
    skip?: boolean;
  },
): Promise<ProjectRecord | null> {
  const existing = await getProject(scope, id);
  if (!existing) {
    return null;
  }
  if (!existing.basisConfirmedAt) {
    throw new Error('请先确认编制依据');
  }
  if (!existing.basicInfo.doFinancialAnalysis) {
    throw new Error('当前项目未启用财务分析');
  }

  const input = financeInputSchema.parse(options.input);
  const now = new Date();
  let finance: ProjectFinance;

  if (options.skip) {
    finance = {
      input,
      result: null,
      calculatedAt: null,
      skipped: true,
    };
  } else {
    const result = calculateFinanceV2(input);
    finance = {
      input,
      result,
      calculatedAt: now.toISOString(),
      skipped: false,
    };
  }

  // 财务结果变更后自动刷新第 11 章程序表，避免旧稿残留大量【待补充】
  const reportChapters = syncProgramChapters(
    { ...existing, finance },
    existing.reportChapters ?? [],
  );

  const db = getDb();
  const [row] = await db
    .update(projects)
    .set({
      finance,
      reportChapters,
      status:
        options.confirm || options.skip ? 'finance_done' : existing.status,
      updatedAt: now,
    })
    .where(and(eq(projects.id, id), eq(projects.tenantId, scope.tenantId)))
    .returning();
  return row ? rowToRecord(row) : null;
}

export async function saveProjectOutline(
  scope: Scope,
  id: string,
  config: OutlineConfig,
  chapters: ReportChapter[],
  status?: ProjectRecord['status'],
): Promise<ProjectRecord | null> {
  const existing = await getProject(scope, id);
  if (!existing) {
    return null;
  }
  if (!existing.basisConfirmedAt) {
    throw new Error('请先确认编制依据');
  }

  const parsed = outlineConfigSchema.parse(config);
  const db = getDb();
  const [row] = await db
    .update(projects)
    .set({
      outlineConfig: parsed,
      reportChapters: chapters,
      status: status ?? existing.status,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, id), eq(projects.tenantId, scope.tenantId)))
    .returning();
  return row ? rowToRecord(row) : null;
}

export async function updateProjectReportChapters(
  scope: Scope,
  id: string,
  chapters: ReportChapter[],
  status?: ProjectRecord['status'],
): Promise<ProjectRecord | null> {
  const existing = await getProject(scope, id);
  if (!existing) {
    return null;
  }
  return withDbRetry(async () => {
    const db = getDb();
    const [row] = await db
      .update(projects)
      .set({
        reportChapters: chapters,
        status: status ?? existing.status,
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, id), eq(projects.tenantId, scope.tenantId)))
      .returning();
    return row ? rowToRecord(row) : null;
  });
}

export async function deleteProject(
  scope: Scope,
  id: string,
): Promise<boolean> {
  await ensureProjectOutlineColumns();
  const db = getDb();
  const deleted = await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.tenantId, scope.tenantId)))
    .returning({ id: projects.id });
  return deleted.length > 0;
}

/** 兼容旧代码引用 */
export { sql };
