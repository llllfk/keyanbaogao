import { fail, ok } from '@/lib/api/response';
import { getSessionUser } from '@/lib/auth/session';
import {
  generateOneChapter,
  initReportChapters,
  isGenerationComplete,
  listPendingChapterIds,
  mergeChapterIntoList,
} from '@/lib/project/generate';
import {
  orderChaptersForGeneration,
  sortChaptersForDocument,
} from '@/lib/project/outline';
import { selectionNeedsLlm } from '@/lib/project/outline';
import { outlineSaveSchema } from '@/lib/project/schema';
import {
  getProject,
  saveProjectOutline,
  updateProjectReportChapters,
} from '@/lib/project/store';
import { getDeepseekApiKey } from '@/lib/settings/llm';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function scopeOf(user: { tenantId: string; id: string }) {
  return { tenantId: user.tenantId, userId: user.id };
}

/** 单章 DeepSeek 可能较久 */
export const maxDuration = 300;

/**
 * POST body:
 * - { action: 'saveOutline', outlineId?, selectedChapterIds, targetWords }
 * - { action: 'startGenerate', mode?: 'full' | 'continue' }
 * - { action: 'generateChapter', chapterId }
 */
export async function POST(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return fail('请先登录', 401);
  }

  const { id } = await context.params;
  const scope = scopeOf(user);

  try {
    const body: unknown = await request.json();
    if (typeof body !== 'object' || body === null || !('action' in body)) {
      return fail('缺少 action');
    }

    const action = (body as { action: unknown }).action;
    const project = await getProject(scope, id);
    if (!project) {
      return fail('项目不存在', 404);
    }

    if (action === 'saveOutline') {
      const config = outlineSaveSchema.parse(body);
      const chapters = initReportChapters(config, project.reportChapters, {
        preserveDone: true,
      });
      const saved = await saveProjectOutline(
        scope,
        id,
        config,
        chapters,
        project.status === 'generated' || project.status === 'generating'
          ? project.status
          : 'basis_confirmed',
      );
      return ok({ project: saved });
    }

    if (action === 'startGenerate') {
      if (!project.outlineConfig) {
        return fail('请先保存大纲选择');
      }
      if (!project.basisConfirmedAt) {
        return fail('请先确认编制依据');
      }

      const mode =
        (body as { mode?: unknown }).mode === 'continue'
          ? 'continue'
          : 'full';

      const needsLlm = selectionNeedsLlm(
        project.outlineConfig.selectedChapterIds,
        project.outlineConfig.outlineId,
      );
      if (needsLlm) {
        const apiKey = await getDeepseekApiKey(user.id);
        if (!apiKey) {
          return fail('请先在设置中配置 DeepSeek API Key');
        }
      }

      let chapters =
        mode === 'continue'
          ? initReportChapters(
              project.outlineConfig,
              project.reportChapters,
              { preserveDone: true },
            )
          : initReportChapters(project.outlineConfig);

      // continue：失败章改回 pending，保留已完成
      if (mode === 'continue') {
        chapters = chapters.map(item =>
          item.status === 'failed'
            ? {
                ...item,
                status: 'pending' as const,
                error: undefined,
                content: '',
                updatedAt: new Date().toISOString(),
              }
            : item,
        );
      }

      const saved = await saveProjectOutline(
        scope,
        id,
        project.outlineConfig,
        chapters,
        'generating',
      );

      const savedChapters = saved?.reportChapters ?? chapters;
      const queue =
        mode === 'continue'
          ? listPendingChapterIds(
              savedChapters,
              project.outlineConfig.outlineId,
            )
          : orderChaptersForGeneration(
              savedChapters.map(item => item.chapterId),
              project.outlineConfig.outlineId,
            ).map(node => node.id);

      if (queue.length === 0) {
        return ok({
          project: saved,
          queue: [],
          complete: true,
          message: '没有待生成章节',
        });
      }

      return ok({
        project: saved
          ? {
              ...saved,
              reportChapters: sortChaptersForDocument(
                saved.reportChapters,
                project.outlineConfig.outlineId,
              ),
            }
          : saved,
        queue,
        complete: false,
      });
    }

    if (action === 'generateChapter') {
      const chapterIdRaw = (body as { chapterId?: unknown }).chapterId;
      const chapterId =
        typeof chapterIdRaw === 'string' ? chapterIdRaw : '';
      if (!chapterId) {
        return fail('缺少 chapterId');
      }

      const existingChapter = project.reportChapters.find(
        item => item.chapterId === chapterId,
      );
      const marking = mergeChapterIntoList(project.reportChapters, {
        chapterId,
        title: existingChapter?.title ?? chapterId,
        content: existingChapter?.content ?? '',
        status: 'generating',
        updatedAt: new Date().toISOString(),
      });
      await updateProjectReportChapters(scope, id, marking, 'generating');

      const latest = await getProject(scope, id);
      if (!latest) {
        return fail('项目不存在', 404);
      }

      const rewriteInstructionRaw = (
        body as { rewriteInstruction?: unknown }
      ).rewriteInstruction;
      const rewriteInstruction =
        typeof rewriteInstructionRaw === 'string'
          ? rewriteInstructionRaw.trim().slice(0, 1000)
          : undefined;

      try {
        const chapter = await generateOneChapter({
          userId: user.id,
          project: latest,
          chapterId,
          rewriteInstruction: rewriteInstruction || undefined,
        });
        const nextChapters = mergeChapterIntoList(
          latest.reportChapters,
          chapter,
        );
        const done = isGenerationComplete(nextChapters);
        const saved = await updateProjectReportChapters(
          scope,
          id,
          nextChapters,
          done ? 'generated' : 'generating',
        );
        return ok({
          project: saved,
          chapter,
          complete: done,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '本章生成失败';
        const failed = mergeChapterIntoList(latest.reportChapters, {
          chapterId,
          title:
            latest.reportChapters.find(item => item.chapterId === chapterId)
              ?.title ?? chapterId,
          content: '',
          status: 'failed',
          error: message,
          updatedAt: new Date().toISOString(),
        });
        const saved = await updateProjectReportChapters(
          scope,
          id,
          failed,
          'generating',
        );
        return fail(message, 400, { project: saved });
      }
    }

    return fail('未知 action');
  } catch (error) {
    const raw = error instanceof Error ? error.message : '操作失败';
    const message = /Failed query|Connection terminated|ECONNRESET/i.test(raw)
      ? '数据库连接中断，请重试本操作（若正在分章智写，可点「续写」继续）'
      : raw;
    return fail(message, 400);
  }
}
