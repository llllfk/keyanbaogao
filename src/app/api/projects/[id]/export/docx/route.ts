import { fail } from '@/lib/api/response';
import { getSessionUser, toProjectScope } from '@/lib/auth/session';
import {
  buildProjectDocx,
  suggestDocxFileName,
} from '@/lib/project/export-docx';
import { exportFormatSchema } from '@/lib/export/format-schema';
import {
  getExportFormat,
  saveExportFormat,
} from '@/lib/settings/export-format';
import { getProject, updateProjectReportChapters } from '@/lib/project/store';

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function respondDocx(
  scope: { tenantId: string; userId: string },
  projectId: string,
  tenantId: string,
  formatInput?: unknown,
) {
  const project = await getProject(scope, projectId);
  if (!project) {
    return fail('项目不存在', 404);
  }

  const exportFormat =
    formatInput === undefined
      ? await getExportFormat(tenantId)
      : await saveExportFormat(tenantId, exportFormatSchema.parse(formatInput));

  const buffer = await buildProjectDocx(project, exportFormat);
  const fileName = suggestDocxFileName(project);

  await updateProjectReportChapters(
    scope,
    projectId,
    project.reportChapters ?? [],
    'exported',
  );

  const encoded = encodeURIComponent(fileName);
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename*=UTF-8''${encoded}`,
      'Cache-Control': 'no-store',
    },
  });
}

/** GET：使用租户已保存格式导出 */
export async function GET(_request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return fail('请先登录', 401);
  }

  const { id } = await context.params;
  const scope = toProjectScope(user);

  try {
    return await respondDocx(scope, id, user.tenantId);
  } catch (error) {
    const message = error instanceof Error ? error.message : '导出失败';
    return fail(message, 400);
  }
}

/** POST：可携带 format，保存后再导出 */
export async function POST(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return fail('请先登录', 401);
  }

  const { id } = await context.params;
  const scope = toProjectScope(user);

  try {
    const body: unknown = await request.json().catch(() => ({}));
    const format =
      typeof body === 'object' &&
      body !== null &&
      'format' in body
        ? (body as { format: unknown }).format
        : undefined;
    return await respondDocx(scope, id, user.tenantId, format);
  } catch (error) {
    const message = error instanceof Error ? error.message : '导出失败';
    return fail(message, 400);
  }
}
