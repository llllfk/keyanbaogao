import { chatDeepseek } from '@/lib/llm/deepseek';
import {
  formatFinanceForPrompt,
  renderFinanceAttachmentTables,
  type FinanceResult,
} from '@/lib/finance/engine';
import { formatAttachmentsForPrompt } from '@/lib/project/attachments';
import {
  CONSTRUCTION_MODES,
  FUNDING_SOURCES,
  OPERATION_MODES,
  PROJECT_NATURES,
} from '@/lib/project/constants';
import {
  getOutlineTemplate,
  listSelectableChapters,
  orderChaptersForDocument,
  orderChaptersForGeneration,
  type OutlineNode,
} from '@/lib/project/outline';
import type {
  BasicInfoInput,
  BasisItem,
  OutlineConfig,
  ProjectRecord,
  ReportChapter,
} from '@/lib/project/schema';
import { getDeepseekApiKey } from '@/lib/settings/llm';

function labelOf<T extends string>(
  items: ReadonlyArray<{ value: T; label: string }>,
  value: T,
): string {
  return items.find(item => item.value === value)?.label ?? value;
}

function formatBasisList(items: BasisItem[], group: BasisItem['group']): string {
  const rows = items.filter(item => item.selected && item.group === group);
  if (rows.length === 0) {
    return '（暂无）';
  }
  return rows
    .map((item, index) => {
      const code = item.docCode ? `（${item.docCode}）` : '';
      return `${index + 1}. 《${item.title}》${code}`;
    })
    .join('\n');
}

/** 1.3 编制依据：程序渲染，不调模型 */
export function renderBasisChapter(items: BasisItem[]): string {
  const policy = formatBasisList(items, 'policy');
  const standard = formatBasisList(items, 'standard');
  const project = formatBasisList(items, 'project');
  return [
    '### 1.3.1 主要规划及产业政策',
    policy,
    '',
    '### 1.3.2 主要标准规范',
    standard,
    '',
    '### 1.3.3 本项目批复 / 委托',
    project,
  ].join('\n');
}

function renderAttachmentsPlaceholder(hasFinanceResult: boolean): string {
  const tableHint = hasFinanceResult
    ? '已启用财务测算但尚未确认 V2 分年结果；请先完成财务测算页确认，再重生成本章以填充程序表。'
    : '尚未完成财务测算。完成测算并确认后，本章将自动填入总投资、分年投资、现金流等简化表。';
  return [
    '### 11.1.1 附表清单',
    tableHint,
    '建议附表名称：总投资估算表、分年度投资计划表、资金筹措表、项目投资现金流量表、借款还本付息简表、主要财务评价指标表等。',
    '',
    '### 11.1.2 附图清单',
    '下列图纸由设计/编制单位随报审稿附送：',
    '1. 项目区位图',
    '2. 总平面布置示意图',
    '3. 主要工艺流程示意图（如适用）',
    '',
    '### 11.1.3 附件清单',
    '下列支持性文件由项目单位/编制单位随报审稿附送：',
    '1. 项目建议书或相关批复文件复印件',
    '2. 用地、规划等要素保障相关材料',
    '3. 环境影响评价等相关支持性文件',
    '4. 其他需要说明的材料',
  ].join('\n');
}

function renderAttachmentsChapter(project: ProjectRecord): string {
  const result = project.finance?.result as FinanceResult | null | undefined;
  if (
    result &&
    Array.isArray(result.yearlyRows) &&
    result.yearlyRows.length > 0
  ) {
    return renderFinanceAttachmentTables(result);
  }
  return renderAttachmentsPlaceholder(Boolean(result));
}

export function buildFinanceContext(project: ProjectRecord): string {
  const finance = project.finance;
  if (!project.basicInfo.doFinancialAnalysis) {
    return '财务测算：未启用；勿编造精确财务数字，可写定性投资与效益分析，禁止整段【待补充】。';
  }
  if (finance?.skipped) {
    return '财务测算：用户已跳过；勿编造精确财务数字，可写定性分析，禁止整段【待补充】。';
  }
  if (finance?.result) {
    return `【财务测算结果（V2）】\n${formatFinanceForPrompt(finance.result as FinanceResult)}\n须原样引用总投资、资本金、债务、IRR/NPV 等已给出指标，禁止改写另算，禁止对这些数字标【待补充】。`;
  }
  return '财务测算：已启用但尚未确认结果；勿编造精确财务数字，可写定性分析，精确金额缺省时最多一处【待补充】。';
}

/** 财务/依据变更后，同步刷新程序章（依据列表、第 11 章附表）正文 */
export function syncProgramChapters(
  project: ProjectRecord,
  chapters: ReportChapter[],
): ReportChapter[] {
  if (chapters.length === 0) {
    return chapters;
  }
  const config = project.outlineConfig;
  if (!config) {
    return chapters;
  }
  const selectable = listSelectableChapters(
    getOutlineTemplate(config.outlineId),
  );
  const now = new Date().toISOString();
  return chapters.map(item => {
    const node = selectable.find(entry => entry.id === item.chapterId);
    if (!node) {
      return item;
    }
    if (node.programmatic === 'basis') {
      return {
        ...item,
        content: renderBasisChapter(project.basisItems),
        status: 'done' as const,
        error: undefined,
        updatedAt: now,
      };
    }
    if (node.noLlm) {
      return {
        ...item,
        content: renderAttachmentsChapter(project),
        status: 'done' as const,
        error: undefined,
        updatedAt: now,
      };
    }
    return item;
  });
}

function fieldOrQualitative(label: string, value: string): string {
  const text = value.trim();
  if (text) {
    return `${label}：${text}`;
  }
  return `${label}：（未提供书面材料，请结合本项目行业与建设内容作定性展开，禁止因此整段只写【待补充】）`;
}

export function buildBasicInfoContext(basic: BasicInfoInput): string {
  const funding = basic.fundingSources
    .map(value => labelOf(FUNDING_SOURCES, value))
    .join('、');
  const attachmentBlock = formatAttachmentsForPrompt(basic);
  return [
    `项目名称：${basic.name || '（未填）'}`,
    `投资性质：${basic.investmentType === 'government' ? '政府投资' : '企业投资'}`,
    `行业：${basic.industry}`,
    fieldOrQualitative('细分领域', basic.subSector),
    `项目性质：${labelOf(PROJECT_NATURES, basic.nature)}`,
    `项目单位：${basic.unitName || '（未填）'}`,
    fieldOrQualitative('单位概况', basic.unitOverview),
    `建设地点：${[basic.locationRegion, basic.locationDetail].filter(Boolean).join(' ') || '（未填）'}`,
    fieldOrQualitative('建设期', basic.constructionPeriod),
    fieldOrQualitative('运营期', basic.operationPeriod),
    fieldOrQualitative('建设内容与规模', basic.constructionContentScale),
    fieldOrQualitative('主要产品/服务', basic.mainProductsServices),
    fieldOrQualitative('目标市场', basic.targetMarket),
    fieldOrQualitative('市场分析', basic.marketAnalysis),
    fieldOrQualitative('前期工作进展', basic.prepProgress),
    `是否涉及土地征收：${basic.involvesLandAcquisition ? '是' : '否'}`,
    fieldOrQualitative('技术经济指标', basic.techIndicators),
    fieldOrQualitative('技术方案', basic.techScheme),
    fieldOrQualitative('设备清单', basic.equipmentList),
    fieldOrQualitative('设计方案', basic.designText),
    `资金来源：${funding || '（未填）'}`,
    basic.totalInvestmentWan > 0
      ? `总投资额：${basic.totalInvestmentWan} 万元`
      : '总投资额：（未填）',
    `建设管理模式：${
      basic.constructionManagementMode === 'other' &&
      basic.constructionManagementModeOther.trim()
        ? `其他（${basic.constructionManagementModeOther.trim()}）`
        : labelOf(CONSTRUCTION_MODES, basic.constructionManagementMode)
    }`,
    `运营模式：${
      basic.operationMode === 'other' && basic.operationModeOther.trim()
        ? `其他（${basic.operationModeOther.trim()}）`
        : labelOf(OPERATION_MODES, basic.operationMode)
    }`,
    `是否启用财务分析：${basic.doFinancialAnalysis ? '是' : '否'}`,
    attachmentBlock,
  ]
    .filter(Boolean)
    .join('\n');
}

function buildSystemPrompt(): string {
  return [
    '你是可研报告编制助手，按「政府投资项目可行性研究报告编写通用大纲（2023年版）」及章节「写作要点」撰写指定章节初稿。',
    '要求：',
    '1. 只输出本章正文，不要输出章节编号之外的前言、免责声明或“好的/以下是”。',
    '2. 使用规范公文语体。结构与篇幅必须以本章「写作要点」为准：要点要求精炼/简述时不得强行扩写成大段；要点要求充分论证时再用 ### 小标题分条展开。',
    '3. 【材料优先、亦可自动扩写】必须吃透：项目基础信息、附件抽取文本、已确认依据、财务测算结果。若写作要点含「AI自动扩写」或用户未提供技术方案/设备清单，须按行业通行做法自行拟定完整技术与设备方案（可用合理数量区间与常用规格），禁止用【待补充】凑字或只写空泛原则。概述类章节优先“写准、写短”，专论类章节再“写满、写透”。',
    '4. 【严禁滥标待补充】上下文写“未提供书面材料/请定性展开/AI自动扩写”时，必须写实质性内容，不得输出【待补充】。全章【待补充】累计一般不超过 2 处。',
    '5. 【待补充】仅允许用于：用户未给出且无法从行业惯例合理给出的精确批复结论；未确认的文号/标准号。财务测算结果里已有的总投资/IRR/NPV 等禁止写【待补充】。设备数量、技术指标在自动扩写章中应给出合理区间，不得标【待补充】。',
    '6. 对建设条件、必要性、方案、运营、影响、风险等，应结合行业常识与已填建设内容做合理展开；不得编造具体文号、批复结论或未给出的精确财务数字。',
    '7. 若上下文提供「财务测算结果（V2）」，金额与比率（含 IRR/NPV、回收期）必须原样引用并说明税前简化口径，不得改写另算。',
    '8. 可引用“已确认编制依据”中的标题与文号；自动扩写技术方案时可写明“参照行业常用规范/标准体系”，但不得捏造未列出的具体文号。',
    '9. 【文风】禁止同义反复与套话堆砌；项目名称、项目单位等事实性表述宜一句话点明，细节放到对应专章。设备与技术节优先用 Markdown 表格。',
    '10. 成果为 AI 辅助初稿，表述客观审慎；自动扩写内容供编制单位复核，勿写成已批复定论。',
  ].join('\n');
}

function countLlmChapters(
  selectedChapterIds: string[],
  outlineId?: string,
): number {
  const template = getOutlineTemplate(outlineId);
  const byId = new Map(
    listSelectableChapters(template).map(node => [node.id, node]),
  );
  return selectedChapterIds.filter(id => {
    const node = byId.get(id);
    return Boolean(node && !node.programmatic && !node.noLlm);
  }).length;
}

/** 概述等精炼章：限制篇幅，避免被均分总字数撑成注水稿 */
function chapterTargetWords(
  totalWords: number,
  llmChapterCount: number,
  chapterId: string,
  autoExpand?: boolean,
): number {
  const per = Math.round(totalWords / Math.max(1, llmChapterCount));
  // 专论章约 1500～8000 字；行业自动扩写章可到 12000
  const maxWords = autoExpand ? 12000 : 8000;
  const clamped = Math.max(1500, Math.min(maxWords, per));
  if (chapterId === '1.1') {
    return Math.min(900, Math.max(500, Math.round(clamped * 0.28)));
  }
  if (chapterId === '1.2') {
    return Math.min(600, Math.max(280, Math.round(clamped * 0.18)));
  }
  if (chapterId === '1.4' || chapterId === '10.2') {
    return Math.min(1500, Math.max(600, Math.round(clamped * 0.45)));
  }
  if (autoExpand) {
    return Math.max(3500, clamped);
  }
  return clamped;
}

function isConciseChapter(chapterId: string): boolean {
  return (
    chapterId === '1.1' ||
    chapterId === '1.2' ||
    chapterId === '1.4' ||
    chapterId === '10.2'
  );
}

function buildUserPrompt(options: {
  chapter: OutlineNode;
  project: ProjectRecord;
  targetWords: number;
  llmChapterCount: number;
  priorSummaries: string;
  /** 单章重写时的可选优化指令 */
  rewriteInstruction?: string;
}): string {
  const selectedBasis = options.project.basisItems.filter(item => item.selected);
  const autoExpand = Boolean(options.chapter.autoExpand);
  const approx = chapterTargetWords(
    options.targetWords,
    options.llmChapterCount,
    options.chapter.id,
    autoExpand,
  );
  const concise = isConciseChapter(options.chapter.id);
  const rewrite = options.rewriteInstruction?.trim();
  return [
    `请撰写章节：${options.chapter.id} ${options.chapter.title}`,
    `写作要点：${options.chapter.writingGuide}`,
    concise
      ? `建议篇幅：约 ${approx} 字（精炼章，允许少写，禁止为凑字数扩写或重复）。`
      : autoExpand
        ? `建议篇幅：约 ${approx} 字（行业自动扩写章：尽量写满；无用户设备清单也须输出完整技术方案与配置表）。`
        : `建议篇幅：约 ${approx} 字（尽量接近，可上下浮动 20%；用已有材料与定性分析写满，禁止通篇或大段【待补充】）。`,
    concise
      ? options.chapter.id === '1.1'
        ? [
            '结构要求：按写作要点分条（###）。特别强调：',
            '- 「项目名称及简称」小节：只写全称与简称，最多两句话；不要写性质/行业/单位/地点/投资。',
            '- 「建设目标」与「建设任务」必须分成两个小节。',
            '- 其余每条 1～3 句即可，不要把基础信息表整表复读一遍。',
          ].join('\n')
        : `结构要求：可用 ### 小标题按写作要点分条；每条宜短，项目名称/单位等事实句保持一两句，建设目标与建设任务必须分开写。`
      : autoExpand
        ? `结构要求：至少拆出 3～6 个 ### 小标题（编号沿用 ${options.chapter.id}.1、${options.chapter.id}.2…）；技术方案、设备配置（Markdown表）、安装与验收分块写清。`
        : `结构要求：至少拆出 2～5 个 ### 小标题（编号沿用 ${options.chapter.id}.1、${options.chapter.id}.2…），层层论述。`,
    autoExpand
      ? '【自动扩写纪律】本章允许并要求按行业惯例生成设备规格与数量区间；全章尽量 0 处【待补充】；禁止只写原则不写配置。财务测算已给出的数字必须写入。'
      : '【待补充纪律】全章最多 2 处【待补充】；缺材料时写定性分析。财务测算已给出的数字必须写入，不得标【待补充】。',
    rewrite
      ? [
          '',
          '【用户优化指令（重写时优先遵循，但不得编造文号/财务数字）】',
          rewrite,
        ].join('\n')
      : '',
    '',
    '【项目基础信息】',
    buildBasicInfoContext(options.project.basicInfo),
    '',
    buildFinanceContext(options.project),
    '',
    '【已确认编制依据】',
    formatBasisList(selectedBasis, 'policy'),
    formatBasisList(selectedBasis, 'standard'),
    formatBasisList(selectedBasis, 'project'),
    '',
    options.priorSummaries
      ? `【已生成章节摘要（供口径一致）】\n${options.priorSummaries}`
      : '【已生成章节摘要】暂无',
  ]
    .filter(part => part !== '')
    .join('\n');
}

function summarizeContent(title: string, content: string): string {
  const compact = content.replace(/\s+/g, ' ').trim();
  return `${title}：${compact.slice(0, 180)}${compact.length > 180 ? '…' : ''}`;
}

export function initReportChapters(
  config: OutlineConfig,
  existing: ReportChapter[] = [],
  options?: { preserveDone?: boolean },
): ReportChapter[] {
  const template = getOutlineTemplate(config.outlineId);
  const byId = new Map(
    listSelectableChapters(template).map(node => [node.id, node]),
  );
  // 存库/展示/导出用大纲正文顺序；生成队列另用 orderChaptersForGeneration
  const ordered = orderChaptersForDocument(
    config.selectedChapterIds,
    config.outlineId,
  );
  const preserveDone = options?.preserveDone === true;
  const existingById = new Map(
    existing.map(item => [item.chapterId, item]),
  );

  return ordered.map(node => {
    const chapter = byId.get(node.id) ?? node;
    const prev = existingById.get(chapter.id);
    if (
      preserveDone &&
      prev &&
      prev.status === 'done' &&
      prev.content.trim()
    ) {
      return prev;
    }
    return {
      chapterId: chapter.id,
      title: `${chapter.id} ${chapter.title}`,
      content: '',
      status: 'pending' as const,
      updatedAt: new Date().toISOString(),
    } satisfies ReportChapter;
  });
}

/** 仍需生成的章节（待生成 / 失败）；顺序为生成队列顺序（deferLast 靠后） */
export function listPendingChapterIds(
  chapters: ReportChapter[],
  outlineId?: string,
): string[] {
  const pending = new Set(
    chapters
      .filter(item => item.status === 'pending' || item.status === 'failed')
      .map(item => item.chapterId),
  );
  if (pending.size === 0) {
    return [];
  }
  const selectedIds = chapters.map(item => item.chapterId);
  return orderChaptersForGeneration(selectedIds, outlineId)
    .map(node => node.id)
    .filter(id => pending.has(id));
}

export async function generateOneChapter(options: {
  userId: string;
  project: ProjectRecord;
  chapterId: string;
  /** 单章重写时的可选优化指令 */
  rewriteInstruction?: string;
}): Promise<ReportChapter> {
  const config = options.project.outlineConfig;
  if (!config) {
    throw new Error('请先保存大纲选择');
  }
  if (!options.project.basisConfirmedAt) {
    throw new Error('请先确认编制依据');
  }

  const template = getOutlineTemplate(config.outlineId);
  const chapter = listSelectableChapters(template).find(
    node => node.id === options.chapterId,
  );
  if (!chapter) {
    throw new Error('章节不存在或不在大纲中');
  }
  if (!config.selectedChapterIds.includes(chapter.id)) {
    throw new Error('该章节未勾选，无法生成');
  }

  const now = new Date().toISOString();
  const title = `${chapter.id} ${chapter.title}`;

  if (chapter.programmatic === 'basis') {
    return {
      chapterId: chapter.id,
      title,
      content: renderBasisChapter(options.project.basisItems),
      status: 'done',
      updatedAt: now,
    };
  }

  if (chapter.noLlm) {
    return {
      chapterId: chapter.id,
      title,
      content: renderAttachmentsChapter(options.project),
      status: 'done',
      updatedAt: now,
    };
  }

  const apiKey = await getDeepseekApiKey(options.userId);
  if (!apiKey) {
    throw new Error('请先在设置中配置 DeepSeek API Key');
  }

  const priorSummaries = (options.project.reportChapters ?? [])
    .filter(
      item =>
        item.status === 'done' &&
        item.content &&
        item.chapterId !== chapter.id,
    )
    .map(item => summarizeContent(item.title, item.content))
    .join('\n');

  const llmChapterCount = countLlmChapters(
    config.selectedChapterIds,
    config.outlineId,
  );

  const approxWords = chapterTargetWords(
    config.targetWords,
    llmChapterCount,
    chapter.id,
    Boolean(chapter.autoExpand),
  );
  // 中文约 1～2 token/字；给足余量，避免长章被截断
  const maxTokens = Math.min(8192, Math.max(4096, Math.round(approxWords * 2)));

  const content = await chatDeepseek({
    apiKey,
    maxTokens,
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      {
        role: 'user',
        content: buildUserPrompt({
          chapter,
          project: options.project,
          targetWords: config.targetWords,
          llmChapterCount,
          priorSummaries,
          rewriteInstruction: options.rewriteInstruction,
        }),
      },
    ],
  });

  return {
    chapterId: chapter.id,
    title,
    content,
    status: 'done',
    updatedAt: now,
  };
}

export function mergeChapterIntoList(
  chapters: ReportChapter[],
  next: ReportChapter,
): ReportChapter[] {
  const exists = chapters.some(item => item.chapterId === next.chapterId);
  if (!exists) {
    return [...chapters, next];
  }
  return chapters.map(item =>
    item.chapterId === next.chapterId ? next : item,
  );
}

export function isGenerationComplete(chapters: ReportChapter[]): boolean {
  if (chapters.length === 0) {
    return false;
  }
  return chapters.every(
    item => item.status === 'done' || item.status === 'skipped',
  );
}
