/** 财务测算引擎：档 A（V1 摘要）+ 档 B（V2 分年现金流），单位统一为「万元」 */

export const FINANCE_CALC_VERSION = 'V2' as const;

/** 历史存档兼容 */
export const FINANCE_CALC_VERSIONS = ['V2', 'V1', 'simple-v1'] as const;

export type FinanceInput = {
  /** 建设投资（万元） */
  constructionInvestment: number;
  /** 资本金比例 0～1 */
  equityRatio: number;
  /** 贷款年利率 0～1 */
  loanAnnualRate: number;
  /** 建设期（年） */
  constructionYears: number;
  /** 流动资金占建设投资比例 0～1 */
  workingCapitalRate: number;
  /** 达产年营业收入（万元） */
  annualRevenue: number;
  /** 达产年经营成本（不含折旧利息的粗口径，万元） */
  annualOperatingCost: number;
  /** 运营期（年） */
  operationYears: number;
  /** 折现率 0～1（用于 NPV） */
  discountRate: number;
  /** 备注 */
  notes: string;
};

export type FinanceYearPhase = 'construction' | 'operation';

export type FinanceYearRow = {
  yearIndex: number;
  phase: FinanceYearPhase;
  capex: number;
  interest: number;
  principalRepay: number;
  revenue: number;
  operatingCost: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
};

export type FinanceResult = {
  calcVersion: (typeof FINANCE_CALC_VERSIONS)[number];
  constructionInvestment: number;
  interestDuringConstruction: number;
  workingCapital: number;
  totalInvestment: number;
  equityAmount: number;
  debtAmount: number;
  annualRevenue: number;
  annualOperatingCost: number;
  /** 粗口径年利润 ≈ 收入 − 经营成本（未扣折旧与所得税） */
  annualProfitApprox: number;
  /** 投资利润率（小数，如 0.08 = 8%） */
  simpleRoi: number | null;
  /** 静态投资回收期（年，现金流累计转正） */
  staticPaybackYears: number | null;
  /** 项目投资税前 IRR；无解则为 null */
  projectIrr: number | null;
  /** 按折现率计算的项目 NPV */
  projectNpv: number | null;
  /** 分年简表 */
  yearlyRows: FinanceYearRow[];
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function ceilYears(years: number): number {
  return Math.max(1, Math.ceil(years - 1e-9));
}

/** NPV：现金流在年末发生，第 t 年折现因子 (1+r)^t */
export function npvOfCashFlows(cashFlows: number[], rate: number): number {
  let total = 0;
  for (let t = 0; t < cashFlows.length; t += 1) {
    const cf = cashFlows[t] ?? 0;
    total += cf / (1 + rate) ** (t + 1);
  }
  return total;
}

/**
 * 二分法求 IRR；要求现金流变号。无解返回 null。
 */
export function irrOfCashFlows(cashFlows: number[]): number | null {
  if (cashFlows.length === 0) {
    return null;
  }
  let hasPos = false;
  let hasNeg = false;
  for (const cf of cashFlows) {
    if (cf > 0) hasPos = true;
    if (cf < 0) hasNeg = true;
  }
  if (!hasPos || !hasNeg) {
    return null;
  }

  let low = -0.99;
  let high = 10;
  let npvLow = npvOfCashFlows(cashFlows, low);
  let npvHigh = npvOfCashFlows(cashFlows, high);

  // 扩展上界直到变号或放弃
  for (let i = 0; i < 20 && npvLow * npvHigh > 0; i += 1) {
    high *= 1.5;
    npvHigh = npvOfCashFlows(cashFlows, high);
    if (high > 100) {
      break;
    }
  }
  if (npvLow * npvHigh > 0) {
    return null;
  }

  for (let i = 0; i < 80; i += 1) {
    const mid = (low + high) / 2;
    const npvMid = npvOfCashFlows(cashFlows, mid);
    if (Math.abs(npvMid) < 1e-7) {
      return round2(mid * 10000) / 10000;
    }
    if (npvLow * npvMid <= 0) {
      high = mid;
      npvHigh = npvMid;
    } else {
      low = mid;
      npvLow = npvMid;
    }
  }
  return round2(((low + high) / 2) * 10000) / 10000;
}

function staticPaybackFromCumulative(
  rows: FinanceYearRow[],
): number | null {
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row) continue;
    if (row.cumulativeCashFlow >= 0) {
      if (i === 0) {
        return row.netCashFlow > 0 ? round2(row.capex > 0 ? 1 : 0) : 0;
      }
      const prev = rows[i - 1];
      if (!prev || row.netCashFlow === 0) {
        return round2(row.yearIndex);
      }
      const need = -prev.cumulativeCashFlow;
      if (need <= 0) {
        return round2(prev.yearIndex);
      }
      const frac = need / row.netCashFlow;
      return round2(prev.yearIndex + Math.min(1, Math.max(0, frac)));
    }
  }
  return null;
}

/**
 * 档 B（V2）：
 * - 建设期利息 ≈ 建设投资 × 债务比例 × 年利率 × 建设期年数 × 0.5（资本化进总投资）
 * - 建设投资按建设年数均匀投入；建设期末投入流动资金
 * - 运营期等额本金还贷（利息/还本列供偿债参考）
 * - 项目投资税前净现金流 = 收入 − 经营成本（+期末回收流动资金），用于 IRR/NPV
 */
export function calculateFinanceV2(input: FinanceInput): FinanceResult {
  const constructionInvestment = Math.max(0, input.constructionInvestment);
  const equityRatio = Math.min(1, Math.max(0, input.equityRatio));
  const debtRatio = 1 - equityRatio;
  const loanAnnualRate = Math.max(0, input.loanAnnualRate);
  const constructionYearsRaw = Math.max(0.1, input.constructionYears);
  const constructionYearCount = ceilYears(constructionYearsRaw);
  const workingCapitalRate = Math.min(1, Math.max(0, input.workingCapitalRate));
  const annualRevenue = Math.max(0, input.annualRevenue);
  const annualOperatingCost = Math.max(0, input.annualOperatingCost);
  const operationYearCount = Math.max(1, Math.round(input.operationYears) || 1);
  const discountRate = Math.min(1, Math.max(0, input.discountRate));

  const interestDuringConstruction = round2(
    constructionInvestment *
      debtRatio *
      loanAnnualRate *
      constructionYearsRaw *
      0.5,
  );
  const workingCapital = round2(constructionInvestment * workingCapitalRate);
  const totalInvestment = round2(
    constructionInvestment + interestDuringConstruction + workingCapital,
  );
  const equityAmount = round2(totalInvestment * equityRatio);
  const debtAmount = round2(totalInvestment - equityAmount);
  const annualProfitApprox = round2(annualRevenue - annualOperatingCost);
  const simpleRoi =
    totalInvestment > 0 ? round2(annualProfitApprox / totalInvestment) : null;

  const capexPerBuildYear = round2(
    constructionInvestment / constructionYearCount,
  );
  // 均分后尾差归入最后一年
  const capexBuildParts: number[] = [];
  let capexAssigned = 0;
  for (let i = 0; i < constructionYearCount; i += 1) {
    if (i === constructionYearCount - 1) {
      capexBuildParts.push(round2(constructionInvestment - capexAssigned));
    } else {
      capexBuildParts.push(capexPerBuildYear);
      capexAssigned = round2(capexAssigned + capexPerBuildYear);
    }
  }

  const principalPerOpYear =
    debtAmount > 0 && operationYearCount > 0
      ? round2(debtAmount / operationYearCount)
      : 0;

  const rows: FinanceYearRow[] = [];
  let cumulative = 0;
  let remainingDebt = debtAmount;
  let yearIndex = 0;

  for (let i = 0; i < constructionYearCount; i += 1) {
    yearIndex += 1;
    let capex = capexBuildParts[i] ?? 0;
    if (i === constructionYearCount - 1) {
      capex = round2(capex + workingCapital);
    }
    // 项目投资现金流：建设期流出为资本性支出（不含融资）；建设期利息已资本化进总投资，此处不重复计入净现金流
    const net = round2(-capex);
    cumulative = round2(cumulative + net);
    rows.push({
      yearIndex,
      phase: 'construction',
      capex,
      interest: 0,
      principalRepay: 0,
      revenue: 0,
      operatingCost: 0,
      netCashFlow: net,
      cumulativeCashFlow: cumulative,
    });
  }

  for (let i = 0; i < operationYearCount; i += 1) {
    yearIndex += 1;
    const interest = round2(remainingDebt * loanAnnualRate);
    let principalRepay = 0;
    if (debtAmount > 0) {
      if (i === operationYearCount - 1) {
        principalRepay = round2(remainingDebt);
      } else {
        principalRepay = Math.min(principalPerOpYear, remainingDebt);
        principalRepay = round2(principalRepay);
      }
      remainingDebt = round2(Math.max(0, remainingDebt - principalRepay));
    }
    const wcRecovery =
      i === operationYearCount - 1 ? workingCapital : 0;
    // 项目投资税前净现金流：收入−经营成本（+期末回收流动资金）；利息/还本列单独展示供偿债参考，不计入项目 IRR
    const net = round2(annualRevenue - annualOperatingCost + wcRecovery);
    cumulative = round2(cumulative + net);
    rows.push({
      yearIndex,
      phase: 'operation',
      capex: 0,
      interest,
      principalRepay,
      revenue: annualRevenue,
      operatingCost: annualOperatingCost,
      netCashFlow: net,
      cumulativeCashFlow: cumulative,
    });
  }

  const cashFlows = rows.map(row => row.netCashFlow);
  const projectIrr = irrOfCashFlows(cashFlows);
  const projectNpv = round2(npvOfCashFlows(cashFlows, discountRate));
  const staticPaybackYears = staticPaybackFromCumulative(rows);

  return {
    calcVersion: FINANCE_CALC_VERSION,
    constructionInvestment: round2(constructionInvestment),
    interestDuringConstruction,
    workingCapital,
    totalInvestment,
    equityAmount,
    debtAmount,
    annualRevenue: round2(annualRevenue),
    annualOperatingCost: round2(annualOperatingCost),
    annualProfitApprox,
    simpleRoi,
    staticPaybackYears,
    projectIrr,
    projectNpv,
    yearlyRows: rows,
  };
}

/** @deprecated 使用 calculateFinanceV2；保留别名便于旧调用迁移 */
export function calculateSimpleFinance(input: FinanceInput): FinanceResult {
  return calculateFinanceV2(input);
}

export function defaultFinanceInput(options?: {
  constructionYears?: number;
  operationYears?: number;
}): FinanceInput {
  return {
    constructionInvestment: 0,
    equityRatio: 0.2,
    loanAnnualRate: 0.045,
    constructionYears: options?.constructionYears ?? 2,
    workingCapitalRate: 0.05,
    annualRevenue: 0,
    annualOperatingCost: 0,
    operationYears: options?.operationYears ?? 20,
    discountRate: 0.06,
    notes: '',
  };
}

/** 从「1.5年」「24个月」等文本粗解析年数 */
export function parseConstructionYears(text: string): number | null {
  const raw = text.trim();
  if (!raw) {
    return null;
  }
  const monthMatch = raw.match(/(\d+(?:\.\d+)?)\s*个?月/);
  if (monthMatch) {
    const months = Number(monthMatch[1]);
    if (Number.isFinite(months) && months > 0) {
      return Math.round((months / 12) * 100) / 100;
    }
  }
  const yearMatch = raw.match(/(\d+(?:\.\d+)?)\s*年?/);
  if (yearMatch) {
    const years = Number(yearMatch[1]);
    if (Number.isFinite(years) && years > 0) {
      return years;
    }
  }
  return null;
}

export function parseOperationYears(text: string): number | null {
  const parsed = parseConstructionYears(text);
  if (parsed === null) {
    return null;
  }
  return Math.max(1, Math.round(parsed));
}

function displayVersion(version: string): string {
  if (version === 'simple-v1' || version === 'V1') {
    return version === 'V1' ? 'V1' : 'V1';
  }
  return version;
}

export function formatFinanceForPrompt(result: FinanceResult): string {
  const pct = (n: number | null) =>
    n === null ? '【待补充】' : `${(n * 100).toFixed(2)}%`;
  const years = (n: number | null) =>
    n === null ? '【待补充】' : `${n.toFixed(2)} 年`;
  const wan = (n: number | null) =>
    n === null ? '【待补充】' : `${n} 万元`;

  const rows = result.yearlyRows ?? [];
  const head = rows.slice(0, 4);
  const tail =
    rows.length > 5 ? rows.slice(-1) : rows.length > 4 ? rows.slice(4) : [];
  const sampleRows = [...head, ...tail];
  const tableLines =
    sampleRows.length > 0
      ? [
          '分年现金流（摘录，万元；完整表见第 11 章程序表）：',
          '| 年序 | 阶段 | 资本性支出 | 收入 | 经营成本 | 利息 | 还本 | 净现金流 | 累计 |',
          '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
          ...sampleRows.map(row =>
            `| ${row.yearIndex} | ${row.phase === 'construction' ? '建设' : '运营'} | ${row.capex} | ${row.revenue} | ${row.operatingCost} | ${row.interest} | ${row.principalRepay} | ${row.netCashFlow} | ${row.cumulativeCashFlow} |`,
          ),
          rows.length > 5 ? `（共 ${rows.length} 年，中间年份已省略）` : '',
        ].filter(Boolean)
      : [];

  return [
    `测算版本：${displayVersion(result.calcVersion)}（档 B，税前简化；数字来自确定性引擎，禁止改写）`,
    `建设投资：${result.constructionInvestment} 万元`,
    `建设期利息（简化）：${result.interestDuringConstruction} 万元`,
    `流动资金（简化）：${result.workingCapital} 万元`,
    `总投资：${result.totalInvestment} 万元`,
    `资本金：${result.equityAmount} 万元`,
    `债务资金：${result.debtAmount} 万元`,
    `达产年营业收入：${result.annualRevenue} 万元`,
    `达产年经营成本（粗口径）：${result.annualOperatingCost} 万元`,
    `年利润粗算：${result.annualProfitApprox} 万元`,
    `投资利润率（粗）：${pct(result.simpleRoi)}`,
    `静态投资回收期（现金流法）：${years(result.staticPaybackYears)}`,
    `项目投资税前 IRR：${pct(result.projectIrr ?? null)}`,
    `项目 NPV：${wan(result.projectNpv ?? null)}`,
    ...tableLines,
  ].join('\n');
}

/** 第 11 章：有 V2 结果时程序生成简化表 Markdown */
export function renderFinanceAttachmentTables(result: FinanceResult): string {
  const rows = result.yearlyRows ?? [];
  const investRows = rows.filter(row => row.phase === 'construction');
  const opRows = rows.filter(row => row.phase === 'operation');

  const cashTable = [
    '| 年序 | 阶段 | 资本性支出 | 营业收入 | 经营成本 | 利息 | 还本 | 净现金流 | 累计净现金流 |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...rows.map(row => {
      const phase = row.phase === 'construction' ? '建设期' : '运营期';
      return `| ${row.yearIndex} | ${phase} | ${row.capex} | ${row.revenue} | ${row.operatingCost} | ${row.interest} | ${row.principalRepay} | ${row.netCashFlow} | ${row.cumulativeCashFlow} |`;
    }),
  ].join('\n');

  const investTable = [
    '| 年序 | 建设投资投入 | 流动资金 | 小计 |',
    '| --- | ---: | ---: | ---: |',
    ...investRows.map((row, index) => {
      const isLast = index === investRows.length - 1;
      const wc = isLast ? result.workingCapital : 0;
      const build = round2(row.capex - wc);
      return `| ${row.yearIndex} | ${build} | ${wc} | ${row.capex} |`;
    }),
  ].join('\n');

  const fundingTable = [
    '| 来源 | 金额（万元） | 占比 |',
    '| --- | ---: | ---: |',
    `| 资本金 | ${result.equityAmount} | ${result.totalInvestment > 0 ? ((result.equityAmount / result.totalInvestment) * 100).toFixed(2) : '0.00'}% |`,
    `| 债务资金 | ${result.debtAmount} | ${result.totalInvestment > 0 ? ((result.debtAmount / result.totalInvestment) * 100).toFixed(2) : '0.00'}% |`,
    `| 合计（总投资） | ${result.totalInvestment} | 100% |`,
  ].join('\n');

  const summaryTable = [
    '| 项目 | 金额（万元） |',
    '| --- | ---: |',
    `| 建设投资 | ${result.constructionInvestment} |`,
    `| 建设期利息 | ${result.interestDuringConstruction} |`,
    `| 流动资金 | ${result.workingCapital} |`,
    `| 总投资 | ${result.totalInvestment} |`,
  ].join('\n');

  const incomeCostTable = [
    '| 项目 | 达产年金额（万元） | 说明 |',
    '| --- | ---: | --- |',
    `| 营业收入 | ${result.annualRevenue} | 达产年口径 |`,
    `| 经营成本（粗） | ${result.annualOperatingCost} | 不含完整折旧税制 |`,
    `| 年利润粗算 | ${result.annualProfitApprox} | 收入−经营成本 |`,
  ].join('\n');

  const debtServiceTable = [
    '| 年序 | 期初余本（推算） | 本年利息 | 本年还本 | 还本付息合计 |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...(() => {
      let remain = result.debtAmount;
      return opRows.map(row => {
        const begin = remain;
        remain = round2(Math.max(0, remain - row.principalRepay));
        return `| ${row.yearIndex} | ${begin} | ${row.interest} | ${row.principalRepay} | ${round2(row.interest + row.principalRepay)} |`;
      });
    })(),
  ].join('\n');

  const indicatorTable = [
    '| 指标 | 数值 |',
    '| --- | --- |',
    `| 投资利润率（粗） | ${result.simpleRoi === null ? '—' : `${(result.simpleRoi * 100).toFixed(2)}%`} |`,
    `| 静态投资回收期 | ${result.staticPaybackYears === null ? '—' : `${result.staticPaybackYears.toFixed(2)} 年`} |`,
    `| 项目投资税前 IRR | ${result.projectIrr == null ? '—' : `${(result.projectIrr * 100).toFixed(2)}%`} |`,
    `| 项目 NPV | ${result.projectNpv == null ? '—' : `${result.projectNpv} 万元`} |`,
  ].join('\n');

  return [
    '### 11.1.1 附表清单',
    '以下表格由财务测算（V2，税前简化）程序生成，金额单位：万元。未展开的会计细表在正式报审阶段由编制单位按完整财评口径完善。',
    '',
    '**表 1 总投资估算要点**',
    summaryTable,
    '',
    '**表 2 分年度投资计划（简化）**',
    investTable,
    '',
    '**表 3 资金筹措（简化）**',
    fundingTable,
    '',
    '**表 4 项目投资现金流量表（税前简化）**',
    '净现金流按项目投资口径（不含还本付息）；利息/还本列为偿债参考。',
    cashTable,
    '',
    '**表 5 达产年收入与经营成本简表**',
    incomeCostTable,
    '',
    '**表 6 借款还本付息简表（等额本金）**',
    debtServiceTable,
    '',
    '**表 7 主要财务评价指标（简化）**',
    indicatorTable,
    '',
    '**其余会计细表（本档未建模，报审时完善）**',
    '8. 总成本费用估算明细表',
    '9. 税金及附加与增值税测算表',
    '10. 利润与利润分配表',
    '11. 项目资本金现金流量表',
    '12. 财务计划现金流量表',
    '13. 资产负债表',
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

function normalizeLegacyInput(
  raw: Partial<FinanceInput> & Record<string, unknown>,
): FinanceInput {
  const base = defaultFinanceInput();
  return {
    constructionInvestment:
      typeof raw.constructionInvestment === 'number'
        ? raw.constructionInvestment
        : base.constructionInvestment,
    equityRatio:
      typeof raw.equityRatio === 'number' ? raw.equityRatio : base.equityRatio,
    loanAnnualRate:
      typeof raw.loanAnnualRate === 'number'
        ? raw.loanAnnualRate
        : base.loanAnnualRate,
    constructionYears:
      typeof raw.constructionYears === 'number'
        ? raw.constructionYears
        : base.constructionYears,
    workingCapitalRate:
      typeof raw.workingCapitalRate === 'number'
        ? raw.workingCapitalRate
        : base.workingCapitalRate,
    annualRevenue:
      typeof raw.annualRevenue === 'number'
        ? raw.annualRevenue
        : base.annualRevenue,
    annualOperatingCost:
      typeof raw.annualOperatingCost === 'number'
        ? raw.annualOperatingCost
        : base.annualOperatingCost,
    operationYears:
      typeof raw.operationYears === 'number'
        ? raw.operationYears
        : base.operationYears,
    discountRate:
      typeof raw.discountRate === 'number'
        ? raw.discountRate
        : base.discountRate,
    notes: typeof raw.notes === 'string' ? raw.notes : '',
  };
}

/** 财务页预填：沿用已存 input，或按建设期/运营期文本推断 */
export function buildInitialFinanceInput(options: {
  savedInput?: Partial<FinanceInput> | null;
  constructionPeriodText?: string;
  operationPeriodText?: string;
}): FinanceInput {
  if (options.savedInput) {
    return normalizeLegacyInput(options.savedInput);
  }
  const constructionYears =
    parseConstructionYears(options.constructionPeriodText ?? '') ?? 2;
  const operationYears =
    parseOperationYears(options.operationPeriodText ?? '') ?? 20;
  return defaultFinanceInput({ constructionYears, operationYears });
}
