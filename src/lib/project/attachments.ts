import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

import type {
  AttachmentField,
  BasicInfoInput,
  ProjectAttachment,
} from '@/lib/project/schema';
import { ATTACHMENT_FIELDS } from '@/lib/project/schema';
import {
  getCozeS3Storage,
  isCozeRuntime,
  requireCozeS3Storage,
} from '@/lib/storage/coze-s3';

export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_FIELD = 5;
export const MAX_EXTRACT_CHARS = 12_000;

const ALLOWED_EXT = new Set([
  '.txt',
  '.md',
  '.csv',
  '.docx',
  '.pdf',
]);

const FIELD_LABEL: Record<AttachmentField, string> = {
  marketAnalysis: '市场数据/市场分析报告',
  techIndicators: '技术经济指标',
  techScheme: '技术方案',
  equipmentList: '设备清单',
  designText: '设计方案文本',
};

export function attachmentFieldLabel(field: AttachmentField): string {
  return FIELD_LABEL[field];
}

export function isAttachmentField(value: string): value is AttachmentField {
  return (ATTACHMENT_FIELDS as readonly string[]).includes(value);
}

function uploadsRoot(): string {
  return path.resolve(process.cwd(), '.data', 'uploads');
}

function resolveLocalAttachmentPath(storageKey: string): string {
  const root = uploadsRoot();
  const full = path.resolve(root, storageKey);
  if (!full.startsWith(root)) {
    throw new Error('非法文件路径');
  }
  return full;
}

function safeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 180);
}

/** S3 object key 仅允许 ASCII 安全字符 */
function buildObjectFileName(options: {
  tenantId: string;
  projectId: string;
  field: AttachmentField;
  id: string;
  ext: string;
}): string {
  return [
    'attachments',
    options.tenantId,
    options.projectId,
    options.field,
    `${options.id}${options.ext}`,
  ].join('/');
}

export async function extractAttachmentText(options: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}): Promise<{ text: string; status: ProjectAttachment['extractStatus'] }> {
  const ext = path.extname(options.fileName).toLowerCase();
  try {
    if (ext === '.txt' || ext === '.md' || ext === '.csv') {
      const text = options.buffer.toString('utf8').trim();
      return {
        text: text.slice(0, MAX_EXTRACT_CHARS),
        status: text ? 'ok' : 'skipped',
      };
    }

    if (ext === '.docx') {
      const result = await mammoth.extractRawText({ buffer: options.buffer });
      const text = (result.value ?? '').replace(/\s+\n/g, '\n').trim();
      return {
        text: text.slice(0, MAX_EXTRACT_CHARS),
        status: text ? 'ok' : 'skipped',
      };
    }

    if (ext === '.pdf') {
      const parser = new PDFParse({ data: options.buffer });
      try {
        const result = await parser.getText();
        const text = (result.text ?? '').replace(/\s+\n/g, '\n').trim();
        return {
          text: text.slice(0, MAX_EXTRACT_CHARS),
          status: text ? 'ok' : 'skipped',
        };
      } finally {
        await parser.destroy?.();
      }
    }

    return { text: '', status: 'skipped' };
  } catch {
    return { text: '', status: 'failed' };
  }
}

async function uploadToCozeS3(options: {
  storage: NonNullable<Awaited<ReturnType<typeof getCozeS3Storage>>>;
  objectFileName: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<string> {
  try {
    const key = await options.storage.uploadFile({
      fileContent: options.buffer,
      fileName: options.objectFileName,
      contentType: options.mimeType || 'application/octet-stream',
    });
    if (typeof key !== 'string' || !key.trim()) {
      throw new Error('对象存储上传未返回有效 key');
    }
    return key;
  } catch (error) {
    const detail = error instanceof Error ? error.message : '未知错误';
    throw new Error(`对象存储上传失败：${detail}`);
  }
}

async function saveToLocalDisk(options: {
  relativeKey: string;
  buffer: Buffer;
}): Promise<string> {
  const fullPath = resolveLocalAttachmentPath(options.relativeKey);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, options.buffer);
  return options.relativeKey;
}

export async function saveProjectAttachmentFile(options: {
  tenantId: string;
  projectId: string;
  field: AttachmentField;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<ProjectAttachment> {
  const ext = path.extname(options.fileName).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error('仅支持 txt / md / csv / docx / pdf');
  }
  if (options.buffer.byteLength > MAX_ATTACHMENT_BYTES) {
    throw new Error('单个文件不超过 20MB');
  }

  const id = randomUUID();
  const objectFileName = buildObjectFileName({
    tenantId: options.tenantId,
    projectId: options.projectId,
    field: options.field,
    id,
    ext,
  });

  const storage = isCozeRuntime()
    ? await requireCozeS3Storage()
    : await getCozeS3Storage();

  let storageKey: string;
  if (storage) {
    storageKey = await uploadToCozeS3({
      storage,
      objectFileName,
      mimeType: options.mimeType,
      buffer: options.buffer,
    });
  } else {
    // 纯本地开发：无桶环境变量时回退磁盘
    storageKey = await saveToLocalDisk({
      relativeKey: objectFileName,
      buffer: options.buffer,
    });
  }

  const extracted = await extractAttachmentText({
    buffer: options.buffer,
    fileName: options.fileName,
    mimeType: options.mimeType,
  });

  return {
    id,
    field: options.field,
    fileName: safeFileName(options.fileName) || `file${ext}`,
    mimeType: options.mimeType || 'application/octet-stream',
    size: options.buffer.byteLength,
    storageKey,
    extractedText: extracted.text || undefined,
    extractStatus: extracted.status,
    uploadedAt: new Date().toISOString(),
  };
}

export async function deleteAttachmentFile(
  storageKey: string,
): Promise<void> {
  const storage = await getCozeS3Storage();
  if (storage) {
    try {
      await storage.deleteFile({ fileKey: storageKey });
      return;
    } catch {
      // 可能是历史本地文件，继续尝试磁盘删除
    }
  }
  if (!isCozeRuntime()) {
    try {
      await unlink(resolveLocalAttachmentPath(storageKey));
    } catch {
      // ignore missing file
    }
  }
}

export function mergeAttachmentsIntoBasicInfo(
  basic: BasicInfoInput,
  nextAttachments: ProjectAttachment[],
): BasicInfoInput {
  return {
    ...basic,
    attachments: nextAttachments,
  };
}

/** 供智写注入：按字段汇总已抽取文本 */
export function formatAttachmentsForPrompt(
  basic: BasicInfoInput,
): string {
  const list = basic.attachments ?? [];
  if (list.length === 0) {
    return '';
  }

  const blocks: string[] = [];
  for (const field of ATTACHMENT_FIELDS) {
    const items = list.filter(item => item.field === field);
    if (items.length === 0) {
      continue;
    }
    const parts = items.map((item, index) => {
      const head = `${index + 1}. ${item.fileName}`;
      if (item.extractStatus === 'ok' && item.extractedText?.trim()) {
        return `${head}\n${item.extractedText.trim()}`;
      }
      if (item.extractStatus === 'failed') {
        return `${head}（已上传，文本抽取失败，请结合表单文字）`;
      }
      return `${head}（已上传，无可抽取文本）`;
    });
    blocks.push(
      `【附件·${attachmentFieldLabel(field)}】\n${parts.join('\n\n')}`,
    );
  }
  return blocks.join('\n\n');
}
