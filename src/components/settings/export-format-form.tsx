'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlignCenter, AlignJustify, AlignLeft, Bold } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CN_FONT_SIZES,
  DEFAULT_EXPORT_FORMAT,
  FONT_OPTIONS,
  FORMAT_PRESETS,
  LINE_SPACING_OPTIONS,
  NUMBERING_STYLES,
  resolvePreset,
  type ExportFormat,
  type HeadingFormat,
  type NumberingStyle,
} from '@/lib/export/format-schema';
import { cn } from '@/lib/utils';

function errorMessage(data: unknown, fallback: string): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as { error: unknown }).error === 'string'
  ) {
    return (data as { error: string }).error;
  }
  return fallback;
}

type LevelKey = 'heading1' | 'heading2' | 'heading3' | 'heading4' | 'body';

const LEVEL_ROWS: Array<{ key: LevelKey; label: string }> = [
  { key: 'heading1', label: '一级标题格式' },
  { key: 'heading2', label: '二级标题格式' },
  { key: 'heading3', label: '三级标题格式' },
  { key: 'heading4', label: '四级标题格式' },
  { key: 'body', label: '正文格式' },
];

function LevelFormatRow(props: {
  label: string;
  value: HeadingFormat;
  onChange: (next: HeadingFormat) => void;
}) {
  const { label, value, onChange } = props;

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--app-line)] bg-white px-3 py-2.5">
      <div className="flex min-w-[46rem] items-center gap-2 whitespace-nowrap">
        <p className="w-[6.5rem] shrink-0 text-sm font-medium text-[var(--app-ink)]">
          {label}
        </p>

        <Select
          value={value.font}
          onValueChange={font =>
            onChange({ ...value, font: font as HeadingFormat['font'] })
          }
        >
          <SelectTrigger className="h-8 w-[6.25rem] shrink-0 bg-white">
            <SelectValue placeholder="字体" />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map(item => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.size}
          onValueChange={size =>
            onChange({ ...value, size: size as HeadingFormat['size'] })
          }
        >
          <SelectTrigger className="h-8 w-[5rem] shrink-0 bg-white">
            <SelectValue placeholder="字号" />
          </SelectTrigger>
          <SelectContent>
            {CN_FONT_SIZES.map(item => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex shrink-0 items-center gap-1">
          <span className="text-xs text-[var(--app-muted)]">首行缩进</span>
          <Input
            type="number"
            min={0}
            max={8}
            className="h-8 w-12 bg-white px-1.5"
            value={value.firstLineIndentChars}
            onChange={event => {
              const next = Number(event.target.value);
              onChange({
                ...value,
                firstLineIndentChars: Number.isFinite(next)
                  ? Math.max(0, Math.min(8, Math.round(next)))
                  : 0,
              });
            }}
          />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <span className="text-xs text-[var(--app-muted)]">行间距</span>
          <Select
            value={
              value.lineSpacing === 'exact' ||
              value.lineSpacing === 'exact_21' ||
              value.lineSpacing === 'exact_28'
                ? '1.5'
                : value.lineSpacing
            }
            onValueChange={lineSpacing =>
              onChange({
                ...value,
                lineSpacing: lineSpacing as HeadingFormat['lineSpacing'],
              })
            }
          >
            <SelectTrigger className="h-8 w-[7.5rem] shrink-0 bg-white">
              <SelectValue placeholder="行距" />
            </SelectTrigger>
            <SelectContent>
              {LINE_SPACING_OPTIONS.map(item => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant={value.align === 'left' ? 'default' : 'outline'}
            className="size-8"
            title="左对齐"
            onClick={() => onChange({ ...value, align: 'left' })}
          >
            <AlignLeft className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={value.align === 'center' ? 'default' : 'outline'}
            className="size-8"
            title="居中"
            onClick={() => onChange({ ...value, align: 'center' })}
          >
            <AlignCenter className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={value.align === 'both' ? 'default' : 'outline'}
            className="size-8"
            title="两端对齐"
            onClick={() => onChange({ ...value, align: 'both' })}
          >
            <AlignJustify className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={value.bold ? 'default' : 'outline'}
            className="size-8"
            title="加粗"
            onClick={() => onChange({ ...value, bold: !value.bold })}
          >
            <Bold className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export type ExportFormatFormProps = {
  /** page：设置页保存；dialog：导出前确认 */
  variant?: 'page' | 'dialog';
  confirmLabel?: string;
  onCancel?: () => void;
  /** 确定时回调（已保存到租户）；dialog 场景可在此继续导出 */
  onConfirmed?: (format: ExportFormat) => void | Promise<void>;
};

export function ExportFormatForm({
  variant = 'page',
  confirmLabel,
  onCancel,
  onConfirmed,
}: ExportFormatFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [format, setFormat] = useState<ExportFormat>(DEFAULT_EXPORT_FORMAT);
  const [savedSnapshot, setSavedSnapshot] = useState<ExportFormat>(
    DEFAULT_EXPORT_FORMAT,
  );

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/export-format');
      const payload: unknown = await response.json();
      if (!response.ok) {
        toast.error(errorMessage(payload, '加载格式失败'));
        return;
      }
      const data =
        typeof payload === 'object' &&
        payload !== null &&
        'data' in payload
          ? (payload as { data: { format?: ExportFormat } }).data
          : null;
      if (data?.format) {
        setFormat(data.format);
        setSavedSnapshot(data.format);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const applyPreset = (presetId: string) => {
    if (presetId === 'custom') {
      setFormat(prev => ({ ...prev, presetId: 'custom' }));
      return;
    }
    const preset = resolvePreset(presetId);
    if (preset) {
      setFormat(preset);
    }
  };

  const patchLevel = (key: LevelKey, next: HeadingFormat) => {
    setFormat(prev => ({
      ...prev,
      presetId: 'custom',
      [key]: next,
    }));
  };

  const handleCancel = () => {
    setFormat(savedSnapshot);
    onCancel?.();
    if (variant === 'page') {
      toast.message('已还原为上次保存的格式');
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/export-format', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(format),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        toast.error(errorMessage(payload, '保存失败'));
        return;
      }
      const data =
        typeof payload === 'object' &&
        payload !== null &&
        'data' in payload
          ? (payload as { data: { format?: ExportFormat } }).data
          : null;
      const saved = data?.format ?? format;
      setFormat(saved);
      setSavedSnapshot(saved);
      if (variant === 'page' && !onConfirmed) {
        toast.success('导出格式已保存');
      }
      await onConfirmed?.(saved);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-[var(--app-muted)]">加载格式设置…</p>
    );
  }

  return (
    <div
      className={cn(
        'space-y-5',
        variant === 'page' &&
          'rounded-xl border border-[var(--app-line)] bg-[var(--app-paper)] px-4 py-5 sm:px-6 sm:py-6',
      )}
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label>格式选择</Label>
          <Select
            value={format.presetId ?? 'custom'}
            onValueChange={applyPreset}
          >
            <SelectTrigger className="w-[16rem] bg-white">
              <SelectValue placeholder="请选择" />
            </SelectTrigger>
            <SelectContent>
              {FORMAT_PRESETS.map(item => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
              <SelectItem value="custom">自定义</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="pb-2 text-xs text-[var(--app-muted)]">
          默认：仿宋标题 · 第一章编号 · 1.5 倍行距
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--app-ink)]">编号样式</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {NUMBERING_STYLES.map(item => {
            const selected = format.numberingStyle === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  setFormat(prev => ({
                    ...prev,
                    presetId: 'custom',
                    numberingStyle: item.value as NumberingStyle,
                  }))
                }
                className={cn(
                  'relative rounded-lg border bg-white px-3 py-3 text-left transition',
                  selected
                    ? 'border-[var(--app-accent)] ring-2 ring-[var(--app-accent)]/30'
                    : 'border-[var(--app-line)] hover:border-[var(--app-accent)]/50',
                )}
              >
                {selected ? (
                  <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-[var(--app-accent)] text-[10px] text-white">
                    ✓
                  </span>
                ) : null}
                <p className="font-[family-name:var(--font-display)] text-sm text-[var(--app-ink)]">
                  {item.preview.h1}
                </p>
                <p className="mt-1 text-xs text-[var(--app-muted)]">
                  {item.preview.h2}
                </p>
                <p className="text-xs text-[var(--app-muted)]">
                  {item.preview.h3}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        {LEVEL_ROWS.map(row => (
          <LevelFormatRow
            key={row.key}
            label={row.label}
            value={format[row.key]}
            onChange={next => patchLevel(row.key, next)}
          />
        ))}
      </section>

      <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--app-line)] pt-4">
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={handleCancel}
        >
          取消
        </Button>
        {variant === 'page' ? (
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => setFormat(DEFAULT_EXPORT_FORMAT)}
          >
            恢复默认
          </Button>
        ) : null}
        <Button type="button" disabled={saving} onClick={() => void onSave()}>
          {saving
            ? variant === 'dialog'
              ? '导出中…'
              : '保存中…'
            : (confirmLabel ?? (variant === 'dialog' ? '确定并导出' : '确定'))}
        </Button>
      </div>
    </div>
  );
}
