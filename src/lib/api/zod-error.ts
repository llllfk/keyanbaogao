import { z } from 'zod';

/** 把 Zod 校验错误收成一句中文，避免把 issues JSON 直接甩给用户 */
export function formatZodError(error: unknown): string | null {
  if (!(error instanceof z.ZodError)) {
    return null;
  }
  const first = error.issues[0];
  if (!first) {
    return '参数校验失败';
  }
  const path = first.path.length > 0 ? String(first.path[first.path.length - 1]) : '';
  const fieldHint =
    path === 'listUrl'
      ? '栏目列表页链接'
      : path === 'sourceUrl'
        ? '原文链接'
        : path === 'packId'
          ? '依据包'
          : path === 'title'
            ? '标题'
            : path === 'name'
              ? '名称'
              : '';

  if (first.message && !first.message.startsWith('[')) {
    // 已是自定义中文文案
    if (fieldHint && !first.message.includes(fieldHint)) {
      return `${fieldHint}：${first.message}`;
    }
    return first.message;
  }

  if (first.code === 'invalid_format' && (first as { format?: string }).format === 'url') {
    return fieldHint
      ? `请输入有效的 https ${fieldHint}`
      : '请输入有效的 https 链接';
  }
  if (first.code === 'too_small') {
    return fieldHint ? `请填写${fieldHint}` : '请填写必填项';
  }
  if (first.code === 'invalid_type') {
    return fieldHint ? `${fieldHint}格式不正确` : '参数格式不正确';
  }

  return fieldHint ? `${fieldHint}校验失败` : '参数校验失败';
}

/** https URL，失败时给中文提示 */
export const httpsUrlSchema = (label = '链接') =>
  z
    .string()
    .trim()
    .min(1, `请填写${label}`)
    .max(500, `${label}过长`)
    .refine(
      value => {
        try {
          const url = new URL(value);
          return url.protocol === 'https:';
        } catch {
          return false;
        }
      },
      { message: `请输入有效的 https ${label}` },
    );
