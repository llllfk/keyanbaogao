import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto';

const PREFIX = 'enc:v1:';

function deriveKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('缺少有效的 AUTH_SECRET，无法加密 API Key');
  }
  return scryptSync(secret, 'keyanbaogao-deepseek-salt', 32);
}

/** 加密后入库；空字符串表示清空 */
export function encryptSecret(plain: string): string {
  const text = plain.trim();
  if (!text) {
    return '';
  }
  const key = deriveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptSecret(stored: string | null | undefined): string {
  if (!stored) {
    return '';
  }
  if (!stored.startsWith(PREFIX)) {
    // 兼容未加密的旧值
    return stored;
  }
  const payload = stored.slice(PREFIX.length);
  const [ivB64, tagB64, dataB64] = payload.split('.');
  if (!ivB64 || !tagB64 || !dataB64) {
    return '';
  }
  const key = deriveKey();
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(ivB64, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64url')),
    decipher.final(),
  ]);
  return plain.toString('utf8');
}

export function maskSecret(plain: string): string {
  const text = plain.trim();
  if (!text) {
    return '';
  }
  if (text.length <= 8) {
    return '••••••••';
  }
  return `${text.slice(0, 3)}••••${text.slice(-4)}`;
}
