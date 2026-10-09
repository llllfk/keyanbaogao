import { z } from 'zod';

/** Word 导出：编号样式（对标小泓星「设置格式」） */
export const NUMBERING_STYLES = [
  {
    value: 'chapter_arabic',
    label: '第1章',
    preview: { h1: '第 1 章', h2: '1.1', h3: '1.1.1' },
  },
  {
    value: 'chapter_cn',
    label: '第一章',
    preview: { h1: '第一章', h2: '1.1', h3: '1.1.1' },
  },
  {
    value: 'list_cn',
    label: '一、',
    preview: { h1: '一、', h2: '1.1', h3: '1.1.1' },
  },
  {
    value: 'list_num',
    label: '1、',
    preview: { h1: '1、', h2: '1.1', h3: '1.1.1' },
  },
] as const;

export type NumberingStyle =
  (typeof NUMBERING_STYLES)[number]['value'];

export const FONT_OPTIONS = [
  { value: '仿宋', label: '仿宋' },
  { value: '宋体', label: '宋体' },
  { value: '黑体', label: '黑体' },
  { value: '楷体', label: '楷体' },
  { value: '微软雅黑', label: '微软雅黑' },
] as const;

/** 中文字号 → 磅值 */
export const CN_FONT_SIZES = [
  { value: '小二', label: '小二', pt: 18 },
  { value: '三号', label: '三号', pt: 16 },
  { value: '小三', label: '小三', pt: 15 },
  { value: '四号', label: '四号', pt: 14 },
  { value: '小四', label: '小四', pt: 12 },
  { value: '五号', label: '五号', pt: 10.5 },
] as const;

export const LINE_SPACING_OPTIONS = [
  { value: 'single', label: '单倍行距', multiple: 1 },
  { value: '1.5', label: '1.5倍行距', multiple: 1.5 },
  { value: 'double', label: '2倍行距', multiple: 2 },
] as const;

export const ALIGN_OPTIONS = [
  { value: 'left', label: '左对齐' },
  { value: 'center', label: '居中' },
  { value: 'both', label: '两端对齐' },
] as const;

const fontSchema = z.enum(
  FONT_OPTIONS.map(item => item.value) as [
    (typeof FONT_OPTIONS)[number]['value'],
    ...(typeof FONT_OPTIONS)[number]['value'][],
  ],
);
const sizeSchema = z.enum(
  CN_FONT_SIZES.map(item => item.value) as [
    (typeof CN_FONT_SIZES)[number]['value'],
    ...(typeof CN_FONT_SIZES)[number]['value'][],
  ],
);
/** 兼容旧数据 exact_21 / exact_28 */
const lineSchema = z.enum([
  'single',
  '1.5',
  'double',
  'exact',
  'exact_21',
  'exact_28',
]);
const alignSchema = z.enum(
  ALIGN_OPTIONS.map(item => item.value) as [
    (typeof ALIGN_OPTIONS)[number]['value'],
    ...(typeof ALIGN_OPTIONS)[number]['value'][],
  ],
);
const numberingSchema = z.enum(
  NUMBERING_STYLES.map(item => item.value) as [
    NumberingStyle,
    ...NumberingStyle[],
  ],
);

export const headingFormatSchema = z.object({
  font: fontSchema,
  size: sizeSchema,
  firstLineIndentChars: z.number().int().min(0).max(8),
  lineSpacing: lineSchema,
  /** 固定行距磅值（选「固定值」或编辑数字框时使用） */
  lineSpacingPt: z.number().min(8).max(72).default(21),
  bold: z.boolean(),
  align: alignSchema,
});

export const bodyFormatSchema = headingFormatSchema;

export const exportFormatSchema = z.object({
  presetId: z.string().max(64).optional(),
  numberingStyle: numberingSchema,
  heading1: headingFormatSchema,
  heading2: headingFormatSchema,
  heading3: headingFormatSchema,
  heading4: headingFormatSchema,
  body: bodyFormatSchema,
});

export type HeadingFormat = z.infer<typeof headingFormatSchema>;
export type BodyFormat = z.infer<typeof bodyFormatSchema>;
export type ExportFormat = z.infer<typeof exportFormatSchema>;

const fangSongHeading = (
  size: HeadingFormat['size'],
): HeadingFormat => ({
  font: '仿宋',
  size,
  firstLineIndentChars: 2,
  lineSpacing: '1.5',
  lineSpacingPt: 21,
  bold: true,
  align: 'left',
});

/** 默认：对标客户截图（编号「第一章」+ 仿宋标题居中） */
export const DEFAULT_EXPORT_FORMAT: ExportFormat = {
  presetId: 'customer_fangsong',
  numberingStyle: 'chapter_cn',
  heading1: fangSongHeading('小二'),
  heading2: fangSongHeading('三号'),
  heading3: fangSongHeading('四号'),
  heading4: fangSongHeading('四号'),
  body: {
    font: '仿宋',
    size: '小四',
    firstLineIndentChars: 2,
    lineSpacing: '1.5',
    lineSpacingPt: 21,
    bold: false,
    align: 'both',
  },
};

export const FORMAT_PRESETS: Array<{
  id: string;
  name: string;
  format: ExportFormat;
}> = [
  {
    id: 'customer_fangsong',
    name: '客户样板（仿宋标题）',
    format: DEFAULT_EXPORT_FORMAT,
  },
  {
    id: 'classic_hei',
    name: '经典黑体标题',
    format: {
      presetId: 'classic_hei',
      numberingStyle: 'chapter_cn',
      heading1: {
        font: '黑体',
        size: '小二',
        firstLineIndentChars: 0,
        lineSpacing: '1.5',
        lineSpacingPt: 21,
        bold: true,
        align: 'left',
      },
      heading2: {
        font: '黑体',
        size: '三号',
        firstLineIndentChars: 0,
        lineSpacing: '1.5',
        lineSpacingPt: 21,
        bold: true,
        align: 'left',
      },
      heading3: {
        font: '黑体',
        size: '四号',
        firstLineIndentChars: 0,
        lineSpacing: '1.5',
        lineSpacingPt: 21,
        bold: true,
        align: 'left',
      },
      heading4: {
        font: '黑体',
        size: '四号',
        firstLineIndentChars: 0,
        lineSpacing: '1.5',
        lineSpacingPt: 21,
        bold: true,
        align: 'left',
      },
      body: {
        font: '宋体',
        size: '小四',
        firstLineIndentChars: 2,
        lineSpacing: '1.5',
        lineSpacingPt: 21,
        bold: false,
        align: 'both',
      },
    },
  },
];

export function cnSizeToHalfPoints(size: HeadingFormat['size']): number {
  const found = CN_FONT_SIZES.find(item => item.value === size);
  return Math.round((found?.pt ?? 12) * 2);
}

export function cnSizeToPt(size: HeadingFormat['size']): number {
  const found = CN_FONT_SIZES.find(item => item.value === size);
  return found?.pt ?? 12;
}

function normalizeLineSpacingMode(
  value: HeadingFormat['lineSpacing'],
): 'single' | '1.5' | 'double' {
  if (value === 'single' || value === 'double' || value === '1.5') {
    return value;
  }
  // 旧版固定值统一落到 1.5 倍
  return '1.5';
}

export function resolveLineSpacingPt(format: HeadingFormat): number {
  if (format.lineSpacing === 'exact_21') {
    return 21;
  }
  if (format.lineSpacing === 'exact_28') {
    return 28;
  }
  if (
    typeof format.lineSpacingPt === 'number' &&
    Number.isFinite(format.lineSpacingPt)
  ) {
    return Math.max(8, Math.min(72, format.lineSpacingPt));
  }
  return 21;
}

/** docx spacing.line：单倍=240 */
export function lineSpacingToDocx(
  format: HeadingFormat,
): { line: number; lineRule: 'auto' | 'exact' } {
  const mode = normalizeLineSpacingMode(format.lineSpacing);
  const found = LINE_SPACING_OPTIONS.find(item => item.value === mode);
  const multiple =
    found && 'multiple' in found && typeof found.multiple === 'number'
      ? found.multiple
      : 1.5;
  return { line: Math.round(240 * multiple), lineRule: 'auto' };
}

export function firstLineIndentTwip(
  chars: number,
  size: HeadingFormat['size'],
): number {
  if (chars <= 0) {
    return 0;
  }
  return Math.round(chars * cnSizeToPt(size) * 20);
}

function normalizeLevelFormat(input: unknown): HeadingFormat {
  const parsed = headingFormatSchema.safeParse(input);
  if (parsed.success) {
    const data = parsed.data;
    const mode = normalizeLineSpacingMode(data.lineSpacing);
    return {
      ...data,
      lineSpacing: mode,
      lineSpacingPt: resolveLineSpacingPt({
        ...data,
        lineSpacing: data.lineSpacing,
      }),
    };
  }
  return fangSongHeading('四号');
}

export function normalizeExportFormat(input: unknown): ExportFormat {
  if (!input || typeof input !== 'object') {
    return DEFAULT_EXPORT_FORMAT;
  }
  const raw = input as Partial<ExportFormat>;
  const numbering = numberingSchema.safeParse(raw.numberingStyle);
  return {
    presetId:
      typeof raw.presetId === 'string' ? raw.presetId : 'custom',
    numberingStyle: numbering.success
      ? numbering.data
      : DEFAULT_EXPORT_FORMAT.numberingStyle,
    heading1: normalizeLevelFormat(raw.heading1),
    heading2: normalizeLevelFormat(raw.heading2),
    heading3: normalizeLevelFormat(raw.heading3),
    heading4: normalizeLevelFormat(raw.heading4),
    body: normalizeLevelFormat(raw.body),
  };
}

export function resolvePreset(presetId: string): ExportFormat | null {
  const preset = FORMAT_PRESETS.find(item => item.id === presetId);
  return preset ? { ...preset.format, presetId: preset.id } : null;
}
