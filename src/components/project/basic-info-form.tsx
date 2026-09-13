'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FieldAttachments } from '@/components/project/field-attachments';
import {
  CONSTRUCTION_MODES,
  FUNDING_SOURCES,
  INDUSTRIES,
  INVESTMENT_TYPES,
  OPERATION_MODES,
  PROJECT_NATURES,
} from '@/lib/project/constants';
import {
  basicInfoFormSchema,
  type BasicInfoInput,
  type ProjectAttachment,
  type ProjectRecord,
} from '@/lib/project/schema';
import { cn } from '@/lib/utils';
import { ChevronsUpDown } from 'lucide-react';

type BasicInfoFormProps = {
  project: ProjectRecord;
};

type BasicInfoFormValues = Omit<BasicInfoInput, 'attachments'>;

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5 border-t border-[var(--app-line)] pt-8 first:border-t-0 first:pt-0">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--app-ink)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-[var(--app-muted)]">{description}</p>
        ) : null}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  return (
    <span className="text-xs text-[var(--app-muted)]">
      {value.length}/{max}
    </span>
  );
}

export function BasicInfoForm({ project }: BasicInfoFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savingDraft, setSavingDraft] = useState(false);
  const [attachments, setAttachments] = useState<ProjectAttachment[]>(
    project.basicInfo.attachments ?? [],
  );
  /** 与 Radio 强绑定，避免 RHF/FormControl 未写入 boolean */
  const [doFinancialAnalysis, setDoFinancialAnalysis] = useState(
    project.basicInfo.doFinancialAnalysis === true,
  );
  const [flagSaving, setFlagSaving] = useState(false);

  const form = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoFormSchema),
    defaultValues: {
      ...project.basicInfo,
      doFinancialAnalysis: project.basicInfo.doFinancialAnalysis === true,
    },
    mode: 'onBlur',
  });

  const persistFinanceFlag = async (enabled: boolean) => {
    setFlagSaving(true);
    try {
      const response = await fetch(
        `/api/projects/${project.id}?mode=financeFlag`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doFinancialAnalysis: enabled }),
        },
      );
      const data: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof data === 'object' &&
          data !== null &&
          'error' in data &&
          typeof (data as { error: unknown }).error === 'string'
            ? (data as { error: string }).error
            : '财务开关保存失败';
        throw new Error(message);
      }
      const saved =
        typeof data === 'object' &&
        data !== null &&
        'data' in data &&
        (
          data as {
            data: { doFinancialAnalysis?: boolean };
          }
        ).data?.doFinancialAnalysis === true;
      if (enabled && !saved) {
        throw new Error('财务开关写入后仍为关闭，请重试');
      }
      toast.success(enabled ? '已开启财务测算（已即时保存）' : '已关闭财务测算');
      router.refresh();
    } catch (error) {
      setDoFinancialAnalysis(!enabled);
      form.setValue('doFinancialAnalysis', !enabled, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.error(error instanceof Error ? error.message : '财务开关保存失败');
    } finally {
      setFlagSaving(false);
    }
  };

  const onSubmit = (values: BasicInfoFormValues) => {
    startTransition(async () => {
      const payload: BasicInfoInput = {
        ...values,
        doFinancialAnalysis,
        attachments,
      };
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        toast.error(message);
        return;
      }
      const savedFlag =
        typeof data === 'object' &&
        data !== null &&
        'data' in data &&
        typeof (data as { data: unknown }).data === 'object' &&
        (
          data as {
            data: {
              project?: { basicInfo?: { doFinancialAnalysis?: boolean } };
            };
          }
        ).data?.project?.basicInfo?.doFinancialAnalysis === true;
      if (doFinancialAnalysis && !savedFlag) {
        toast.error('财务测算开关保存失败，请重试');
        return;
      }
      toast.success(
        savedFlag
          ? '已保存：已启用财务测算'
          : '基础信息已保存（未启用财务测算）',
      );
      window.location.assign(`/projects/${project.id}/basis`);
    });
  };

  const saveDraft = async () => {
    setSavingDraft(true);
    try {
      const values = form.getValues();
      const response = await fetch(`/api/projects/${project.id}?mode=draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          doFinancialAnalysis,
          attachments,
        }),
      });
      if (!response.ok) {
        const data: unknown = await response.json();
        const message =
          typeof data === 'object' &&
          data !== null &&
          'error' in data &&
          typeof (data as { error: unknown }).error === 'string'
            ? (data as { error: string }).error
            : '草稿保存失败';
        toast.error(message);
        return;
      }
      toast.success('草稿已保存');
      router.refresh();
    } finally {
      setSavingDraft(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        <Section
          title="1. 基本信息"
          description="结构化事实将注入智写上下文，并驱动智能依据召回。若启用财务分析，将进入简化测算页。"
        >
          <div className="space-y-3">
            <Label>
              投资及财务分析 <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              className="flex flex-wrap gap-3"
              value={doFinancialAnalysis ? 'yes' : 'no'}
              onValueChange={value => {
                const enabled = value === 'yes';
                setDoFinancialAnalysis(enabled);
                form.setValue('doFinancialAnalysis', enabled, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
                void persistFinanceFlag(enabled);
              }}
              disabled={flagSaving || pending}
            >
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--app-line)] bg-white px-3 py-2 text-sm has-[[data-state=checked]]:border-[var(--app-accent)] has-[[data-state=checked]]:bg-[var(--app-tint)]">
                <RadioGroupItem value="yes" />
                做简化财务测算
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--app-line)] bg-white px-3 py-2 text-sm has-[[data-state=checked]]:border-[var(--app-accent)] has-[[data-state=checked]]:bg-[var(--app-tint)]">
                <RadioGroupItem value="no" />
                不做财务分析
              </label>
            </RadioGroup>
            <p className="text-xs text-[var(--app-muted)]">
              当前选择：
              <span className="font-medium text-[var(--app-ink)]">
                {doFinancialAnalysis ? '做简化财务测算' : '不做财务分析'}
              </span>
              {flagSaving ? '（保存中…）' : '。切换后会立刻保存到服务器。'}
            </p>
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>
                    项目名称 <span className="text-destructive">*</span>
                  </FormLabel>
                  <CharCount value={field.value} max={100} />
                </div>
                <FormControl>
                  <Input
                    placeholder="请输入完整的项目名称"
                    maxLength={100}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="investmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  投资性质 <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    className="flex flex-wrap gap-3"
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    {INVESTMENT_TYPES.map(item => (
                      <label
                        key={item.value}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--app-line)] bg-white px-3 py-2 text-sm has-[[data-state=checked]]:border-[var(--app-accent)] has-[[data-state=checked]]:bg-[var(--app-tint)]"
                      >
                        <RadioGroupItem value={item.value} />
                        {item.label}
                      </label>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  项目行业 <span className="text-destructive">*</span>
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full max-w-xl">
                      <SelectValue placeholder="请选择项目行业" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-72">
                    {INDUSTRIES.map(industry => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subSector"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>
                    细分领域 <span className="text-destructive">*</span>
                  </FormLabel>
                  <CharCount value={field.value} max={50} />
                </div>
                <FormControl>
                  <Input
                    placeholder="如：住宅、公建、学校、医院、产业园、冷链物流等"
                    maxLength={50}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  项目性质 <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    className="flex flex-wrap gap-3"
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    {PROJECT_NATURES.map(item => (
                      <label
                        key={item.value}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--app-line)] bg-white px-3 py-2 text-sm has-[[data-state=checked]]:border-[var(--app-accent)] has-[[data-state=checked]]:bg-[var(--app-tint)]"
                      >
                        <RadioGroupItem value={item.value} />
                        {item.label}
                      </label>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unitName"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>
                    项目单位名称 <span className="text-destructive">*</span>
                  </FormLabel>
                  <CharCount value={field.value} max={100} />
                </div>
                <FormControl>
                  <Input
                    placeholder="请输入完整的项目单位名称"
                    maxLength={100}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unitOverview"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>项目单位概况</FormLabel>
                  <CharCount value={field.value} max={2000} />
                </div>
                <FormControl>
                  <Textarea
                    placeholder="请输入项目单位信息"
                    maxLength={2000}
                    className="min-h-28"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="locationRegion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    项目地点（省市区）{' '}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="如：河南省郑州市金水区" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="locationDetail"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>
                      详细建设地点 <span className="text-destructive">*</span>
                    </FormLabel>
                    <CharCount value={field.value} max={100} />
                  </div>
                  <FormControl>
                    <Input
                      placeholder="请输入详细建设地点"
                      maxLength={100}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="constructionPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    项目建设期 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="如：1年；1.5年；24个月"
                      maxLength={100}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="operationPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>运营期</FormLabel>
                  <FormControl>
                    <Input placeholder="默认 20 年" maxLength={100} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Section>

        <Section
          title="2. 市场需求与产出规模"
          description="建设内容将注入第一章「建设内容与规模」等小节的智写上下文。"
        >
          <FormField
            control={form.control}
            name="constructionContentScale"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>
                    建设内容和规模 <span className="text-destructive">*</span>
                  </FormLabel>
                  <CharCount value={field.value} max={3000} />
                </div>
                <FormControl>
                  <Textarea
                    placeholder="请详细填写项目建设内容和规模"
                    maxLength={3000}
                    className="min-h-36"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mainProductsServices"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>
                    主要产品/服务 <span className="text-destructive">*</span>
                  </FormLabel>
                  <CharCount value={field.value} max={3000} />
                </div>
                <FormControl>
                  <Textarea
                    placeholder="请填写主要产品/服务"
                    maxLength={3000}
                    className="min-h-28"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="targetMarket"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>
                    目标市场 <span className="text-destructive">*</span>
                  </FormLabel>
                  <CharCount value={field.value} max={100} />
                </div>
                <FormControl>
                  <Input
                    placeholder="请填写目标市场"
                    maxLength={100}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="marketAnalysis"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>市场数据/市场分析报告</FormLabel>
                  <CharCount value={field.value} max={3000} />
                </div>
                <FormControl>
                  <Textarea
                    placeholder="选填。可粘贴市场数据或分析摘要；也可上传 Word/PDF 原文"
                    maxLength={3000}
                    className="min-h-28"
                    {...field}
                  />
                </FormControl>
                <FieldAttachments
                  projectId={project.id}
                  field="marketAnalysis"
                  attachments={attachments}
                  onChange={setAttachments}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>

        <Section
          title="3. 项目前期准备"
          description="征地选项将决定大纲中「用地征收补偿」等章节是否纳入智写范围。"
        >
          <FormField
            control={form.control}
            name="prepProgress"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>前期工作进展</FormLabel>
                  <CharCount value={field.value} max={2000} />
                </div>
                <FormControl>
                  <Textarea
                    placeholder="选填。如立项、可研委托、用地预审、规划选址等进展"
                    maxLength={2000}
                    className="min-h-28"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="involvesLandAcquisition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  是否涉及土地征收 <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    className="flex flex-wrap gap-3"
                    value={field.value ? 'yes' : 'no'}
                    onValueChange={value => field.onChange(value === 'yes')}
                  >
                    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--app-line)] bg-white px-3 py-2 text-sm has-[[data-state=checked]]:border-[var(--app-accent)] has-[[data-state=checked]]:bg-[var(--app-tint)]">
                      <RadioGroupItem value="yes" />
                      是
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--app-line)] bg-white px-3 py-2 text-sm has-[[data-state=checked]]:border-[var(--app-accent)] has-[[data-state=checked]]:bg-[var(--app-tint)]">
                      <RadioGroupItem value="no" />
                      否
                    </label>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>

        <Section
          title="4. 工程技术方案"
          description="均为选填。有材料可粘贴；缺失处由智写标注【待补充】，不编造事实。"
        >
          {(
            [
              {
                name: 'techIndicators' as const,
                label: '技术经济指标',
                placeholder: '选填。主要技术经济指标摘要',
              },
              {
                name: 'techScheme' as const,
                label: '技术方案',
                placeholder: '选填。工艺/工程技术方案要点',
              },
              {
                name: 'equipmentList' as const,
                label: '设备清单',
                placeholder: '选填。主要设备名称、规格与数量',
              },
              {
                name: 'designText' as const,
                label: '设计方案文本',
                placeholder: '选填。设计方案说明摘要',
              },
            ] as const
          ).map(item => (
            <FormField
              key={item.name}
              control={form.control}
              name={item.name}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>{item.label}</FormLabel>
                    <CharCount value={field.value} max={3000} />
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder={item.placeholder}
                      maxLength={3000}
                      className="min-h-28"
                      {...field}
                    />
                  </FormControl>
                  <FieldAttachments
                    projectId={project.id}
                    field={item.name}
                    attachments={attachments}
                    onChange={setAttachments}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </Section>

        <Section title="5. 投资与运营">
          <FormField
            control={form.control}
            name="fundingSources"
            render={({ field }) => {
              const selectedLabels = FUNDING_SOURCES.filter(item =>
                field.value.includes(item.value),
              ).map(item => item.label);
              const summary =
                selectedLabels.length === 0
                  ? '请选择资金来源（可多选）'
                  : selectedLabels.length <= 2
                    ? selectedLabels.join('、')
                    : `已选 ${selectedLabels.length} 项：${selectedLabels.slice(0, 2).join('、')}…`;

              return (
                <FormItem>
                  <FormLabel>
                    项目资金来源 <span className="text-destructive">*</span>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'h-auto min-h-9 w-full max-w-xl justify-between px-3 py-2 font-normal',
                            selectedLabels.length === 0 &&
                              'text-muted-foreground',
                          )}
                        >
                          <span className="line-clamp-2 text-left">
                            {summary}
                          </span>
                          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-2"
                      align="start"
                    >
                      <div className="max-h-64 space-y-1 overflow-y-auto">
                        {FUNDING_SOURCES.map(item => {
                          const checked = field.value.includes(item.value);
                          return (
                            <label
                              key={item.value}
                              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-[var(--app-tint)]"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={value => {
                                  if (value === true) {
                                    field.onChange([
                                      ...field.value,
                                      item.value,
                                    ]);
                                  } else {
                                    field.onChange(
                                      field.value.filter(
                                        source => source !== item.value,
                                      ),
                                    );
                                  }
                                }}
                              />
                              <span>{item.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="constructionManagementMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  建设管理模式 <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    className="flex flex-wrap gap-3"
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    {CONSTRUCTION_MODES.map(item => (
                      <label
                        key={item.value}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--app-line)] bg-white px-3 py-2 text-sm has-[[data-state=checked]]:border-[var(--app-accent)] has-[[data-state=checked]]:bg-[var(--app-tint)]"
                      >
                        <RadioGroupItem value={item.value} />
                        {item.label}
                      </label>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="operationMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  项目运营模式 <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    className="flex flex-wrap gap-3"
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    {OPERATION_MODES.map(item => (
                      <label
                        key={item.value}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--app-line)] bg-white px-3 py-2 text-sm has-[[data-state=checked]]:border-[var(--app-accent)] has-[[data-state=checked]]:bg-[var(--app-tint)]"
                      >
                        <RadioGroupItem value={item.value} />
                        {item.label}
                      </label>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>

        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-[var(--app-line)] bg-[var(--app-paper)]/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-b-xl">
          <Button
            type="button"
            variant="outline"
            disabled={savingDraft || pending}
            onClick={() => {
              void saveDraft();
            }}
          >
            {savingDraft ? '保存中…' : '保存草稿'}
          </Button>
          <Button type="submit" disabled={pending || savingDraft}>
            {pending ? '提交中…' : '保存并进入智能依据'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
