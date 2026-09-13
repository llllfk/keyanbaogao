import { fail, ok } from '@/lib/api/response';
import { getSessionUser } from '@/lib/auth/session';
import {
  deleteAttachmentFile,
  isAttachmentField,
  MAX_ATTACHMENTS_PER_FIELD,
  saveProjectAttachmentFile,
} from '@/lib/project/attachments';
import {
  addProjectAttachment,
  getProject,
  removeProjectAttachment,
} from '@/lib/project/store';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function scopeOf(user: { tenantId: string; id: string }) {
  return { tenantId: user.tenantId, userId: user.id };
}

export const maxDuration = 60;

/** POST multipart: field + file */
export async function POST(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return fail('请先登录', 401);
  }

  const { id } = await context.params;
  const scope = scopeOf(user);
  const project = await getProject(scope, id);
  if (!project) {
    return fail('项目不存在', 404);
  }

  try {
    const form = await request.formData();
    const fieldRaw = form.get('field');
    const file = form.get('file');
    const field =
      typeof fieldRaw === 'string' && isAttachmentField(fieldRaw)
        ? fieldRaw
        : null;

    if (!field) {
      return fail('请指定有效的附件字段');
    }
    if (!(file instanceof File)) {
      return fail('请选择文件');
    }

    const current = (project.basicInfo.attachments ?? []).filter(
      item => item.field === field,
    );
    if (current.length >= MAX_ATTACHMENTS_PER_FIELD) {
      return fail(`该字段最多上传 ${MAX_ATTACHMENTS_PER_FIELD} 个文件`);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const attachment = await saveProjectAttachmentFile({
      tenantId: user.tenantId,
      projectId: id,
      field,
      fileName: file.name || 'upload.bin',
      mimeType: file.type || 'application/octet-stream',
      buffer,
    });

    const saved = await addProjectAttachment(scope, id, attachment);
    if (!saved) {
      await deleteAttachmentFile(attachment.storageKey);
      return fail('保存附件失败', 500);
    }

    return ok({
      attachment,
      attachments: saved.basicInfo.attachments ?? [],
      project: saved,
    });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : '上传失败',
      400,
    );
  }
}

/** DELETE ?attachmentId= */
export async function DELETE(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return fail('请先登录', 401);
  }

  const { id } = await context.params;
  const attachmentId = new URL(request.url).searchParams.get('attachmentId');
  if (!attachmentId) {
    return fail('缺少 attachmentId');
  }

  try {
    const result = await removeProjectAttachment(
      scopeOf(user),
      id,
      attachmentId,
    );
    if (!result) {
      return fail('附件不存在或项目不存在', 404);
    }
    if (result.removed) {
      await deleteAttachmentFile(result.removed.storageKey);
    }
    return ok({
      attachments: result.project.basicInfo.attachments ?? [],
      project: result.project,
    });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : '删除失败',
      400,
    );
  }
}
