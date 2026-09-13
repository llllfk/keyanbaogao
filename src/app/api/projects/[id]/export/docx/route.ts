import { fail } from '@/lib/api/response';
import { getSessionUser, toProjectScope } from '@/lib/auth/session';
import {
  buildProjectDocx,
  suggestDocxFileName,
} from '@/lib/project/export-docx';
import { getProject, updateProjectReportChapters } from '@/lib/project/store';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** GET /api/projects/:id/export/docx */
export async function GET(_request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return fail('请先登录', 401);
  }

  const { id } = await context.params;
  const scope = toProjectScope(user);

  try {
    const project = await getProject(scope, id);
    if (!project) {
      return fail('项目不存在', 404);
    }

    const buffer = await buildProjectDocx(project);
    const fileName = suggestDocxFileName(project);

    // 标记已导出（保留章节内容）
    await updateProjectReportChapters(
      scope,
      id,
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
  } catch (error) {
    const message = error instanceof Error ? error.message : '导出失败';
    return fail(message, 400);
  }
}
