import { z } from 'zod';

import type { ProjectFinance } from '@/lib/finance/schema';
import { projectFinanceSchema } from '@/lib/finance/schema';

import {
  CONSTRUCTION_MODES,
  FUNDING_SOURCES,
  INDUSTRIES,
  INVESTMENT_TYPES,
  OPERATION_MODES,
  PROJECT_NATURES,
  PROJECT_STATUSES,
} from './constants';

const industrySchema = z.enum(INDUSTRIES);
const natureSchema = z.enum(
  PROJECT_NATURES.map(item => item.value) as [
    (typeof PROJECT_NATURES)[number]['value'],
    ...(typeof PROJECT_NATURES)[number]['value'][],
  ],
);
const fundingSchema = z.enum(
  FUNDING_SOURCES.map(item => item.value) as [
    (typeof FUNDING_SOURCES)[number]['value'],
    ...(typeof FUNDING_SOURCES)[number]['value'][],
  ],
);
const constructionModeSchema = z.enum(
  CONSTRUCTION_MODES.map(item => item.value) as [
    (typeof CONSTRUCTION_MODES)[number]['value'],
    ...(typeof CONSTRUCTION_MODES)[number]['value'][],
  ],
);
const operationModeSchema = z.enum(
  OPERATION_MODES.map(item => item.value) as [
    (typeof OPERATION_MODES)[number]['value'],
    ...(typeof OPERATION_MODES)[number]['value'][],
  ],
);
const investmentTypeSchema = z.enum(
  INVESTMENT_TYPES.map(item => item.value) as [
    (typeof INVESTMENT_TYPES)[number]['value'],
    ...(typeof INVESTMENT_TYPES)[number]['value'][],
  ],
);
const statusSchema = z.enum(
  PROJECT_STATUSES.map(item => item.value) as [
    (typeof PROJECT_STATUSES)[number]['value'],
    ...(typeof PROJECT_STATUSES)[number]['value'][],
  ],
);

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message);

/** 信息采集页可挂附件的字段 */
export const ATTACHMENT_FIELDS = [
  'marketAnalysis',
  'techIndicators',
  'techScheme',
  'equipmentList',
  'designText',
] as const;

export type AttachmentField = (typeof ATTACHMENT_FIELDS)[number];

export const projectAttachmentSchema = z.object({
  id: z.string().min(1),
  field: z.enum(ATTACHMENT_FIELDS),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().max(120),
  size: z.number().int().nonnegative(),
  storageKey: z.string().trim().min(1).max(500),
  extractedText: z.string().max(50000).optional(),
  extractStatus: z.enum(['ok', 'skipped', 'failed']),
  uploadedAt: z.string().min(1),
});

export type ProjectAttachment = z.infer<typeof projectAttachmentSchema>;

/** 表单校验用：不含附件（附件走独立上传接口） */
export const basicInfoFormSchema = z.object({
  doFinancialAnalysis: z.boolean(),
  name: z
    .string()
    .trim()
    .min(1, '请填写项目名称')
    .max(100, '项目名称不超过 100 字'),
  investmentType: investmentTypeSchema,
  industry: industrySchema,
  subSector: z
    .string()
    .trim()
    .min(1, '请填写细分领域')
    .max(50, '细分领域不超过 50 字'),
  nature: natureSchema,
  unitName: z
    .string()
    .trim()
    .min(1, '请填写项目单位名称')
    .max(100, '单位名称不超过 100 字'),
  unitOverview: optionalText(2000, '单位概况不超过 2000 字'),
  locationRegion: z.string().trim().min(1, '请填写建设地点（省市区）'),
  locationDetail: z
    .string()
    .trim()
    .min(1, '请填写详细建设地点')
    .max(100, '详细地点不超过 100 字'),
  constructionPeriod: z
    .string()
    .trim()
    .min(1, '请填写建设期')
    .max(100, '建设期不超过 100 字'),
  operationPeriod: optionalText(100, '运营期不超过 100 字'),
  constructionContentScale: z
    .string()
    .trim()
    .min(1, '请填写建设内容和规模')
    .max(3000, '不超过 3000 字'),
  mainProductsServices: z
    .string()
    .trim()
    .min(1, '请填写主要产品/服务')
    .max(3000, '不超过 3000 字'),
  targetMarket: z
    .string()
    .trim()
    .min(1, '请填写目标市场')
    .max(100, '目标市场不超过 100 字'),
  marketAnalysis: optionalText(3000, '市场分析不超过 3000 字'),
  prepProgress: optionalText(2000, '前期工作进展不超过 2000 字'),
  involvesLandAcquisition: z.boolean(),
  techIndicators: optionalText(3000, '技术经济指标不超过 3000 字'),
  techScheme: optionalText(3000, '技术方案不超过 3000 字'),
  equipmentList: optionalText(3000, '设备清单不超过 3000 字'),
  designText: optionalText(3000, '设计方案文本不超过 3000 字'),
  fundingSources: z.array(fundingSchema).min(1, '请至少选择一种资金来源'),
  constructionManagementMode: constructionModeSchema,
  operationMode: operationModeSchema,
});

export const basicInfoSchema = basicInfoFormSchema.extend({
  attachments: z.array(projectAttachmentSchema),
});

/** 草稿：允许未填完，只校验类型与长度上限 */
export const basicInfoDraftSchema = z
  .object({
    doFinancialAnalysis: z.boolean(),
    name: z.string().trim().max(100, '项目名称不超过 100 字'),
    investmentType: investmentTypeSchema,
    industry: industrySchema,
    subSector: z.string().trim().max(50, '细分领域不超过 50 字'),
    nature: natureSchema,
    unitName: z.string().trim().max(100, '单位名称不超过 100 字'),
    unitOverview: optionalText(2000, '单位概况不超过 2000 字'),
    locationRegion: z.string().trim().max(200),
    locationDetail: z.string().trim().max(100, '详细地点不超过 100 字'),
    constructionPeriod: z.string().trim().max(100, '建设期不超过 100 字'),
    operationPeriod: optionalText(100, '运营期不超过 100 字'),
    constructionContentScale: z.string().trim().max(3000, '不超过 3000 字'),
    mainProductsServices: z.string().trim().max(3000, '不超过 3000 字'),
    targetMarket: z.string().trim().max(100, '目标市场不超过 100 字'),
    marketAnalysis: optionalText(3000, '市场分析不超过 3000 字'),
    prepProgress: optionalText(2000, '前期工作进展不超过 2000 字'),
    involvesLandAcquisition: z.boolean(),
    techIndicators: optionalText(3000, '技术经济指标不超过 3000 字'),
    techScheme: optionalText(3000, '技术方案不超过 3000 字'),
    equipmentList: optionalText(3000, '设备清单不超过 3000 字'),
    designText: optionalText(3000, '设计方案文本不超过 3000 字'),
    fundingSources: z.array(fundingSchema),
    constructionManagementMode: constructionModeSchema,
    operationMode: operationModeSchema,
    attachments: z.array(projectAttachmentSchema).optional(),
  })
  .partial();

export const basisItemSchema = z.object({
  id: z.string().min(1),
  group: z.enum(['policy', 'standard', 'project']),
  title: z.string().trim().min(1, '请填写文件名称').max(300),
  docCode: z.string().trim().max(100),
  issuer: z.string().trim().max(100),
  sourceUrl: z.string().trim().max(500),
  /** 来源网站显示名；手填可空 */
  sourceSite: z.string().trim().max(100).default(''),
  source: z.enum(['pack', 'manual']),
  packId: z.string().trim().max(100),
  selected: z.boolean(),
});

export const basisSaveSchema = z.object({
  items: z.array(basisItemSchema),
  confirm: z.boolean().optional(),
});

export const outlineConfigSchema = z.object({
  outlineId: z.string().min(1).default('gov_feasibility_2023'),
  selectedChapterIds: z.array(z.string().min(1)).min(1, '请至少选择一章'),
  targetWords: z.number().int().min(3000).max(300000).default(80000),
});

export const outlineSaveSchema = outlineConfigSchema;

export const reportChapterSchema = z.object({
  chapterId: z.string().min(1),
  title: z.string().min(1),
  content: z.string().default(''),
  status: z.enum(['pending', 'generating', 'done', 'failed', 'skipped']),
  error: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const projectSchema = z.object({
  id: z.string(),
  status: statusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  basicInfo: basicInfoSchema,
  basisItems: z.array(basisItemSchema).default([]),
  basisConfirmedAt: z.string().nullable().optional(),
  finance: projectFinanceSchema.nullable().optional(),
  outlineConfig: outlineConfigSchema.nullable().optional(),
  reportChapters: z.array(reportChapterSchema).default([]),
});

export type BasicInfoInput = z.infer<typeof basicInfoSchema>;
export type BasisItem = z.infer<typeof basisItemSchema>;
export type OutlineConfig = z.infer<typeof outlineConfigSchema>;
export type ReportChapter = z.infer<typeof reportChapterSchema>;
export type ProjectRecord = z.infer<typeof projectSchema>;
export type { ProjectFinance };

export const defaultBasicInfo = (): BasicInfoInput => ({
  doFinancialAnalysis: false,
  name: '',
  investmentType: 'government',
  industry: '建筑',
  subSector: '',
  nature: 'new',
  unitName: '',
  unitOverview: '',
  locationRegion: '',
  locationDetail: '',
  constructionPeriod: '',
  operationPeriod: '20年',
  constructionContentScale: '',
  mainProductsServices: '',
  targetMarket: '',
  marketAnalysis: '',
  prepProgress: '',
  involvesLandAcquisition: false,
  techIndicators: '',
  techScheme: '',
  equipmentList: '',
  designText: '',
  fundingSources: [],
  constructionManagementMode: 'epc',
  operationMode: 'self',
  attachments: [],
});

/** 合并缺省字段，兼容旧草稿 JSON */
export function normalizeBasicInfo(
  input: Partial<BasicInfoInput> | undefined,
): BasicInfoInput {
  const attachments = Array.isArray(input?.attachments)
    ? input.attachments
        .map(item => {
          const parsed = projectAttachmentSchema.safeParse(item);
          return parsed.success ? parsed.data : null;
        })
        .filter((item): item is ProjectAttachment => item !== null)
    : [];

  return {
    ...defaultBasicInfo(),
    ...input,
    doFinancialAnalysis: input?.doFinancialAnalysis === true,
    attachments,
  };
}

export function normalizeBasisItem(
  item: Partial<BasisItem> & Pick<BasisItem, 'id' | 'group' | 'title'>,
): BasisItem {
  return {
    id: item.id,
    group: item.group,
    title: item.title,
    docCode: item.docCode ?? '',
    issuer: item.issuer ?? '',
    sourceUrl: item.sourceUrl ?? '',
    sourceSite: item.sourceSite ?? '',
    source: item.source ?? 'manual',
    packId: item.packId ?? '',
    selected: item.selected ?? true,
  };
}

export function normalizeProjectRecord(
  project: Omit<
    ProjectRecord,
    'basicInfo' | 'basisItems' | 'finance' | 'outlineConfig' | 'reportChapters'
  > & {
    basicInfo?: Partial<BasicInfoInput>;
    basisItems?: Array<Partial<BasisItem> & Pick<BasisItem, 'id' | 'group' | 'title'>>;
    basisConfirmedAt?: string | null;
    finance?: ProjectFinance | null;
    outlineConfig?: OutlineConfig | null;
    reportChapters?: ReportChapter[];
  },
): ProjectRecord {
  const financeParsed = project.finance
    ? projectFinanceSchema.safeParse(project.finance)
    : null;
  return {
    ...project,
    basicInfo: normalizeBasicInfo(project.basicInfo),
    basisItems: (project.basisItems ?? []).map(normalizeBasisItem),
    basisConfirmedAt: project.basisConfirmedAt ?? null,
    finance: financeParsed?.success ? financeParsed.data : null,
    outlineConfig: project.outlineConfig ?? null,
    reportChapters: project.reportChapters ?? [],
  };
}
