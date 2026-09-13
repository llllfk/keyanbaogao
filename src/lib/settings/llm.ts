import { eq } from 'drizzle-orm';

import {
  decryptSecret,
  encryptSecret,
  maskSecret,
} from '@/lib/crypto/secret';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';

export type LlmSettingsPublic = {
  deepseekConfigured: boolean;
  deepseekApiKeyMasked: string;
  deepseekBaseUrl: string;
  deepseekModel: string;
};

export const DEFAULT_DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
export const DEFAULT_DEEPSEEK_MODEL = 'deepseek-chat';

export async function getLlmSettingsPublic(
  userId: string,
): Promise<LlmSettingsPublic> {
  const db = getDb();
  const [row] = await db
    .select({
      deepseekApiKeyEnc: users.deepseekApiKeyEnc,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const plain = decryptSecret(row?.deepseekApiKeyEnc);
  return {
    deepseekConfigured: Boolean(plain),
    deepseekApiKeyMasked: maskSecret(plain),
    deepseekBaseUrl: DEFAULT_DEEPSEEK_BASE_URL,
    deepseekModel: DEFAULT_DEEPSEEK_MODEL,
  };
}

/** 供服务端调用大模型时取明文 Key（勿返回给前端） */
export async function getDeepseekApiKey(userId: string): Promise<string> {
  const db = getDb();
  const [row] = await db
    .select({
      deepseekApiKeyEnc: users.deepseekApiKeyEnc,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return decryptSecret(row?.deepseekApiKeyEnc);
}

/**
 * 更新 DeepSeek API Key。
 * - 传入非空字符串：覆盖保存
 * - 传入空字符串且 clear=true：清空
 * - 传入空字符串且 clear=false：保持原值不变
 */
export async function updateDeepseekApiKey(
  userId: string,
  apiKey: string,
  options?: { clear?: boolean },
): Promise<LlmSettingsPublic> {
  const db = getDb();
  const trimmed = apiKey.trim();
  const clear = options?.clear === true;

  if (!trimmed && !clear) {
    return getLlmSettingsPublic(userId);
  }

  const value = clear || !trimmed ? null : encryptSecret(trimmed);
  await db
    .update(users)
    .set({
      deepseekApiKeyEnc: value,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return getLlmSettingsPublic(userId);
}
