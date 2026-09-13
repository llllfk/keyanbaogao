import { S3Storage, ensureStorageEnvironment } from 'coze-coding-dev-sdk';

/**
 * 扣子编程对象存储（S3 兼容）
 * 端点/桶名由平台自动注入：COZE_BUCKET_ENDPOINT_URL、COZE_BUCKET_NAME
 * 鉴权走 workload identity（x-storage-token），无需 access_key/secret_key
 */

let storageSingleton: S3Storage | null = null;
let ensurePromise: Promise<boolean> | null = null;

function hasBucketEnv(): boolean {
  return Boolean(
    process.env.COZE_BUCKET_ENDPOINT_URL?.trim() &&
      process.env.COZE_BUCKET_NAME?.trim(),
  );
}

/** 扣子编程运行时（DEV/PROD 等），平台应自动注入桶环境变量 */
export function isCozeRuntime(): boolean {
  return Boolean(process.env.COZE_PROJECT_ENV?.trim());
}

function applyStorageEnv(env: {
  endpointUrl?: string;
  bucketName?: string;
}): void {
  if (env.endpointUrl?.trim() && !process.env.COZE_BUCKET_ENDPOINT_URL?.trim()) {
    process.env.COZE_BUCKET_ENDPOINT_URL = env.endpointUrl.trim();
  }
  if (env.bucketName?.trim() && !process.env.COZE_BUCKET_NAME?.trim()) {
    process.env.COZE_BUCKET_NAME = env.bucketName.trim();
  }
}

/** 尽量拉齐平台注入的桶配置；本地无 Coze 运行时时返回 false */
export async function ensureCozeStorageReady(): Promise<boolean> {
  if (hasBucketEnv()) {
    return true;
  }
  if (!ensurePromise) {
    ensurePromise = (async () => {
      try {
        const env = await ensureStorageEnvironment();
        applyStorageEnv(env);
      } catch {
        return false;
      }
      return hasBucketEnv();
    })().finally(() => {
      ensurePromise = null;
    });
  }
  return ensurePromise;
}

export async function getCozeS3Storage(): Promise<S3Storage | null> {
  const ready = await ensureCozeStorageReady();
  if (!ready) {
    return null;
  }
  if (!storageSingleton) {
    storageSingleton = new S3Storage();
  }
  return storageSingleton;
}

/** 扣子环境必须拿到可用客户端，否则抛错 */
export async function requireCozeS3Storage(): Promise<S3Storage> {
  const storage = await getCozeS3Storage();
  if (storage) {
    return storage;
  }
  throw new Error(
    '对象存储未就绪：请确认平台已注入 COZE_BUCKET_ENDPOINT_URL / COZE_BUCKET_NAME',
  );
}

export function isCozeStorageConfigured(): boolean {
  return hasBucketEnv();
}
