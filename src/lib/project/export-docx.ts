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
  cnSizeToHalfPoints,
  DEFAULT_EXPORT_FORMAT,
  firstLineIndentTwip,
  lineSpacingToDocx,
  type ExportFormat,
  type HeadingFormat,
  type NumberingStyle,
} from '@/lib/export/format-schema';
import {
  flattenOutlineNodes,
  getOutlineTemplate,
  sortChaptersForDocument,
} from '@/lib/project/outline';
import type { ProjectRecord } from '@/lib/project/schema';

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
  | { type: 'heading'; level: 2 | 3 | 4; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'table'; rows: string[][] };

type DocChild = Paragraph | Table | TableOfContents;

type HeadingLevelNum = 1 | 2 | 3 | 4;

type DocxHeadingLevel = (typeof HeadingLevel)[keyof typeof HeadingLevel];

function runFont(eastAsia: string) {
  return {
    ascii: 'Times New Roman',
    eastAsia,
    hAnsi: 'Times New Roman',
  } as const;
}

function alignToDocx(
  align: HeadingFormat['align'],
): (typeof AlignmentType)[keyof typeof AlignmentType] {
  switch (align) {
    case 'center':
      return AlignmentType.CENTER;
    case 'both':
      return AlignmentType.JUSTIFIED;
    default:
      return AlignmentType.LEFT;
  }
}

function getHeadingFormat(
  exportFormat: ExportFormat,
  level: HeadingLevelNum,
): HeadingFormat {
  switch (level) {
    case 1:
      return exportFormat.heading1;
    case 2:
      return exportFormat.heading2;
    case 3:
      return exportFormat.heading3;
    case 4:
      return exportFormat.heading4;
  }
}

function headingDocxLevel(level: HeadingLevelNum): DocxHeadingLevel {
  switch (level) {
    case 1:
      return HeadingLevel.HEADING_1;
    case 2:
      return HeadingLevel.HEADING_2;
    case 3:
      return HeadingLevel.HEADING_3;
    case 4:
      return HeadingLevel.HEADING_4;
  }
}

function majorSectionId(chapterId: string): string {
  return chapterId.split('.')[0] ?? chapterId;
}

function headingLevelForChapterId(chapterId: string): HeadingLevelNum {
  const depth = chapterId.split('.').length;
  if (depth <= 1) {
    return 1;
  }
  if (depth === 2) {
    return 2;
  }
  if (depth === 3) {
    return 3;
  }
  return 4;
}

function formatMajorHeading(
  sectionId: string,
  title: string,
  style: NumberingStyle,
): string {
  const n = Number(sectionId);
  if (!Number.isInteger(n) || n < 1 || n >= CN_CHAPTER.length) {
    return `${sectionId}  ${title}`;
  }
  switch (style) {
    case 'chapter_arabic':
      return `第 ${n} 章  ${title}`;
    case 'chapter_cn':
      return `第${CN_CHAPTER[n]}章  ${title}`;
    case 'list_cn':
      return `${CN_CHAPTER[n]}、${title}`;
    case 'list_num':
      return `${n}、${title}`;
  }
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
        level: hashes <= 2 ? 2 : hashes === 3 ? 3 : 4,
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

function buildStyleFromHeadingFormat(
  format: HeadingFormat,
  outlineLevel: number,
) {
  const spacing = lineSpacingToDocx(format);
  return {
    run: {
      font: runFont(format.font),
      size: cnSizeToHalfPoints(format.size),
      bold: format.bold,
    },
    paragraph: {
      spacing: {
        before: outlineLevel === 0 ? 360 : outlineLevel === 1 ? 280 : 240,
        after: outlineLevel === 0 ? 200 : outlineLevel === 1 ? 160 : 120,
        line: spacing.line,
        lineRule: spacing.lineRule,
      },
      alignment: alignToDocx(format.align),
      outlineLevel,
    },
  };
}

function headingParagraph(
  text: string,
  level: HeadingLevelNum,
  exportFormat: ExportFormat,
): Paragraph {
  const format = getHeadingFormat(exportFormat, level);
  const spacing = lineSpacingToDocx(format);
  return new Paragraph({
    heading: headingDocxLevel(level),
    alignment: alignToDocx(format.align),
    spacing: {
      before:
        level === 1 ? 320 : level === 2 ? 280 : level === 3 ? 240 : 200,
      after: level === 1 ? 200 : level === 2 ? 160 : 120,
      line: spacing.line,
      lineRule: spacing.lineRule,
    },
    indent: {
      firstLine: firstLineIndentTwip(
        format.firstLineIndentChars,
        format.size,
      ),
    },
    children: [
      new TextRun({
        text,
        bold: format.bold,
        font: runFont(format.font),
        size: cnSizeToHalfPoints(format.size),
      }),
    ],
  });
}

function bodyParagraph(
  text: string,
  exportFormat: ExportFormat,
  options?: { bullet?: boolean },
): Paragraph {
  const format = exportFormat.body;
  const spacing = lineSpacingToDocx(format);
  const firstLineIndent = firstLineIndentTwip(
    format.firstLineIndentChars,
    format.size,
  );
  return new Paragraph({
    alignment: alignToDocx(format.align),
    spacing: {
      after: 120,
      line: spacing.line,
      lineRule: spacing.lineRule,
    },
    indent: options?.bullet
      ? {
          left: convertInchesToTwip(0.25),
          firstLine: firstLineIndent,
        }
      : { firstLine: firstLineIndent },
    children: [
      new TextRun({
        text: options?.bullet ? `• ${text}` : text,
        bold: format.bold,
        font: runFont(format.font),
        size: cnSizeToHalfPoints(format.size),
      }),
    ],
  });
}

function markdownTableToDocx(
  rows: string[][],
  exportFormat: ExportFormat,
): Table {
  const format = exportFormat.body;
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
                      font: runFont(format.font),
                      size: cnSizeToHalfPoints(format.size),
                      bold: rowIndex === 0 || format.bold,
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

function coverParagraphs(
  project: ProjectRecord,
  exportFormat: ExportFormat,
): Paragraph[] {
  const name = project.basicInfo.name || '未命名项目';
  const dateText = formatChineseYearMonth();
  const h1 = exportFormat.heading1;
  const body = exportFormat.body;

  return [
    new Paragraph({ spacing: { before: 200 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: '温馨提示',
          bold: h1.bold,
          font: runFont(h1.font),
          size: cnSizeToHalfPoints(h1.size),
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [
        new TextRun({
          text: '本报告内容由人工智能AI系统基于您提供的信息和公开数据生成，仅供参考使用。',
          bold: body.bold,
          font: runFont(body.font),
          size: cnSizeToHalfPoints(body.size),
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
          bold: h1.bold,
          font: runFont(h1.font),
          size: cnSizeToHalfPoints(h1.size),
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: '可行性研究报告',
          bold: h1.bold,
          font: runFont(h1.font),
          size: cnSizeToHalfPoints(h1.size),
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: `编制时间: ${dateText}`,
          bold: body.bold,
          font: runFont(body.font),
          size: cnSizeToHalfPoints(body.size),
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function tocPageChildren(exportFormat: ExportFormat): DocChild[] {
  const h1 = exportFormat.heading1;
  const body = exportFormat.body;

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
      children: [
        new TextRun({
          text: '目   录',
          bold: h1.bold,
          font: runFont(h1.font),
          size: cnSizeToHalfPoints(h1.size),
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: '（若打开后目录为空或页码未刷新，请在 Word 中右键目录 → 更新域）',
          font: runFont(body.font),
          size: cnSizeToHalfPoints(body.size),
          color: '666666',
        }),
      ],
    }),
    new TableOfContents('目录', {
      hyperlink: true,
      headingStyleRange: '1-4',
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

export async function buildProjectDocx(
  project: ProjectRecord,
  exportFormat: ExportFormat = DEFAULT_EXPORT_FORMAT,
): Promise<Buffer> {
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
    ...coverParagraphs(project, exportFormat),
    ...tocPageChildren(exportFormat),
  ];
  let lastMajor = '';

  for (const chapter of chapters) {
    const major = majorSectionId(chapter.chapterId);
    if (major !== lastMajor) {
      lastMajor = major;
      const parent = nodeById.get(major);
      const majorTitle = parent
        ? formatMajorHeading(
            parent.id,
            parent.title,
            exportFormat.numberingStyle,
          )
        : formatMajorHeading(major, major, exportFormat.numberingStyle);
      children.push(headingParagraph(majorTitle, 1, exportFormat));
    }

    const chapterTitle = chapter.title || chapter.chapterId;
    if (chapter.chapterId !== major) {
      children.push(
        headingParagraph(
          chapterTitle,
          headingLevelForChapterId(chapter.chapterId),
          exportFormat,
        ),
      );
    }

    const blocks = parseContentBlocks(chapter.content || '', chapterTitle);
    for (const block of blocks) {
      if (block.type === 'heading') {
        children.push(
          headingParagraph(block.text, block.level, exportFormat),
        );
        continue;
      }
      if (block.type === 'bullet') {
        children.push(bodyParagraph(block.text, exportFormat, { bullet: true }));
        continue;
      }
      if (block.type === 'table') {
        children.push(markdownTableToDocx(block.rows, exportFormat));
        children.push(
          new Paragraph({
            spacing: { after: 160 },
            children: [],
          }),
        );
        continue;
      }
      children.push(bodyParagraph(block.text, exportFormat));
    }
  }

  const bodySpacing = lineSpacingToDocx(exportFormat.body);

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
            font: runFont(exportFormat.body.font),
            size: cnSizeToHalfPoints(exportFormat.body.size),
            bold: exportFormat.body.bold,
          },
          paragraph: {
            spacing: {
              line: bodySpacing.line,
              lineRule: bodySpacing.lineRule,
              after: 120,
            },
            alignment: alignToDocx(exportFormat.body.align),
          },
        },
        heading1: buildStyleFromHeadingFormat(exportFormat.heading1, 0),
        heading2: buildStyleFromHeadingFormat(exportFormat.heading2, 1),
        heading3: buildStyleFromHeadingFormat(exportFormat.heading3, 2),
        heading4: buildStyleFromHeadingFormat(exportFormat.heading4, 3),
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
                    font: runFont(exportFormat.body.font),
                    size: cnSizeToHalfPoints(exportFormat.body.size),
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
