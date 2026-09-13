export type OutlineOptionalKey =
  | 'land'
  | 'digital'
  | 'debt'
  | 'finance_sustain'
  | 'carbon';

export type OutlineNode = {
  id: string;
  title: string;
  /** 写作要点，注入提示词 */
  writingGuide: string;
  optional?: boolean;
  optionalKey?: OutlineOptionalKey;
  /** 不走 LLM（如第 11 章） */
  noLlm?: boolean;
  /** 依赖前文，最后生成（1.4 / 10.1） */
  deferLast?: boolean;
  /** 程序渲染，不调模型 */
  programmatic?: 'basis';
  children?: OutlineNode[];
};

export type OutlineTemplate = {
  id: string;
  name: string;
  description: string;
  tree: OutlineNode[];
};

/** 政府投资可研大纲 2023 版（第一期内置） */
export const GOV_FEASIBILITY_2023: OutlineTemplate = {
  id: 'gov_feasibility_2023',
  name: '政府投资项目可行性研究报告编写通用大纲（2023年版）',
  description: '按发改投资规〔2023〕304号通用大纲裁剪的可生成章节树',
  tree: [
    {
      id: '1',
      title: '概述',
      writingGuide: '本章为总述，各小节分别展开。',
      children: [
        {
          id: '1.1',
          title: '项目概况',
          writingGuide:
            '按通用大纲拆小节写：项目名称、建设目标和任务、建设地点、建设规模和内容、建设工期、投资规模和资金来源、建设模式、主要技术经济指标、绩效目标。已有字段与附件要写充分；仅缺精确数值处标【待补充】。',
        },
        {
          id: '1.2',
          title: '项目单位概况',
          writingGuide:
            '结合单位名称与概况展开：基本信息、发展现状、履职能力与拟建项目匹配性；无类似项目经验时可写管理与组织保障能力，勿整段【待补充】。',
        },
        {
          id: '1.3',
          title: '编制依据',
          writingGuide: '由系统按已确认依据列表渲染，无需模型撰写正文。',
          programmatic: 'basis',
        },
        {
          id: '1.4',
          title: '主要结论和建议',
          writingGuide:
            '归纳全文主要结论与建议，需与后续章节口径一致；宜在其他章生成后撰写。禁止编造未给出的财务或审批结论。',
          deferLast: true,
        },
      ],
    },
    {
      id: '2',
      title: '项目建设背景和必要性',
      writingGuide: '论证背景、政策符合性与建设必要性。',
      children: [
        {
          id: '2.1',
          title: '项目建设背景',
          writingGuide:
            '从宏观政策、区域发展、行业现状与项目起因说明建设背景，引用已确认政策名称时可带文号，禁止虚构文号。',
        },
        {
          id: '2.2',
          title: '规划政策符合性',
          writingGuide:
            '对照已确认的规划及产业政策，说明项目符合性；未确认的文件不得引用文号。',
        },
        {
          id: '2.3',
          title: '项目建设必要性',
          writingGuide:
            '从需求、短板、服务能力、社会效益等充分论证必要性；可结合行业常识与已填建设内容展开，勿因缺个别统计数就整节【待补充】。',
        },
      ],
    },
    {
      id: '3',
      title: '项目需求分析与产出方案',
      writingGuide: '需求、建设规模与产出方案。',
      children: [
        {
          id: '3.1',
          title: '需求分析',
          writingGuide:
            '结合目标市场、市场分析正文与附件充分论证需求与功能定位；禁止编造精确统计数字，缺精确数时可写趋势与定性判断。',
        },
        {
          id: '3.2',
          title: '建设内容和规模',
          writingGuide:
            '依据基础信息中的建设内容与规模展开，条理清晰列出主要建设内容。',
        },
        {
          id: '3.3',
          title: '项目产出方案',
          writingGuide:
            '说明主要产品/服务、产能或服务能力、质量标准等；依据已填产品服务与建设内容展开，缺精确产能数字时做定性说明即可。',
        },
      ],
    },
    {
      id: '4',
      title: '项目选址与要素保障',
      writingGuide: '选址、建设条件与要素保障。',
      children: [
        {
          id: '4.1',
          title: '项目选址或选线',
          writingGuide:
            '结合建设地点说明选址/选线理由及与规划关系；可写区位与走廊条件，勿因缺专项选址报告就整节【待补充】。',
        },
        {
          id: '4.2',
          title: '项目建设条件',
          writingGuide:
            '结合地点与工程类型展开自然、交通、市政与施工条件的定性分析；未知精确勘察数据处局部【待补充】。',
        },
        {
          id: '4.3',
          title: '要素保障分析',
          writingGuide:
            '结合资金来源、用地情况与建设模式分析土地、资金、能源、人才等保障；有测算结果须引用资本金/债务等金额。',
        },
      ],
    },
    {
      id: '5',
      title: '项目建设方案',
      writingGuide: '技术、设备、工程与建设管理方案。',
      children: [
        {
          id: '5.1',
          title: '技术方案',
          writingGuide:
            '依据技术方案、技术经济指标及附件充分描述技术路线与标准；材料少时按工程类型写通用可行方案原则，勿整节【待补充】。',
        },
        {
          id: '5.2',
          title: '设备方案',
          writingGuide:
            '依据设备清单正文与附件概述主要设备配置；无明细时可按工程类型写设施类别与配置原则。',
        },
        {
          id: '5.3',
          title: '工程方案',
          writingGuide:
            '概述主要工程内容、标准与实施安排；可引用已确认标准名称与标准号。',
        },
        {
          id: '5.4',
          title: '用地用海征收补偿（安置）方案',
          writingGuide:
            '若涉及征收，说明原则、组织方式与合规要求；无专项材料时写原则性方案，精确范围/补偿标准标【待补充】。',
          optional: true,
          optionalKey: 'land',
        },
        {
          id: '5.5',
          title: '数字化方案',
          writingGuide:
            '说明与本工程相关的信息化、智能化建设内容或预留原则；可写监测、信号、管养数字化等方向。',
          optional: true,
          optionalKey: 'digital',
        },
        {
          id: '5.6',
          title: '建设管理方案',
          writingGuide:
            '结合建设管理模式说明组织、进度、质量、安全与招投标管理安排。',
        },
      ],
    },
    {
      id: '6',
      title: '项目运营方案',
      writingGuide: '运营模式与组织保障。',
      children: [
        {
          id: '6.1',
          title: '运营模式选择',
          writingGuide: '说明所选运营模式及理由。',
        },
        {
          id: '6.2',
          title: '运营组织方案',
          writingGuide:
            '概述运营机构、岗位与职责分工；可按项目单位职责写组织框架，不必因缺编制人数整节【待补充】。',
        },
        {
          id: '6.3',
          title: '安全保障方案',
          writingGuide: '概述安全生产、应急与责任体系要点。',
        },
        {
          id: '6.4',
          title: '绩效管理方案',
          writingGuide:
            '提出绩效目标与监测评价思路；可结合建设目标写定性指标，缺量化 KPI 时局部【待补充】。',
        },
      ],
    },
    {
      id: '7',
      title: '项目投融资与财务方案',
      writingGuide:
        '有「财务测算结果（V2）」时必须原样引用总投资、资本金、债务、IRR/NPV 等数字并说明税前简化口径，同时写清方法与结构；无测算结果则金额标【待补充】，仍应写估算思路，禁止编造未给出的指标。',
      children: [
        {
          id: '7.1',
          title: '投资估算',
          writingGuide:
            '说明投资构成与估算方法；有测算结果则引用建设投资、建设期利息、流动资金、总投资并展开构成说明；无则金额【待补充】但方法要写完整。',
        },
        {
          id: '7.2',
          title: '盈利能力分析',
          writingGuide:
            '说明分析框架；有 V2 测算结果须引用年利润粗算、投资利润率、静态回收期、项目 IRR/NPV 并注明税前简化口径；未给出的指标才写【待补充】。',
        },
        {
          id: '7.3',
          title: '融资方案',
          writingGuide:
            '结合已选资金来源与测算中的资本金/债务金额说明融资结构与落实路径；无测算则金额【待补充】，结构叙述仍要完整。',
        },
        {
          id: '7.4',
          title: '债务清偿能力分析',
          writingGuide:
            '说明偿债分析思路与关注指标；可结合分年还本付息列做定性说明；无完整细表时未给出数值【待补充】，分析框架仍要写清。',
          optional: true,
          optionalKey: 'debt',
        },
        {
          id: '7.5',
          title: '财务可持续性分析',
          writingGuide:
            '说明可持续性分析思路与关键假设；可引用累计现金流趋势；缺完整表时未给出数值【待补充】，定性判断可展开。',
          optional: true,
          optionalKey: 'finance_sustain',
        },
      ],
    },
    {
      id: '8',
      title: '项目影响效果分析',
      writingGuide: '经济、社会、生态环境与资源能源影响。',
      children: [
        {
          id: '8.1',
          title: '经济影响分析',
          writingGuide:
            '定性分析对区域发展、产业带动与公共服务的经济影响；无定量模型时写机制与路径，勿整节仅【待补充】。',
        },
        {
          id: '8.2',
          title: '社会影响分析',
          writingGuide: '分析社会效益与可能的社会风险及应对。',
        },
        {
          id: '8.3',
          title: '生态环境影响分析',
          writingGuide:
            '概述施工与运营期主要生态环境影响及保护、减排措施；无环评批复结论时不编造审批意见，措施与原则仍要写完整。',
        },
        {
          id: '8.4',
          title: '资源和能源利用效果分析',
          writingGuide:
            '说明节约集约利用原则与本工程相关的资源能源管理要求；消耗量未知时不做假数，写原则与方向。',
        },
        {
          id: '8.5',
          title: '碳达峰碳中和分析',
          writingGuide:
            '简述减碳路径与管理措施；无核算数据时不做假排放量，写路径与管理要求。',
          optional: true,
          optionalKey: 'carbon',
        },
      ],
    },
    {
      id: '9',
      title: '项目风险管控方案',
      writingGuide: '风险识别、管控与应急。',
      children: [
        {
          id: '9.1',
          title: '风险识别与评价',
          writingGuide: '识别主要风险并做定性评价，勿虚构概率数据。',
        },
        {
          id: '9.2',
          title: '风险管控方案',
          writingGuide: '提出针对性管控措施。',
        },
        {
          id: '9.3',
          title: '风险应急预案',
          writingGuide: '概述应急组织、响应与保障要点。',
        },
      ],
    },
    {
      id: '10',
      title: '研究结论及建议',
      writingGuide: '总结研究结论与建议。',
      children: [
        {
          id: '10.1',
          title: '主要研究结论',
          writingGuide:
            '从必要性、要素保障、工程可行性、运营、财务、影响、风险等维度归纳结论；有测算则引用简化财务结论，无测算则写定性判断，勿整段【待补充】。宜最后生成。',
          deferLast: true,
        },
        {
          id: '10.2',
          title: '问题与建议',
          writingGuide: '列出需关注的问题与下一步工作建议。',
        },
      ],
    },
    {
      id: '11',
      title: '附表、附图和附件',
          writingGuide: '本期仅输出固定附表/附图/附件清单，不调用大模型。',
          noLlm: true,
          children: [
            {
              id: '11.1',
              title: '附表附图附件清单',
              writingGuide:
                '由财务测算程序渲染简化附表；附图/附件列清单并由编制单位随稿附送，避免逐条【待补充】。',
              noLlm: true,
            },
          ],
    },
  ],
};

export const OUTLINE_TEMPLATES: Record<string, OutlineTemplate> = {
  [GOV_FEASIBILITY_2023.id]: GOV_FEASIBILITY_2023,
};

export function getOutlineTemplate(
  outlineId = GOV_FEASIBILITY_2023.id,
): OutlineTemplate {
  return OUTLINE_TEMPLATES[outlineId] ?? GOV_FEASIBILITY_2023;
}

export function flattenOutlineNodes(tree: OutlineNode[]): OutlineNode[] {
  const result: OutlineNode[] = [];
  const walk = (nodes: OutlineNode[]) => {
    for (const node of nodes) {
      result.push(node);
      if (node.children?.length) {
        walk(node.children);
      }
    }
  };
  walk(tree);
  return result;
}

/** 可勾选的叶子章节（有正文要生成或程序渲染的节点） */
export function listSelectableChapters(
  template: OutlineTemplate = GOV_FEASIBILITY_2023,
): OutlineNode[] {
  return flattenOutlineNodes(template.tree).filter(
    node => !node.children || node.children.length === 0,
  );
}

export function defaultSelectedChapterIds(options: {
  involvesLandAcquisition: boolean;
  outlineId?: string;
}): string[] {
  const template = getOutlineTemplate(options.outlineId);
  return listSelectableChapters(template)
    .filter(node => {
      if (!node.optional) {
        return true;
      }
      if (node.optionalKey === 'land') {
        return options.involvesLandAcquisition;
      }
      // 其他 optional 默认关闭
      return false;
    })
    .map(node => node.id);
}

/** 所选章节是否包含需要 DeepSeek 的章 */
export function selectionNeedsLlm(
  selectedChapterIds: string[],
  outlineId?: string,
): boolean {
  const template = getOutlineTemplate(outlineId);
  const byId = new Map(
    listSelectableChapters(template).map(node => [node.id, node]),
  );
  return selectedChapterIds.some(id => {
    const node = byId.get(id);
    if (!node) {
      return false;
    }
    if (node.programmatic || node.noLlm) {
      return false;
    }
    return true;
  });
}

/** 生成顺序：普通章 → deferLast；programmatic/noLlm 也按序占位 */
export function orderChaptersForGeneration(
  selectedIds: string[],
  outlineId?: string,
): OutlineNode[] {
  const template = getOutlineTemplate(outlineId);
  const byId = new Map(
    listSelectableChapters(template).map(node => [node.id, node]),
  );
  const selected = selectedIds
    .map(id => byId.get(id))
    .filter((node): node is OutlineNode => Boolean(node));

  const normal = selected.filter(node => !node.deferLast);
  const deferred = selected.filter(node => node.deferLast);
  return [...normal, ...deferred];
}

/** 正文/导出顺序：严格按大纲树先后，不受 deferLast 影响 */
export function orderChaptersForDocument(
  selectedIds: string[],
  outlineId?: string,
): OutlineNode[] {
  const template = getOutlineTemplate(outlineId);
  const selected = new Set(selectedIds);
  return listSelectableChapters(template).filter(node => selected.has(node.id));
}

/** 按大纲正文顺序排列章节（导出 / 工作台侧栏） */
export function sortChaptersForDocument<
  T extends { chapterId: string },
>(chapters: T[], outlineId?: string): T[] {
  const selectedIds = chapters.map(item => item.chapterId);
  const order = orderChaptersForDocument(selectedIds, outlineId).map(
    node => node.id,
  );
  const rank = new Map(order.map((id, index) => [id, index]));
  return [...chapters].sort((a, b) => {
    const ra = rank.get(a.chapterId) ?? Number.MAX_SAFE_INTEGER;
    const rb = rank.get(b.chapterId) ?? Number.MAX_SAFE_INTEGER;
    return ra - rb;
  });
}
