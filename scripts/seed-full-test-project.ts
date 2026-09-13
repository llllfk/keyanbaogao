/**
 * 创建一份功能完整的测试项目：
 * - 信息采集字段填满 + 启用财务测算
 * - 5 个附件字段各上传 1 个 txt（含可抽取正文）
 * - 智能依据召回并确认（含 1 条本项目批复）
 * - 简化财务测算已计算并确认
 *
 * 用法：pnpm exec tsx --tsconfig tsconfig.json scripts/seed-full-test-project.ts
 * 可选：--email=admin@keyan.local
 */
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

config({ path: path.resolve(process.cwd(), '.env.local') });

import { getDb, getPool } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { calculateFinanceV2 } from '../src/lib/finance/engine';
import { saveProjectAttachmentFile } from '../src/lib/project/attachments';
import { buildRecommendedBasisItems } from '../src/lib/project/match-basis';
import type {
  AttachmentField,
  BasicInfoInput,
  BasisItem,
} from '../src/lib/project/schema';
import {
  addProjectAttachment,
  createProject,
  saveProjectBasis,
  saveProjectFinance,
  updateProjectBasicInfo,
} from '../src/lib/project/store';

function argValue(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  const hit = process.argv.find(arg => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length).trim() : fallback;
}

const ATTACHMENT_SAMPLES: Array<{
  field: AttachmentField;
  fileName: string;
  body: string;
}> = [
  {
    field: 'marketAnalysis',
    fileName: '市场分析附件.txt',
    body: [
      '【测试附件·市场分析】',
      '片区机动车日均出行量约 2.8 万辆次，高峰小时饱和度约 0.92。',
      '沿线居住与商业用地持续落地，预计未来 5 年交通需求增长 15%～20%。',
      '改扩建后可分流周边支路压力，改善金水东路走廊通行效率。',
    ].join('\n'),
  },
  {
    field: 'techIndicators',
    fileName: '技术经济指标附件.txt',
    body: [
      '【测试附件·技术经济指标】',
      '道路等级：城市主干路；设计速度：50 km/h。',
      '红线宽度：40 m；机动车道：双向六车道。',
      '沥青混凝土路面；设计荷载：BZZ-100。',
      '雨水设计重现期：3 年一遇；照明平均照度：不低于规范要求。',
    ].join('\n'),
  },
  {
    field: 'techScheme',
    fileName: '技术方案附件.txt',
    body: [
      '【测试附件·技术方案】',
      '路基采用分层压实，旧路铣刨加铺与局部结构补强相结合。',
      '排水采用雨污分流，雨水口与管网与现状系统顺接。',
      '路口渠化与信号配时优化，标志标线按国标设置。',
      '同步落实海绵设施：透水铺装、下凹绿地与植草沟。',
    ].join('\n'),
  },
  {
    field: 'equipmentList',
    fileName: '设备清单附件.csv',
    body: [
      '序号,设备名称,规格型号,单位,数量,备注',
      '1,道路照明灯具,LED 150W,套,320,节能灯具',
      '2,交通信号机,多相位,套,8,主要交叉口',
      '3,监控摄像机,高清枪机,套,24,卡口与重点路段',
      '4,标志标牌,反光膜 III 类,套,180,含杆件',
    ].join('\n'),
  },
  {
    field: 'designText',
    fileName: '设计方案文本附件.md',
    body: [
      '# 设计方案文本（测试附件）',
      '',
      '本方案按城市主干路标准改扩建，兼顾机动车、非机动车与行人通行。',
      '横断面采用三幅路布置，中央分隔带兼顾景观与管线廊道。',
      '无障碍坡道、盲道连续贯通；公交停靠站港湾化设置。',
      '施工组织建议分段封闭、半幅通车，降低对沿线出行影响。',
    ].join('\n'),
  },
];

function buildBasicInfo(): BasicInfoInput {
  return {
    doFinancialAnalysis: true,
    name: '【完整测试】郑州市金水区市政道路改扩建工程',
    investmentType: 'government',
    industry: '市政公用工程',
    subSector: '市政道路',
    nature: 'rebuild_expand',
    unitName: '郑州市金水区住房和城乡建设局',
    unitOverview:
      '项目单位为郑州市金水区住房和城乡建设局，负责辖区内市政基础设施规划、建设与管理，具备本项目组织实施与运营管理能力。',
    locationRegion: '河南省郑州市金水区',
    locationDetail: '金水东路与农业路交叉口至东三环段',
    constructionPeriod: '2年',
    operationPeriod: '20年',
    constructionContentScale:
      '本项目拟对既有道路进行改扩建，道路全长约 3.2 公里，规划红线宽度 40 米，按城市主干路标准实施。主要建设内容包括道路路基路面、交通、排水、照明、绿化及配套管线迁改，同步完善无障碍与海绵城市设施。',
    mainProductsServices:
      '提供城市道路通行服务，保障机动车、非机动车与行人交通，改善片区出行条件与市政配套水平。',
    targetMarket: '金水区及周边片区居民、通勤交通与区域物流集散需求',
    marketAnalysis:
      '随着沿线居住与公建项目持续落地，区域出行量持续增长，既有道路通行能力不足，改扩建需求明确。（正文可与附件互补）',
    prepProgress:
      '已完成项目建议书编制与选线论证，正在开展初步勘察与方案设计，用地预审相关材料已启动准备。',
    involvesLandAcquisition: false,
    techIndicators:
      '道路等级城市主干路；设计速度 50km/h；双向六车道；人行道与非机动车道按规范设置。',
    techScheme:
      '沥青混凝土路面；雨污分流；节能照明；路口信号与标志标线按现行规范设置。',
    equipmentList:
      '运营期以道路照明、交通信号与监控设施为主；详细清单见附件 CSV。',
    designText:
      '设计遵循城市道路与排水相关规范，结合海绵城市要求设置透水铺装与下凹绿地。',
    fundingSources: ['fiscal', 'special_bond', 'self'],
    constructionManagementMode: 'epc',
    operationMode: 'self',
    attachments: [],
  };
}

async function main() {
  const email = argValue('email', 'admin@keyan.local').toLowerCase();
  const db = getDb();
  const [user] = await db
    .select({
      id: users.id,
      tenantId: users.tenantId,
      email: users.email,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new Error(`未找到用户 ${email}，请先 pnpm user:create`);
  }

  const scope = { tenantId: user.tenantId, userId: user.id };
  const basic = buildBasicInfo();

  console.log('1/5 创建项目…');
  let project = await createProject(scope, {
    name: basic.name,
    doFinancialAnalysis: true,
  });

  console.log('2/5 写入完整信息采集…');
  const updated = await updateProjectBasicInfo(scope, project.id, basic);
  if (!updated) {
    throw new Error('更新基础信息失败');
  }
  project = updated;

  console.log('3/5 上传 5 个字段附件…');
  for (const sample of ATTACHMENT_SAMPLES) {
    const buffer = Buffer.from(sample.body, 'utf8');
    const attachment = await saveProjectAttachmentFile({
      tenantId: scope.tenantId,
      projectId: project.id,
      field: sample.field,
      fileName: sample.fileName,
      mimeType:
        sample.fileName.endsWith('.csv')
          ? 'text/csv'
          : sample.fileName.endsWith('.md')
            ? 'text/markdown'
            : 'text/plain',
      buffer,
    });
    const next = await addProjectAttachment(scope, project.id, attachment);
    if (!next) {
      throw new Error(`附件写入失败：${sample.field}`);
    }
    project = next;
    console.log(
      `   - ${sample.field}: ${attachment.fileName} (${attachment.extractStatus}, ${attachment.extractedText?.length ?? 0} 字)`,
    );
  }

  console.log('4/5 召回并确认智能依据…');
  const recommended = await buildRecommendedBasisItems(
    project.basicInfo,
    project.basisItems,
  );
  const withManual: BasisItem[] = [
    ...recommended.map(item => ({
      ...item,
      // 与线上一致：仅核心文件默认勾选，其余留给用户 / AI 勾选
      selected: item.selected,
    })),
    {
      id: randomUUID(),
      group: 'project',
      title: '关于金水东路改扩建工程可行性研究报告的批复（测试）',
      docCode: '郑金建〔2026〕测试号',
      issuer: '郑州市金水区人民政府',
      sourceUrl: '',
      sourceSite: '',
      source: 'manual',
      packId: '',
      selected: true,
    },
  ];
  const selectedCount = withManual.filter(item => item.selected).length;
  const basisSaved = await saveProjectBasis(
    scope,
    project.id,
    withManual,
    true,
  );
  if (!basisSaved) {
    throw new Error('确认依据失败');
  }
  project = basisSaved;
  console.log(`   已锁定依据 ${selectedCount} 条`);

  console.log('5/5 写入并确认财务测算…');
  const financeInput = {
    constructionInvestment: 28500,
    equityRatio: 0.3,
    loanAnnualRate: 0.035,
    constructionYears: 2,
    workingCapitalRate: 0.05,
    annualRevenue: 3200,
    annualOperatingCost: 860,
    operationYears: 20,
    discountRate: 0.06,
    notes:
      '测试数据：假设含道路附属经营/停车等收入口径，便于验证正利润与回收期（V2）。',
  };
  const financeResult = calculateFinanceV2(financeInput);
  const financeSaved = await saveProjectFinance(scope, project.id, {
    input: financeInput,
    confirm: true,
  });
  if (!financeSaved) {
    throw new Error('保存财务测算失败');
  }
  project = financeSaved;

  const attachmentCount = project.basicInfo.attachments?.length ?? 0;
  const fieldsCovered = new Set(
    (project.basicInfo.attachments ?? []).map(item => item.field),
  );

  console.log('\nOK full test project ready');
  console.log(
    JSON.stringify(
      {
        id: project.id,
        name: project.basicInfo.name,
        status: project.status,
        email: user.email,
        doFinancialAnalysis: project.basicInfo.doFinancialAnalysis,
        attachments: attachmentCount,
        attachmentFields: [...fieldsCovered],
        basisSelected: project.basisItems.filter(item => item.selected).length,
        financeTotalInvestment: financeResult.totalInvestment,
        urls: {
          basic: `http://localhost:5000/projects/${project.id}/basic`,
          basis: `http://localhost:5000/projects/${project.id}/basis`,
          finance: `http://localhost:5000/projects/${project.id}/finance`,
          outline: `http://localhost:5000/projects/${project.id}/outline`,
          report: `http://localhost:5000/projects/${project.id}/report`,
        },
      },
      null,
      2,
    ),
  );

  await getPool().end();
}

main().catch(async error => {
  console.error('FAIL', error instanceof Error ? error.message : error);
  try {
    await getPool().end();
  } catch {
    // ignore
  }
  process.exit(1);
});
