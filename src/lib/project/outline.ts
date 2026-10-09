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
  /**
   * 无用户技术方案/设备清单时，也按行业惯例自动写满
   * （配置表、参数区间、安装验收等），仍禁止编造文号与财务精确结果
   */
  autoExpand?: boolean;
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
      writingGuide:
        '按通用大纲写清项目与项目单位基本情况，为决策机构把握全貌服务；概述章宜精炼，勿把后续专章内容提前写满。',
      children: [
        {
          id: '1.1',
          title: '项目概况',
          writingGuide:
            '【极简条目，每条只写本条该写的内容，禁止跨条塞字段】用 ### 分条：' +
            '①项目名称及简称：仅写全称、简称各一句（可合并为两句内）。严禁写入项目性质、投资性质、行业、细分领域、项目单位、地点、投资额等——这些分别在后续条目或 1.2 写。' +
            '②建设目标：单独写目标，勿与任务混写。' +
            '③建设任务：单独写任务。' +
            '④建设地点：地点一句即可。' +
            '⑤建设内容和规模：概括主要建设内容与规模，勿再复述项目名称。' +
            '⑥建设工期：工期一句。' +
            '⑦投资规模和资金来源：有总投资/测算则原样引用金额与来源。' +
            '⑧建设模式：点明管理模式即可。' +
            '⑨主要技术经济指标、⑩绩效目标：有则短列，无则【待补充】。每条通常 1～3 句，禁止注水。',
        },
        {
          id: '1.2',
          title: '项目单位概况',
          writingGuide:
            '【简述】写清项目单位名称与基本信息即可；可一两段说明履职职责及与拟建项目的匹配性。单位概况细节勿在本节重复扩写成长文（深度介绍留给必要性/运营等章）。拟新组建项目法人的，简述组建方案；政府资本金注入项目可点到投资人/股东及出资人代表（未知则【待补充】）。',
        },
        {
          id: '1.3',
          title: '编制依据',
          writingGuide:
            '由系统按已确认依据列表渲染：项目建议书/规划及批复、支持性规划与产业政策、主要标准规范、专题研究成果等。',
          programmatic: 'basis',
        },
        {
          id: '1.4',
          title: '主要结论和建议',
          writingGuide:
            '简述可行性研究主要结论与建议，可列表；须与后文章节口径一致，禁止编造未给出的财务或审批结论。宜在其他章生成后撰写。',
          deferLast: true,
        },
      ],
    },
    {
      id: '2',
      title: '项目建设背景和必要性',
      writingGuide:
        '写清立项背景、前期手续进展，并从规划政策与宏观—中观—微观论证建设必要性与时机。',
      children: [
        {
          id: '2.1',
          title: '项目建设背景',
          writingGuide:
            '简述立项背景；说明用地预审、规划选址等行政审批及其他前期工作进展（可结合已填「前期工作进展」）。可点到环评、排污、文物、矿产压覆、水保、地震安评等手续办理或保障条件；未知批复结论勿编造文号。引用已确认政策时可带文号。',
        },
        {
          id: '2.2',
          title: '规划政策符合性',
          writingGuide:
            '阐述与经济社会发展规划、区域/专项规划、国土空间规划等的衔接性，以及与扩大内需、共同富裕、乡村振兴、科技创新、节能减排、碳达峰碳中和、国家安全与应急管理、基本公共服务等重大政策目标的符合性。仅引用已确认依据，未确认文件不得虚构文号。',
        },
        {
          id: '2.3',
          title: '项目建设必要性',
          writingGuide:
            '从重大战略与规划、产业政策、经济社会发展、项目单位履职尽责等层面综合论证必要性与建设时机。非经营性/公共服务类项目应侧重社会需求、服务对象与供需结构的定性分析；缺精确统计数时写趋势与判断，勿整节【待补充】。',
        },
      ],
    },
    {
      id: '3',
      title: '项目需求分析与产出方案',
      writingGuide:
        '在需求调查基础上提出功能定位、近远期目标、建设内容规模与产出（产品/服务）方案。',
      children: [
        {
          id: '3.1',
          title: '需求分析',
          writingGuide:
            '结合目标市场、市场分析与附件，分析需求现状与预期，提出功能定位、近期与远期目标、产品或服务需求总量及结构（定性为主）。禁止编造精确统计数字；重大项目可点到双循环与产业链供应链安全，不作无依据的定量推演。',
        },
        {
          id: '3.2',
          title: '建设内容和规模',
          writingGuide:
            '结合建设目标与功能定位，论证总体布局、主要建设内容及规模、建设标准。大型/分期项目应写近远期规模、分阶段目标与进度安排，并说明预留发展空间的合理性。',
        },
        {
          id: '3.3',
          title: '项目产出方案',
          writingGuide:
            '提出正常运营年份应达到的生产或服务能力及质量标准，评价建设内容、规模与产出的合理性；依据已填主要产品/服务展开，缺精确产能时定性说明。',
        },
      ],
    },
    {
      id: '4',
      title: '项目选址与要素保障',
      writingGuide:
        '坚持国土空间唯一性要求，写清选址/选线、建设条件与土地及资源环境要素保障。',
      children: [
        {
          id: '4.1',
          title: '项目选址或选线',
          writingGuide:
            '结合建设地点说明选址/选线理由；尽量点到土地权属、供地方式、土地利用、矿产压覆、耕地与永久基本农田、生态保护红线、地灾评估等（未知处局部【待补充】）。强调与国土空间规划及用途管制的一致性，可作简要比选论述。',
        },
        {
          id: '4.2',
          title: '项目建设条件',
          writingGuide:
            '分析自然环境（地形地貌、气象水文、地质地震防洪等）、交通运输、公用工程（道路水电热气消防通信）及施工、生活配套与公共服务依托条件。改扩建应分析既有设施容量并提出利用/改建方案。精确勘察数据未知处局部【待补充】。',
        },
        {
          id: '4.3',
          title: '要素保障分析',
          writingGuide:
            '土地要素：规划与用地计划、建设用地指标、节约集约用地；农转用、占补平衡、永农补划、用海用岛等按是否涉及展开。资源环境要素：水资源、能源、大气与生态承载力，取水/能耗/碳排放强度与减排约束，环境敏感区与制约因素。资金等要素结合资金来源与测算结果；有资本金/债务金额须原样引用。',
        },
      ],
    },
    {
      id: '5',
      title: '项目建设方案',
      writingGuide:
        '从工程技术方案论证可行性，覆盖技术、设备、工程、建设管理，并按需写征收补偿与数字化；注重绿色低碳、节约集约、安全韧性比选。',
      children: [
        {
          id: '5.1',
          title: '技术方案',
          writingGuide:
            '【AI自动扩写】未提供专项技术方案时，须按工程类型与建设内容自行拟定可行技术目标、技术路线、核心指标与推荐理由，禁止整节空泛或【待补充】。涉及专利或关键核心技术时分析取得方式与自主可控；材料少时按规范写原则与关键参数区间。',
          autoExpand: true,
        },
        {
          id: '5.2',
          title: '设备方案',
          writingGuide:
            '【AI自动扩写】未提供设备清单时，须按建设内容输出主要设备（含软件）类别、规格档次、数量或合理区间、来源与比选思路，并用 Markdown 表列出；说明与技术/工程方案匹配性。禁止只写“另行编制设备清单”。',
          autoExpand: true,
        },
        {
          id: '5.3',
          title: '工程方案',
          writingGuide:
            '【AI自动扩写】提出工程建设标准、总体布置、主要建（构）筑物与系统设计、外部运输、公用工程及其他配套。须考虑节约集约用地、抗震防洪消防、绿色与韧性工程等。房屋建筑类略写建筑及水暖电要点；分期建设写分期方案。禁止只写空泛“编制原则”。',
          autoExpand: true,
        },
        {
          id: '5.4',
          title: '用地用海征收补偿（安置）方案',
          writingGuide:
            '涉及土地征收或用海海域征收时，按法规写征收范围、土地现状、征收目的、补偿方式与标准、安置对象与方式、社会保障及费用等；用海一般侧重补偿与利益相关者协调。无专项材料时写原则性方案，精确范围/标准标【待补充】。',
          optional: true,
          optionalKey: 'land',
        },
        {
          id: '5.5',
          title: '数字化方案',
          writingGuide:
            '具备条件时提出数字化应用方案：技术/设备/工程、建设管理与运维、网络与数据安全，以及设计—施工—运维全过程数字化交付思路；可写监测、信号、管养信息化等方向。',
          optional: true,
          optionalKey: 'digital',
        },
        {
          id: '5.6',
          title: '建设管理方案',
          writingGuide:
            '提出建设组织模式与机构设置，质量与安全管理目标及验收标准，新材料新技术措施，工期与主要节点，招标范围/组织形式/方式；明确拟采用的建设管理模式（代建、全过程咨询、EPC 等，若选「其他」须写清具体模式）。可按需点到以工代赈任务。',
        },
      ],
    },
    {
      id: '6',
      title: '项目运营方案',
      writingGuide:
        '改变重建设轻运营：写清运营模式、组织、安全保障与全生命周期绩效管理。',
      children: [
        {
          id: '6.1',
          title: '运营模式选择',
          writingGuide:
            '明确自主运营或委托第三方运营并说明主要理由；委托第三方须提出对运营管理能力的要求。政府投资项目可评价市场化运营可行性与利益相关方可接受性。若选「其他」须写清具体模式。',
        },
        {
          id: '6.2',
          title: '运营组织方案',
          writingGuide:
            '提出组织机构设置、人力资源配置、培训需求与计划，以及合规管理、治理优化与信息披露等措施；可按项目单位职责写框架，缺编制人数不必整节【待补充】。',
        },
        {
          id: '6.3',
          title: '安全保障方案',
          writingGuide:
            '分析运营危险因素与危害程度，明确安全生产责任制与安全管理体系，提出劳动安全卫生措施及数据/网络/供应链安全责任或措施，并制定安全应急管理预案要点。',
        },
        {
          id: '6.4',
          title: '绩效管理方案',
          writingGuide:
            '制定全生命周期关键绩效指标与管理机制，覆盖投入产出效率、直接效果、外部影响与可持续性；大型/分期项目可按子项分列绩效目标。缺量化 KPI 时写定性指标与监测思路。',
        },
      ],
    },
    {
      id: '7',
      title: '项目投融资与财务方案',
      writingGuide:
        '在产出、建设与运营方案基础上研究投资与融资，评价盈利、偿债与财务可持续。有「财务测算结果（V2）」须原样引用总投资、资本金、债务、IRR/NPV 等并注明税前简化口径；无测算则金额【待补充】，仍写方法与结构，禁止编造未给出指标。投资估算精度目标按大纲要求趋向 ±10%（本期简化测算需声明口径）。',
      children: [
        {
          id: '7.1',
          title: '投资估算',
          writingGuide:
            '估算建设投资、建设期融资费用（利息）与流动资金构成的项目总投资；说明编制依据与范围，给出建设期分年投资计划思路。有测算则引用建设投资、建设期利息、流动资金、总投资并展开；无则金额【待补充】但方法写完整。应考虑环保、社会风险防控、节能减碳、安全卫生等费用安排的原则。',
        },
        {
          id: '7.2',
          title: '盈利能力分析',
          writingGuide:
            '按项目性质选择评价方法；估算收入、补贴与成本费用框架。政府资本金注入项目计算 FIRR、FNPV、回收期等（有 V2 则引用年利润粗算、投资利润率、静态回收期、项目 IRR/NPV 并注明税前简化）；收入不足覆盖成本时提出政府支持/缺口补助思路。非经营性项目侧重全生命周期资金平衡与开源节流，可不做盈利能力指标堆砌。',
        },
        {
          id: '7.3',
          title: '融资方案',
          writingGuide:
            '提出权益与债务融资结构、资金成本与闭环管理；说明申请财政资金的必要性与方式。结合已选资金来源及测算中的资本金/债务金额写落实路径；可点到专项债、政策性金融、REITs 盘活等适用性（无依据不编造成交条件）。',
        },
        {
          id: '7.4',
          title: '债务清偿能力分析',
          writingGuide:
            '使用债务融资时，明确还本付息依据与资金来源，分析利息备付率、偿债备付率等思路；可结合分年还本付息列做定性说明。评价是否增加财政支出负担、引发隐性债务风险。无完整细表时数值【待补充】，框架仍要写清。',
          optional: true,
          optionalKey: 'debt',
        },
        {
          id: '7.5',
          title: '财务可持续性分析',
          writingGuide:
            '政府资本金注入项目应考察各年净现金流与累计盈余，判断能否维持正常运营；经营净现金流不足时提出接续方案与财政补贴思路。可引用累计现金流趋势；缺完整表时数值【待补充】，定性判断可展开。',
          optional: true,
          optionalKey: 'finance_sustain',
        },
      ],
    },
    {
      id: '8',
      title: '项目影响效果分析',
      writingGuide:
        '重视经济社会与资源环境外部影响，并与节能、环评等专项结果相衔接；按需开展安全影响论述。',
      children: [
        {
          id: '8.1',
          title: '经济影响分析',
          writingGuide:
            '对有明显经济外部效应的项目，从费用效益/效果角度评价经济合理性，并可点到对宏观、产业、区域经济的影响；无定量模型时写机制与路径，勿整节仅【待补充】。',
        },
        {
          id: '8.2',
          title: '社会影响分析',
          writingGuide:
            '识别主要社会影响因素与利益相关者诉求及支持程度；评价就业带动、技能提升、社区与社会发展等责任，提出减缓负面社会影响的措施。可结合以工代赈等安排。',
        },
        {
          id: '8.3',
          title: '生态环境影响分析',
          writingGuide:
            '分析环境与生态现状，评价污染物排放、地灾防治、防洪、水土流失、土地复垦、生态保护、生物多样性与环境敏感区等影响，提出减缓、修复、补偿与减排措施。无环评批复时不编造审批意见，措施与原则仍写完整。',
        },
        {
          id: '8.4',
          title: '资源和能源利用效果分析',
          writingGuide:
            '分析矿产、森林、水（含非常规水）、能源、再生资源与废弃物资源化及设备回收利用；提出节约与供应链安全、节能措施，评价能效及对当地能耗调控的影响。消耗量未知不做假数。',
        },
        {
          id: '8.5',
          title: '碳达峰碳中和分析',
          writingGuide:
            '高耗能高排放项目应预测核算年度碳排放总量与强度，提出控碳路径与方式，分析对当地双碳目标的影响。无核算数据时不做假排放量，写路径与管理要求。',
          optional: true,
          optionalKey: 'carbon',
        },
      ],
    },
    {
      id: '9',
      title: '项目风险管控方案',
      writingGuide:
        '识别全生命周期风险并评价可能性与危害程度，提出管控措施与应急预案，重大项目关注社会稳定与邻避。',
      children: [
        {
          id: '9.1',
          title: '风险识别与评价',
          writingGuide:
            '识别需求、要素保障、技术、供应链、融资、建设运营、财务、生态环境、经济社会、网络与数据安全等风险；定性评价可能性、损失程度与承担主体韧性。勿虚构概率数据。重大项目可简述稳评思路与风险点（无专项材料不编造等级结论）。',
        },
        {
          id: '9.2',
          title: '风险管控方案',
          writingGuide:
            '针对主要风险提出防范化解措施；可能引发邻避的提出综合管控，使稳风险处于低风险可控。论证采取措施后风险可接受。',
        },
        {
          id: '9.3',
          title: '风险应急预案',
          writingGuide:
            '制定重大风险应急预案要点，明确应急处置与演练要求。',
        },
      ],
    },
    {
      id: '10',
      title: '研究结论及建议',
      writingGuide:
        '从必要性、要素保障、工程可行、运营有效、财务合理、影响可持续、风险可控等维度给出是否可行的结论，并列出问题与建议。',
      children: [
        {
          id: '10.1',
          title: '主要研究结论',
          writingGuide:
            '分维度简述结论并评价经济、社会、环境效果与风险，提出项目是否可行。有测算则引用简化财务结论，无测算则定性判断，勿整段【待补充】。宜最后生成。',
          deferLast: true,
        },
        {
          id: '10.2',
          title: '问题与建议',
          writingGuide:
            '针对需重点关注和进一步研究解决的问题提出建议（手续、专项、资金、运维等）。',
        },
      ],
    },
    {
      id: '11',
      title: '附表、附图和附件',
      writingGuide:
        '按项目实际与规范附具必要的附表、附图和附件；本期程序生成简化财务表并列出附图附件清单。',
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
