import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
  convertInchesToTwip,
} from 'docx';

import {
  flattenOutlineNodes,
  getOutlineTemplate,
  sortChaptersForDocument,
} from '@/lib/project/outline';
import type { ProjectRecord, ReportChapter } from '@/lib/project/schema';

const FONT_BODY = {
  ascii: 'Times New Roman',
  eastAsia: '宋体',
  hAnsi: 'Times New Roman',
} as const;

const FONT_HEADING = {
  ascii: 'SimHei',
  eastAsia: '黑体',
  hAnsi: 'SimHei',
} as const;

const CN_DIGITS = '〇一二三四五六七八九';
const CN_CHAPTER = [
  '',
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '七',
  '八',
  '九',
  '十',
  '十一',
  '十二',
  '十三',
  '十四',
  '十五',
  '十六',
  '十七',
  '十八',
  '十九',
  '二十',
] as const;

type BodyBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'table'; rows: string[][] };

type DocChild = Paragraph | Table | TableOfContents;

function majorSectionId(chapterId: string): string {
  return chapterId.split('.')[0] ?? chapterId;
}

function headingLevelForChapterId(
  chapterId: string,
): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
  const depth = chapterId.split('.').length;
  if (depth <= 1) {
    return HeadingLevel.HEADING_1;
  }
  if (depth === 2) {
    return HeadingLevel.HEADING_2;
  }
  return HeadingLevel.HEADING_3;
}

/** 将大纲一级标题写成「第一章  概述」 */
function formatMajorHeading(sectionId: string, title: string): string {
  const n = Number(sectionId);
  if (Number.isInteger(n) && n >= 1 && n < CN_CHAPTER.length) {
    return `第${CN_CHAPTER[n]}章  ${title}`;
  }
  return `${sectionId}  ${title}`;
}

function formatChineseYearMonth(date: Date = new Date()): string {
  const year = date
    .getFullYear()
    .toString()
    .split('')
    .map(d => CN_DIGITS[Number(d)] ?? d)
    .join('');
  const month = date.getMonth() + 1;
  let monthText: string;
  if (month <= 10) {
    monthText = month === 10 ? '十' : (CN_DIGITS[month] ?? String(month));
  } else {
    monthText = `十${CN_DIGITS[month % 10] ?? String(month % 10)}`;
  }
  return `${year}年${monthText}月`;
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/&nbsp;/gi, ' ')
    .replace(/^#{1,6}\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseContentBlocks(
  content: string,
  chapterTitle: string,
): BodyBlock[] {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return [{ type: 'paragraph', text: '【待补充】' }];
  }

  const lines = normalized.split('\n');
  const blocks: BodyBlock[] = [];
  let paragraphBuf: string[] = [];

  const flushParagraph = () => {
    const text = stripInlineMarkdown(paragraphBuf.join(' '));
    paragraphBuf = [];
    if (text) {
      blocks.push({ type: 'paragraph', text });
    }
  };

  const isDuplicateTitle = (text: string) => {
    const a = text.replace(/\s+/g, '');
    const b = chapterTitle.replace(/\s+/g, '');
    return a === b || a.includes(b) || b.includes(a);
  };

  const isTableSep = (line: string) =>
    /^\|?[\s:|-]+\|[\s:|-]*\|?$/.test(line) ||
    /^\|?(?:\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(line);

  const parseTableRow = (line: string): string[] =>
    line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(cell => stripInlineMarkdown(cell.trim()));

  for (let i = 0; i < lines.length; i += 1) {
    const line = (lines[i] ?? '').trim();
    if (!line) {
      flushParagraph();
      continue;
    }

    if (line.startsWith('|')) {
      flushParagraph();
      const tableRows: string[][] = [];
      while (i < lines.length) {
        const rowLine = (lines[i] ?? '').trim();
        if (!rowLine.startsWith('|')) {
          i -= 1;
          break;
        }
        if (!isTableSep(rowLine)) {
          tableRows.push(parseTableRow(rowLine));
        }
        i += 1;
      }
      if (tableRows.length > 0) {
        blocks.push({ type: 'table', rows: tableRows });
      }
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      const hashes = headingMatch[1].length;
      const title = stripInlineMarkdown(headingMatch[2]);
      if (!title || isDuplicateTitle(title)) {
        continue;
      }
      blocks.push({
        type: 'heading',
        level: hashes <= 2 ? 2 : 3,
        text: title,
      });
      continue;
    }

    const bulletMatch = line.match(/^[-*+]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      const text = stripInlineMarkdown(bulletMatch[1]);
      if (text) {
        blocks.push({ type: 'bullet', text });
      }
      continue;
    }

    // 编号列表（如 1.3 编制依据条目）每条单独成段，避免被拼成一行
    if (/^\d+\.\s+\S/.test(line)) {
      flushParagraph();
      const text = stripInlineMarkdown(line);
      if (text) {
        blocks.push({ type: 'paragraph', text });
      }
      continue;
    }

    if (/^#{1,6}$/.test(line)) {
      continue;
    }

    paragraphBuf.push(line.replace(/^#{1,6}\s*/, ''));
  }
  flushParagraph();

  return blocks.length > 0
    ? blocks
    : [{ type: 'paragraph', text: '【待补充】' }];
}

function markdownTableToDocx(rows: string[][]): Table {
  const colCount = Math.max(1, ...rows.map(row => row.length));
  const width = Math.floor(9000 / colCount);
  const border = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: '999999',
  };
  const borders = {
    top: border,
    bottom: border,
    left: border,
    right: border,
  };

  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    rows: rows.map((row, rowIndex) => {
      const cells = [...row];
      while (cells.length < colCount) {
        cells.push('');
      }
      return new TableRow({
        children: cells.map(
          cell =>
            new TableCell({
              borders,
              width: { size: width, type: WidthType.DXA },
              children: [
                new Paragraph({
                  spacing: { after: 40, before: 40 },
                  children: [
                    new TextRun({
                      text: cell,
                      font: FONT_BODY,
                      size: 18,
                      bold: rowIndex === 0,
                    }),
                  ],
                }),
              ],
            }),
        ),
      });
    }),
  });
}

function bodyParagraph(text: string, options?: { bullet?: boolean }): Paragraph {
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    indent: options?.bullet
      ? { left: convertInchesToTwip(0.25) }
      : { firstLine: convertInchesToTwip(0.3) },
    children: [
      new TextRun({
        text: options?.bullet ? `• ${text}` : text,
        font: FONT_BODY,
        size: 24,
      }),
    ],
  });
}

function headingParagraph(
  text: string,
  level: (typeof HeadingLevel)[keyof typeof HeadingLevel],
): Paragraph {
  const size =
    level === HeadingLevel.HEADING_1
      ? 32
      : level === HeadingLevel.HEADING_2
        ? 28
        : 24;
  return new Paragraph({
    heading: level,
    spacing: { before: 320, after: 160 },
    children: [
      new TextRun({
        text,
        bold: true,
        font: FONT_HEADING,
        size,
      }),
    ],
  });
}

/** 对标小泓星封面：温馨提示 + 项目名 + 可行性研究报告 + 编制时间 */
function coverParagraphs(project: ProjectRecord): Paragraph[] {
  const name = project.basicInfo.name || '未命名项目';
  const dateText = formatChineseYearMonth();
  return [
    new Paragraph({ spacing: { before: 200 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: '温馨提示',
          bold: true,
          font: FONT_HEADING,
          size: 44,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [
        new TextRun({
          text: '本报告内容由人工智能AI系统基于您提供的信息和公开数据生成，仅供参考使用。',
          bold: true,
          font: FONT_BODY,
          size: 32,
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ spacing: { before: 1200 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: name,
          bold: true,
          font: FONT_HEADING,
          size: 52,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: '可行性研究报告',
          bold: true,
          font: FONT_HEADING,
          size: 52,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: `编制时间: ${dateText}`,
          bold: true,
          font: FONT_BODY,
          size: 32,
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

/**
 * 目录页：插入 Word TOC 域；打开 Word 时会提示更新域以生成真实页码
 *（与小泓星一致带页码，页码由 Word 排版后写入）。
 */
function tocPageChildren(): DocChild[] {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
      children: [
        new TextRun({
          text: '目   录',
          bold: true,
          font: FONT_HEADING,
          size: 32,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: '（若打开后目录为空或页码未刷新，请在 Word 中右键目录 → 更新域）',
          font: FONT_BODY,
          size: 18,
          color: '666666',
        }),
      ],
    }),
    new TableOfContents('目录', {
      hyperlink: true,
      headingStyleRange: '1-3',
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

export async function buildProjectDocx(project: ProjectRecord): Promise<Buffer> {
  const outlineId = project.outlineConfig?.outlineId ?? 'gov_feasibility_2023';
  const chapters = sortChaptersForDocument(
    (project.reportChapters ?? []).filter(
      item => item.status === 'done' || Boolean(item.content?.trim()),
    ),
    outlineId,
  );
  if (chapters.length === 0) {
    throw new Error('暂无已生成章节，无法导出');
  }

  const template = getOutlineTemplate(outlineId);
  const nodeById = new Map(
    flattenOutlineNodes(template.tree).map(node => [node.id, node]),
  );

  const children: DocChild[] = [
    ...coverParagraphs(project),
    ...tocPageChildren(),
  ];
  let lastMajor = '';

  for (const chapter of chapters) {
    const major = majorSectionId(chapter.chapterId);
    if (major !== lastMajor) {
      lastMajor = major;
      const parent = nodeById.get(major);
      const majorTitle = parent
        ? formatMajorHeading(parent.id, parent.title)
        : formatMajorHeading(major, major);
      children.push(headingParagraph(majorTitle, HeadingLevel.HEADING_1));
    }

    const chapterTitle = chapter.title || chapter.chapterId;
    if (chapter.chapterId !== major) {
      children.push(
        headingParagraph(
          chapterTitle,
          headingLevelForChapterId(chapter.chapterId),
        ),
      );
    }

    const blocks = parseContentBlocks(chapter.content || '', chapterTitle);
    for (const block of blocks) {
      if (block.type === 'heading') {
        children.push(
          headingParagraph(
            block.text,
            block.level === 2
              ? HeadingLevel.HEADING_2
              : HeadingLevel.HEADING_3,
          ),
        );
        continue;
      }
      if (block.type === 'bullet') {
        children.push(bodyParagraph(block.text, { bullet: true }));
        continue;
      }
      if (block.type === 'table') {
        children.push(markdownTableToDocx(block.rows));
        children.push(
          new Paragraph({
            spacing: { after: 160 },
            children: [],
          }),
        );
        continue;
      }
      children.push(bodyParagraph(block.text));
    }
  }

  const doc = new Document({
    creator: '可研智写',
    title: `${project.basicInfo.name || '可研报告'}可行性研究报告`,
    description: 'AI 辅助生成的可行性研究报告初稿',
    features: {
      updateFields: true,
    },
    styles: {
      default: {
        document: {
          run: {
            font: FONT_BODY,
            size: 24,
          },
          paragraph: {
            spacing: { line: 360, after: 120 },
          },
        },
        heading1: {
          run: { font: FONT_HEADING, size: 32, bold: true },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
        },
        heading2: {
          run: { font: FONT_HEADING, size: 28, bold: true },
          paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 },
        },
        heading3: {
          run: { font: FONT_HEADING, size: 24, bold: true },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.1),
              right: convertInchesToTwip(1.1),
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: FONT_BODY,
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const uint8 = await Packer.toBuffer(doc);
  return Buffer.from(uint8);
}

export function suggestDocxFileName(project: ProjectRecord): string {
  const raw = (project.basicInfo.name || '可研报告').replace(
    /[\\/:*?"<>|]/g,
    '_',
  );
  return `${raw}-可行性研究报告初稿.docx`;
}
