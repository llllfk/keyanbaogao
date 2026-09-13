import { chatDeepseek } from '@/lib/llm/deepseek';
import {
  CONSTRUCTION_MODES,
  FUNDING_SOURCES,
  OPERATION_MODES,
  PROJECT_NATURES,
} from '@/lib/project/constants';
import type { BasicInfoInput, BasisItem } from '@/lib/project/schema';
import { getDeepseekApiKey } from '@/lib/settings/llm';

function labelOf<T extends string>(
  items: ReadonlyArray<{ value: T; label: string }>,
  value: T,
): string {
  return items.find(item => item.value === value)?.label ?? value;
}

function buildProjectBrief(basic: BasicInfoInput): string {
  const funding = basic.fundingSources
    .map(value => labelOf(FUNDING_SOURCES, value))
    .join('、');
  return [
    `项目名称：${basic.name || '（未填）'}`,
    `建设性质：${labelOf(PROJECT_NATURES, basic.nature)}`,
    `行业：${basic.industry}`,
    `细分领域：${basic.subSector || '（未填）'}`,
    `建设地点：${basic.locationRegion || '（未填）'}`,
    `主要产品/服务：${basic.mainProductsServices || '（未填）'}`,
    `资金来源：${funding || '（未填）'}`,
    `建设管理模式：${labelOf(CONSTRUCTION_MODES, basic.constructionManagementMode)}`,
    `运营模式：${labelOf(OPERATION_MODES, basic.operationMode)}`,
    `是否做财务测算：${basic.doFinancialAnalysis ? '是' : '否'}`,
    `建设内容与规模：${(basic.constructionContentScale || '').slice(0, 400) || '（未填）'}`,
  ].join('\n');
}

function parseRecommendPayload(raw: string): {
  selectedIds: string[];
  reason: string;
} {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const text = (fenced?.[1] ?? raw).trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    const objStart = text.indexOf('{');
    const objEnd = text.lastIndexOf('}');
    const arrStart = text.indexOf('[');
    const arrEnd = text.lastIndexOf(']');
    if (objStart >= 0 && objEnd > objStart) {
      parsed = JSON.parse(text.slice(objStart, objEnd + 1)) as unknown;
    } else if (arrStart >= 0 && arrEnd > arrStart) {
      parsed = JSON.parse(text.slice(arrStart, arrEnd + 1)) as unknown;
    } else {
      throw new Error('模型未返回可解析的 JSON');
    }
  }

  if (Array.isArray(parsed)) {
    return {
      selectedIds: parsed.filter((id): id is string => typeof id === 'string'),
      reason: '',
    };
  }

  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'selectedIds' in parsed &&
    Array.isArray((parsed as { selectedIds: unknown }).selectedIds)
  ) {
    const selectedIds = (parsed as { selectedIds: unknown[] }).selectedIds.filter(
      (id): id is string => typeof id === 'string',
    );
    const reasonRaw = (parsed as { reason?: unknown }).reason;
    const reason = typeof reasonRaw === 'string' ? reasonRaw.trim() : '';
    return { selectedIds, reason };
  }

  throw new Error('模型返回格式无效');
}

/**
 * 在规则召回的候选条目上，用 DeepSeek 二次勾选相关依据。
 * 硬约束：只能从候选 ID 中选；不得新增条目；本项目批复（project）保持原勾选。
 */
export async function aiRecommendBasisSelection(options: {
  userId: string;
  basic: BasicInfoInput;
  candidates: BasisItem[];
}): Promise<{ selectedIds: string[]; reason: string }> {
  const apiKey = await getDeepseekApiKey(options.userId);
  if (!apiKey) {
    throw new Error('请先在系统设置中配置 DeepSeek API Key');
  }

  const selectable = options.candidates.filter(
    item => item.group === 'policy' || item.group === 'standard',
  );
  if (selectable.length === 0) {
    throw new Error(
      '当前没有可供 AI 勾选的政策/标准候选，请先完善信息采集或同步依据库',
    );
  }

  const catalog = selectable
    .map(
      (item, index) =>
        `${index + 1}. id=${item.id} | 组别=${item.group} | 《${item.title}》${
          item.docCode ? `（${item.docCode}）` : ''
        }`,
    )
    .join('\n');

  const content = await chatDeepseek({
    apiKey,
    temperature: 0.1,
    maxTokens: 2048,
    messages: [
      {
        role: 'system',
        content: [
          '你是工程咨询可研报告的编制依据助手。',
          '任务：从给定候选列表中，为该政府投资可行性研究挑选应写入「1.3 编制依据」的条目。',
          '硬性规则：',
          '1. 只能返回候选中已有的 id，禁止编造任何新文件、文号或标准号；',
          '2. 优先保留通用核心文件（如政府投资条例、发改投资规〔2023〕304号大纲）；',
          '3. 再按项目地点、行业、细分领域、工程类型挑选高度相关的政策与标准；',
          '4. 明显无关的不要选；宁可少选，也不要整表全选；',
          '5. 一般政策类 8～25 条、标准规范类 5～20 条较合适（视候选多少浮动）；',
          '6. 只输出 JSON，不要解释。格式：{"selectedIds":["id1","id2"],"reason":"一句话说明"}',
        ].join('\n'),
      },
      {
        role: 'user',
        content: [
          '【项目画像】',
          buildProjectBrief(options.basic),
          '',
          '【候选依据】',
          catalog,
          '',
          '请返回 JSON。',
        ].join('\n'),
      },
    ],
  });

  const { selectedIds: rawIds, reason } = parseRecommendPayload(content);
  const allowed = new Set(selectable.map(item => item.id));
  const selectedIds = [
    ...new Set(
      rawIds.map(id => id.trim()).filter(id => allowed.has(id)),
    ),
  ];

  if (selectedIds.length === 0) {
    throw new Error('AI 未勾选到有效条目，请手工勾选或稍后重试');
  }

  return { selectedIds, reason };
}
