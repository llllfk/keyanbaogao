export const INDUSTRIES = [
  '建筑',
  '市政公用工程',
  '农业林业',
  '生态建设和环境工程',
  '电力（含火电、水电、核电、新能源）',
  '水利水电',
  '机械（含智能制造）',
  '轻工纺织',
  '石油化工医药',
  '电子信息工程',
  '公路',
  '铁路、城市轨道交通',
  '民航',
  '水运',
  '建材',
  '煤炭',
  '石油天然气',
  '冶金',
  '核工业',
  '水文地质、工程测量、岩土工程',
  '化纤、机电设备安装等综合类项目',
] as const;

export const PROJECT_NATURES = [
  { value: 'new', label: '新建' },
  { value: 'rebuild', label: '改建' },
  { value: 'expand', label: '扩建' },
  { value: 'rebuild_expand', label: '改扩建' },
] as const;

export const FUNDING_SOURCES = [
  { value: 'self', label: '项目单位自筹' },
  { value: 'bank_loan', label: '银行借款' },
  { value: 'special_bond', label: '政府专项债' },
  { value: 'central_budget', label: '中央预算内资金' },
  { value: 'fiscal', label: '财政资金' },
  { value: 'ultra_long_bond', label: '超长期国债' },
  { value: 'gov_subsidy', label: '政府补贴资金' },
  { value: 'gov_fund', label: '政府性基金' },
  { value: 'corp_bond', label: '公司债' },
  { value: 'leasing', label: '融资租赁' },
  { value: 'enterprise_bond', label: '企业债' },
  { value: 'other', label: '其他' },
] as const;

export const CONSTRUCTION_MODES = [
  { value: 'epc', label: '工程总承包' },
  { value: 'full_consulting', label: '全过程工程咨询服务' },
  { value: 'agent', label: '代建管理' },
  { value: 'other', label: '其他' },
] as const;

export const OPERATION_MODES = [
  { value: 'self', label: '自主运营管理' },
  { value: 'outsourced', label: '委托第三方运营管理' },
  { value: 'other', label: '其他' },
] as const;

export const INVESTMENT_TYPES = [
  { value: 'government', label: '政府投资' },
  { value: 'enterprise', label: '企业投资' },
] as const;

export const PROJECT_STATUSES = [
  { value: 'draft', label: '草稿' },
  { value: 'basic_filled', label: '信息已就绪' },
  { value: 'basis_confirmed', label: '依据已锁定' },
  { value: 'finance_done', label: '测算完成' },
  { value: 'generating', label: '智写中' },
  { value: 'generated', label: '初稿已成' },
  { value: 'exported', label: '已导出' },
] as const;

/** 简化财务测算已启用；向导是否展示该步取决于项目是否勾选「做财务分析」 */
export const PHASE1_WRITE_ONLY = false;

export const WIZARD_STEPS_BASE = [
  { key: 'basic', label: '信息采集', href: 'basic' },
  { key: 'basis', label: '智能依据', href: 'basis' },
  { key: 'outline', label: '分章智写', href: 'outline' },
  { key: 'report', label: '智能审改', href: 'report' },
] as const;

/** 含财务步的完整向导 */
export const WIZARD_STEPS_FULL = [
  { key: 'basic', label: '信息采集', href: 'basic' },
  { key: 'basis', label: '智能依据', href: 'basis' },
  { key: 'finance', label: '财务测算', href: 'finance' },
  { key: 'outline', label: '分章智写', href: 'outline' },
  { key: 'report', label: '智能审改', href: 'report' },
] as const;

/** @deprecated 兼容旧引用：默认不含财务步 */
export const WIZARD_STEPS = WIZARD_STEPS_BASE;

export type WizardStepKey =
  | (typeof WIZARD_STEPS_FULL)[number]['key'];

export function getWizardSteps(doFinancialAnalysis: boolean) {
  return doFinancialAnalysis ? WIZARD_STEPS_FULL : WIZARD_STEPS_BASE;
}
