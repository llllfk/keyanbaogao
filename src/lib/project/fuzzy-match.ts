/**
 * 依据库 / 编制依据用的轻量模糊匹配：
 * - 忽略常见标点与空白差异
 * - 多关键词（空格/逗号分隔）需全部命中
 */
function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[《》〈〉【】\[\]（）()"'“”‘’·•、，,；;|/\\．.。：:]/g, '')
    .replace(/\s+/g, '');
}

export function fuzzyMatchText(
  haystack: string | null | undefined,
  query: string,
): boolean {
  const raw = query.trim();
  if (!raw) {
    return true;
  }
  const hay = normalizeForMatch(haystack ?? '');
  if (!hay) {
    return false;
  }

  const tokens = raw
    .split(/[\s,，、;；|/]+/)
    .map(token => normalizeForMatch(token))
    .filter(Boolean);

  if (tokens.length === 0) {
    return true;
  }

  return tokens.every(token => hay.includes(token));
}

export function fuzzyMatchFields(
  fields: Array<string | null | undefined>,
  query: string,
): boolean {
  return fuzzyMatchText(fields.filter(Boolean).join(' '), query);
}
