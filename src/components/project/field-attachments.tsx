'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type {
  AttachmentField,
  ProjectAttachment,
} from '@/lib/project/schema';

type FieldAttachmentsProps = {
  projectId: string;
  field: AttachmentField;
  attachments: ProjectAttachment[];
  onChange: (next: ProjectAttachment[]) => void;
};

function formatSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function extractLabel(status: ProjectAttachment['extractStatus']): string {
  if (status === 'ok') {
    return '已抽取文本';
  }
  if (status === 'failed') {
    return '抽取失败';
  }
  return '未抽取文本';
}

export function FieldAttachments({
  projectId,
  field,
  attachments,
  onChange,
}: FieldAttachmentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<ProjectAttachment | null>(null);
  const fieldItems = attachments.filter(item => item.field === field);

  const upload = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) {
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.set('field', field);
      body.set('file', file);
      const response = await fetch(`/api/projects/${projectId}/attachments`, {
        method: 'POST',
        body,
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof payload === 'object' &&
          payload !== null &&
          'error' in payload &&
          typeof (payload as { error: unknown }).error === 'string'
            ? (payload as { error: string }).error
            : '上传失败';
        toast.error(message);
        return;
      }
      const data =
        typeof payload === 'object' &&
        payload !== null &&
        'data' in payload
          ? (
              payload as {
                data: { attachments?: ProjectAttachment[] };
              }
            ).data
          : null;
      if (data?.attachments) {
        onChange(data.attachments);
      }
      toast.success(`已上传：${file.name}`);
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const remove = async (attachmentId: string) => {
    setRemovingId(attachmentId);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/attachments?attachmentId=${encodeURIComponent(attachmentId)}`,
        { method: 'DELETE' },
      );
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof payload === 'object' &&
          payload !== null &&
          'error' in payload &&
          typeof (payload as { error: unknown }).error === 'string'
            ? (payload as { error: string }).error
            : '删除失败';
        toast.error(message);
        return;
      }
      const data =
        typeof payload === 'object' &&
        payload !== null &&
        'data' in payload
          ? (
              payload as {
                data: { attachments?: ProjectAttachment[] };
              }
            ).data
          : null;
      if (data?.attachments) {
        onChange(data.attachments);
      } else {
        onChange(attachments.filter(item => item.id !== attachmentId));
      }
      toast.success('附件已删除');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-2 rounded-md border border-dashed border-[var(--app-line)] bg-[var(--app-tint)]/20 px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--app-muted)]">
          可选附件（Word/PDF/文本，单文件 ≤20MB，每字段最多 5 个）
        </p>
        <div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".txt,.md,.csv,.docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/csv"
            onChange={event => {
              void upload(event.target.files);
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? '上传中…' : '上传附件'}
          </Button>
        </div>
      </div>

      {fieldItems.length > 0 ? (
        <ul className="space-y-1.5">
          {fieldItems.map(item => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--app-line)] bg-[var(--app-paper)] px-2.5 py-1.5 text-xs"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[var(--app-ink)]">
                  {item.fileName}
                </p>
                <p className="text-[var(--app-muted)]">
                  {formatSize(item.size)} · {extractLabel(item.extractStatus)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={uploading}
                  onClick={() => setPreview(item)}
                >
                  查看抽取内容
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={removingId === item.id || uploading}
                  onClick={() => {
                    void remove(item.id);
                  }}
                >
                  {removingId === item.id ? '删除中…' : '删除'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-[var(--app-muted)]">
          未上传。可粘贴摘要文字，也可上传原文供智写引用。
        </p>
      )}

      <Dialog
        open={preview !== null}
        onOpenChange={open => {
          if (!open) {
            setPreview(null);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="pr-8 text-base">
              {preview?.fileName ?? '抽取内容'}
            </DialogTitle>
            <DialogDescription>
              {preview
                ? `${formatSize(preview.size)} · ${extractLabel(preview.extractStatus)} · 智写将引用以下抽取文本`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto rounded-md border border-[var(--app-line)] bg-[var(--app-tint)]/30 px-3 py-3">
            {preview?.extractStatus === 'ok' &&
            preview.extractedText?.trim() ? (
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[var(--app-ink)]">
                {preview.extractedText}
              </pre>
            ) : preview?.extractStatus === 'failed' ? (
              <p className="text-sm text-[var(--app-muted)]">
                文本抽取失败，智写不会引用该附件正文。可改用 txt / md / csv / docx
                后重新上传。
              </p>
            ) : (
              <p className="text-sm text-[var(--app-muted)]">
                暂无抽取文本（文件可能为空或不支持抽取）。
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
