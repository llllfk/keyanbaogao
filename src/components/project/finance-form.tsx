'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  buildInitialFinanceInput,
  calculateFinanceV2,
  type FinanceInput,
  type FinanceResult,
} from '@/lib/finance/engine';
import type { ProjectRecord } from '@/lib/project/schema';

type FinanceFormProps = {
  project: ProjectRecord;
};

function pctToRatio(pct: string): number {
  const n = Number(pct);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.min(100, Math.max(0, n)) / 100;
}

function ratioToPct(ratio: number): string {
  return String(Math.round(ratio * 10000) / 100);
}

function numField(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatWan(n: number): string {
  return `${n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })} 万元`;
}

function formatPct(n: number | null | undefined): string {
  if (n === null || n === undefined) {
    return '—';
  }
  return `${(n * 100).toFixed(2)}%`;
}

function formatYears(n: number | null | undefined): string {
  if (n === null || n === undefined) {
    return '—';
  }
  return `${n.toFixed(2)} 年`;
}

function displayVersion(version: string): string {
  if (version === 'simple-v1') {
    return 'V1';
  }
  return version;
}

export function FinanceForm({ project }: FinanceFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const initial = buildInitialFinanceInput({
    savedInput: project.finance?.input,
    constructionPeriodText: project.basicInfo.constructionPeriod,
    operationPeriodText: project.basicInfo.operationPeriod,
  });
  const [constructionInvestment, setConstructionInvestment] = useState(
    String(initial.constructionInvestment || ''),
  );
  const [equityPct, setEquityPct] = useState(ratioToPct(initial.equityRatio));
  const [loanRatePct, setLoanRatePct] = useState(
    ratioToPct(initial.loanAnnualRate),
  );
  const [constructionYears, setConstructionYears] = useState(
    String(initial.constructionYears),
  );
  const [operationYears, setOperationYears] = useState(
    String(initial.operationYears),
  );
  const [workingCapitalPct, setWorkingCapitalPct] = useState(
    ratioToPct(initial.workingCapitalRate),
  );
  const [discountRatePct, setDiscountRatePct] = useState(
    ratioToPct(initial.discountRate),
  );
  const [annualRevenue, setAnnualRevenue] = useState(
    String(initial.annualRevenue || ''),
  );
  const [annualOperatingCost, setAnnualOperatingCost] = useState(
    String(initial.annualOperatingCost || ''),
  );
  const [notes, setNotes] = useState(initial.notes);
  const [preview, setPreview] = useState<FinanceResult | null>(
    project.finance?.result &&
      Array.isArray(project.finance.result.yearlyRows) &&
      project.finance.result.yearlyRows.length > 0
      ? project.finance.result
      : null,
  );

  const input: FinanceInput = useMemo(
    () => ({
      constructionInvestment: numField(constructionInvestment),
      equityRatio: pctToRatio(equityPct),
      loanAnnualRate: pctToRatio(loanRatePct),
      constructionYears: Math.max(0.1, numField(constructionYears) || 0.1),
      workingCapitalRate: pctToRatio(workingCapitalPct),
      annualRevenue: numField(annualRevenue),
      annualOperatingCost: numField(annualOperatingCost),
      operationYears: Math.max(1, Math.round(numField(operationYears) || 1)),
      discountRate: pctToRatio(discountRatePct),
      notes: notes.trim(),
    }),
    [
      constructionInvestment,
      equityPct,
      loanRatePct,
      constructionYears,
      workingCapitalPct,
      annualRevenue,
      annualOperatingCost,
      operationYears,
      discountRatePct,
      notes,
    ],
  );

  const recalc = () => {
    if (input.constructionInvestment <= 0) {
      toast.error('请填写建设投资（万元）');
      return;
    }
    setPreview(calculateFinanceV2(input));
    toast.success('已按当前假设重新计算（V2）');
  };

  const persist = async (options: { confirm?: boolean; skip?: boolean }) => {
    const response = await fetch(`/api/projects/${project.id}?mode=finance`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input,
        confirm: options.confirm === true,
        skip: options.skip === true,
      }),
    });
    const data: unknown = await response.json();
    if (!response.ok) {
      const message =
        typeof data === 'object' &&
        data !== null &&
        'error' in data &&
        typeof (data as { error: unknown }).error === 'string'
          ? (data as { error: string }).error
          : '保存失败';
      throw new Error(message);
    }
    return data;
  };

  const saveAndNext = () => {
    if (input.constructionInvestment <= 0) {
      toast.error('请填写建设投资后再确认');
      return;
    }
    startTransition(async () => {
      try {
        const result = calculateFinanceV2(input);
        setPreview(result);
        await persist({ confirm: true });
        toast.success('测算已保存，进入分章智写');
        router.push(`/projects/${project.id}/outline`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '保存失败');
      }
    });
  };

  const skipAndNext = () => {
    startTransition(async () => {
      try {
        await persist({ skip: true });
        toast.success('已跳过测算；智写将写定性分析，不强制堆【待补充】');
        router.push(`/projects/${project.id}/outline`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '操作失败');
      }
    });
  };

  const result = preview ?? calculateFinanceV2(input);
  const yearlyRows = result.yearlyRows ?? [];

  return (
    <div className="space-y-8">
      <div className="rounded-md border border-[var(--app-line)] bg-[var(--app-tint)]/40 px-3 py-3 text-sm text-[var(--app-muted)]">
        测算版本 V2（档 B）：税前简化、建设期投资均分、运营期等额本金还贷。数字由确定性引擎计算（万元）；智写须原样引用，不得改写
        IRR/NPV。
      </div>

      <section className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--app-ink)]">
          测算假设（白格）
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="constructionInvestment">
              建设投资（万元） <span className="text-destructive">*</span>
            </Label>
            <Input
              id="constructionInvestment"
              type="number"
              min={0}
              step="0.01"
              value={constructionInvestment}
              onChange={event => setConstructionInvestment(event.target.value)}
              placeholder="如 12000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="constructionYears">建设期（年）</Label>
            <Input
              id="constructionYears"
              type="number"
              min={0.1}
              step="0.1"
              value={constructionYears}
              onChange={event => setConstructionYears(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="operationYears">运营期（年）</Label>
            <Input
              id="operationYears"
              type="number"
              min={1}
              step="1"
              value={operationYears}
              onChange={event => setOperationYears(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discountRatePct">折现率（%，用于 NPV）</Label>
            <Input
              id="discountRatePct"
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={discountRatePct}
              onChange={event => setDiscountRatePct(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="equityPct">资本金比例（%）</Label>
            <Input
              id="equityPct"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={equityPct}
              onChange={event => setEquityPct(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loanRatePct">贷款年利率（%）</Label>
            <Input
              id="loanRatePct"
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={loanRatePct}
              onChange={event => setLoanRatePct(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workingCapitalPct">流动资金占建设投资（%）</Label>
            <Input
              id="workingCapitalPct"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={workingCapitalPct}
              onChange={event => setWorkingCapitalPct(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="annualRevenue">达产年营业收入（万元）</Label>
            <Input
              id="annualRevenue"
              type="number"
              min={0}
              step="0.01"
              value={annualRevenue}
              onChange={event => setAnnualRevenue(event.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="annualOperatingCost">
              达产年经营成本（万元，粗口径，不含完整折旧）
            </Label>
            <Input
              id="annualOperatingCost"
              type="number"
              min={0}
              step="0.01"
              value={annualOperatingCost}
              onChange={event => setAnnualOperatingCost(event.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">备注</Label>
            <Textarea
              id="notes"
              value={notes}
              maxLength={2000}
              className="min-h-20"
              placeholder="可选。说明假设来源或特殊口径"
              onChange={event => setNotes(event.target.value)}
            />
          </div>
        </div>
        <Button type="button" variant="outline" onClick={recalc}>
          重新计算
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--app-ink)]">
          测算结果（灰格）
        </h2>
        <dl className="grid gap-3 rounded-md border border-[var(--app-line)] bg-[var(--app-tint)]/20 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--app-muted)]">建设投资</dt>
            <dd className="font-medium">
              {formatWan(result.constructionInvestment)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--app-muted)]">建设期利息（简化）</dt>
            <dd className="font-medium">
              {formatWan(result.interestDuringConstruction)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--app-muted)]">流动资金（简化）</dt>
            <dd className="font-medium">{formatWan(result.workingCapital)}</dd>
          </div>
          <div>
            <dt className="text-[var(--app-muted)]">总投资</dt>
            <dd className="font-medium text-[var(--app-accent)]">
              {formatWan(result.totalInvestment)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--app-muted)]">资本金</dt>
            <dd className="font-medium">{formatWan(result.equityAmount)}</dd>
          </div>
          <div>
            <dt className="text-[var(--app-muted)]">债务资金</dt>
            <dd className="font-medium">{formatWan(result.debtAmount)}</dd>
          </div>
          <div>
            <dt className="text-[var(--app-muted)]">年利润粗算</dt>
            <dd className="font-medium">
              {formatWan(result.annualProfitApprox)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--app-muted)]">投资利润率（粗）</dt>
            <dd className="font-medium">{formatPct(result.simpleRoi)}</dd>
          </div>
          <div>
            <dt className="text-[var(--app-muted)]">静态投资回收期</dt>
            <dd className="font-medium">
              {formatYears(result.staticPaybackYears)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--app-muted)]">项目投资税前 IRR</dt>
            <dd className="font-medium">{formatPct(result.projectIrr)}</dd>
          </div>
          <div>
            <dt className="text-[var(--app-muted)]">项目 NPV</dt>
            <dd className="font-medium">
              {result.projectNpv === null || result.projectNpv === undefined
                ? '—'
                : formatWan(result.projectNpv)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--app-muted)]">测算版本</dt>
            <dd className="font-medium">
              {displayVersion(result.calcVersion)}（档 B）
            </dd>
          </div>
        </dl>
        <p className="text-xs leading-relaxed text-[var(--app-muted)]">
          建设期利息 ≈ 建设投资 × 债务比例 × 年利率 × 建设期 ×
          0.5；建设投资按建设年数均分，期末投入流动资金；运营期等额本金还贷（利息/还本列供参考）。项目投资税前净现金流
          ≈ 收入 − 经营成本（末年回收流动资金），用于 IRR/NPV，避免与全额投资重复扣减债务。
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--app-ink)]">
          分年现金流简表
        </h2>
        <div className="max-h-80 overflow-auto rounded-md border border-[var(--app-line)]">
          <table className="w-full min-w-[720px] border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-[var(--app-tint)]">
              <tr className="border-b border-[var(--app-line)]">
                <th className="px-2 py-2 font-medium">年序</th>
                <th className="px-2 py-2 font-medium">阶段</th>
                <th className="px-2 py-2 font-medium text-right">资本性支出</th>
                <th className="px-2 py-2 font-medium text-right">收入</th>
                <th className="px-2 py-2 font-medium text-right">经营成本</th>
                <th className="px-2 py-2 font-medium text-right">利息</th>
                <th className="px-2 py-2 font-medium text-right">还本</th>
                <th className="px-2 py-2 font-medium text-right">净现金流</th>
                <th className="px-2 py-2 font-medium text-right">累计</th>
              </tr>
            </thead>
            <tbody>
              {yearlyRows.map(row => (
                <tr
                  key={row.yearIndex}
                  className="border-b border-[var(--app-line)]/70"
                >
                  <td className="px-2 py-1.5">{row.yearIndex}</td>
                  <td className="px-2 py-1.5">
                    {row.phase === 'construction' ? '建设' : '运营'}
                  </td>
                  <td className="px-2 py-1.5 text-right">{row.capex}</td>
                  <td className="px-2 py-1.5 text-right">{row.revenue}</td>
                  <td className="px-2 py-1.5 text-right">{row.operatingCost}</td>
                  <td className="px-2 py-1.5 text-right">{row.interest}</td>
                  <td className="px-2 py-1.5 text-right">{row.principalRepay}</td>
                  <td className="px-2 py-1.5 text-right">{row.netCashFlow}</td>
                  <td className="px-2 py-1.5 text-right">
                    {row.cumulativeCashFlow}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--app-line)] bg-[var(--app-paper)]/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-b-xl">
        <p className="text-sm text-[var(--app-muted)]">
          确认后结果将注入第 7 章智写，并自动刷新第 11 章程序附表
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={skipAndNext}
          >
            {pending ? '处理中…' : '跳过测算'}
          </Button>
          <Button type="button" disabled={pending} onClick={saveAndNext}>
            {pending ? '保存中…' : '保存测算并进入分章智写'}
          </Button>
        </div>
      </div>
    </div>
  );
}
