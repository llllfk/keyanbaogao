/**
 * 插入一份已填满基础信息的测试项目，便于直接测「编制依据」。
 * 用法：node scripts/seed-test-project.js
 */
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const { randomUUID } = require('crypto');

const basicInfo = {
  doFinancialAnalysis: false,
  name: '郑州市金水区某市政道路改扩建工程可行性研究报告（测试稿）',
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
    '本项目拟对既有道路进行改扩建，道路全长约3.2公里，规划红线宽度40米，按城市主干路标准实施。主要建设内容包括：道路路基路面工程、交通工程、排水工程、照明工程、绿化景观工程及配套管线迁改等。同步完善无障碍设施与海绵城市设施。',
  mainProductsServices:
    '提供城市道路通行服务，保障机动车、非机动车与行人交通，改善片区出行条件与市政配套水平。',
  targetMarket: '金水区及周边片区居民、通勤交通与区域物流集散需求',
  marketAnalysis:
    '随着沿线居住与公建项目持续落地，区域出行量持续增长，既有道路通行能力不足，改扩建需求明确。',
  prepProgress:
    '已完成项目建议书编制与选线论证，正在开展初步勘察与方案设计，用地预审相关材料已启动准备。',
  involvesLandAcquisition: false,
  techIndicators:
    '道路等级：城市主干路；设计速度：50km/h；机动车道：双向六车道；人行道与非机动车道按规范设置。',
  techScheme:
    '采用沥青混凝土路面结构，排水采用雨污分流，照明采用节能灯具，路口信号与标志标线按现行规范设置。',
  equipmentList:
    '本项目以土建与市政设施为主，主要设备为施工期临时设备，运营期以道路照明与交通信号设施为主。',
  designText:
    '设计方案遵循现行城市道路与排水相关规范，结合海绵城市要求设置透水铺装与下凹绿地。',
  fundingSources: ['fiscal', 'special_bond', 'self'],
  constructionManagementMode: 'epc',
  operationMode: 'self',
};

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const userRes = await pool.query(
    `SELECT id, tenant_id, email FROM users WHERE email = $1 LIMIT 1`,
    ['admin@keyan.local'],
  );
  if (!userRes.rows[0]) {
    throw new Error('未找到 admin@keyan.local，请先创建账号');
  }

  const user = userRes.rows[0];
  const id = randomUUID();

  await pool.query(
    `INSERT INTO projects (
      id, tenant_id, user_id, status, basic_info, basis_items, basis_confirmed_at, created_at, updated_at
    ) VALUES (
      $1, $2, $3, 'basic_filled', $4::jsonb, '[]'::jsonb, NULL, now(), now()
    )`,
    [id, user.tenant_id, user.id, JSON.stringify(basicInfo)],
  );

  await pool.end();

  console.log('OK test project created');
  console.log(
    JSON.stringify(
      {
        id,
        name: basicInfo.name,
        status: 'basic_filled',
        basicUrl: `http://localhost:5000/projects/${id}/basic`,
        basisUrl: `http://localhost:5000/projects/${id}/basis`,
      },
      null,
      2,
    ),
  );
}

main().catch(error => {
  console.error('FAIL', error.message);
  process.exit(1);
});
