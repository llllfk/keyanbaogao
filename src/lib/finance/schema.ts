import { z } from 'zod';

import {
  FINANCE_CALC_VERSIONS,
  type FinanceInput,
  type FinanceResult,
} from '@/lib/finance/engine';

export const financeInputSchema = z.object({
  constructionInvestment: z.number().nonnegative('建设投资不能为负'),
  equityRatio: z
    .number()
    .min(0, '资本金比例不能小于 0')
    .max(1, '资本金比例不能大于 100%'),
  loanAnnualRate: z
    .number()
    .min(0, '利率不能为负')
    .max(1, '利率不能大于 100%'),
  constructionYears: z
    .number()
    .positive('建设期须大于 0')
    .max(30, '建设期不超过 30 年'),
  workingCapitalRate: z.number().min(0).max(1),
  annualRevenue: z.number().nonnegative('营业收入不能为负'),
  annualOperatingCost: z.number().nonnegative('经营成本不能为负'),
  operationYears: z
    .number()
    .positive('运营期须大于 0')
    .max(50, '运营期不超过 50 年')
    .default(20),
  discountRate: z
    .number()
    .min(0, '折现率不能为负')
    .max(1, '折现率不能大于 100%')
    .default(0.06),
  notes: z.string().trim().max(2000, '备注不超过 2000 字'),
});

export const financeYearRowSchema = z.object({
  yearIndex: z.number().int().positive(),
  phase: z.enum(['construction', 'operation']),
  capex: z.number(),
  interest: z.number(),
  principalRepay: z.number(),
  revenue: z.number(),
  operatingCost: z.number(),
  netCashFlow: z.number(),
  cumulativeCashFlow: z.number(),
});

export const financeResultSchema = z.object({
  calcVersion: z.enum(FINANCE_CALC_VERSIONS),
  constructionInvestment: z.number(),
  interestDuringConstruction: z.number(),
  workingCapital: z.number(),
  totalInvestment: z.number(),
  equityAmount: z.number(),
  debtAmount: z.number(),
  annualRevenue: z.number(),
  annualOperatingCost: z.number(),
  annualProfitApprox: z.number(),
  simpleRoi: z.number().nullable(),
  staticPaybackYears: z.number().nullable(),
  projectIrr: z.number().nullable().optional().default(null),
  projectNpv: z.number().nullable().optional().default(null),
  yearlyRows: z.array(financeYearRowSchema).optional().default([]),
});

export const projectFinanceSchema = z.object({
  input: financeInputSchema,
  result: financeResultSchema.nullable(),
  calculatedAt: z.string().nullable(),
  skipped: z.boolean(),
});

export type ProjectFinance = z.infer<typeof projectFinanceSchema>;

export const financeSaveSchema = z.object({
  input: financeInputSchema,
  /** 保存并标记测算完成 */
  confirm: z.boolean().optional(),
  /** 跳过测算（弱化财务章） */
  skip: z.boolean().optional(),
});

export function normalizeProjectFinance(
  input: Partial<ProjectFinance> | null | undefined,
  fallbackInput?: FinanceInput,
): ProjectFinance | null {
  if (!input && !fallbackInput) {
    return null;
  }
  const parsed = projectFinanceSchema.safeParse(
    input ?? {
      input: fallbackInput,
      result: null,
      calculatedAt: null,
      skipped: false,
    },
  );
  if (parsed.success) {
    return parsed.data;
  }
  if (fallbackInput) {
    return {
      input: fallbackInput,
      result: null,
      calculatedAt: null,
      skipped: false,
    };
  }
  return null;
}

export type { FinanceInput, FinanceResult };
