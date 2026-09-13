/**
 * 兼容旧命令：改为调用自动同步（不再人工种子录入条目）。
 * 请使用：pnpm basis:sync
 */
const { spawnSync } = require('child_process');

const result = spawnSync(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  ['basis:sync'],
  { stdio: 'inherit', shell: true },
);

process.exit(result.status ?? 1);
