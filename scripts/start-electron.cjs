/**
 * Electron 启动包装脚本
 * 解决 ELECTRON_RUN_AS_NODE 环境变量冲突问题
 */
const { spawn } = require('child_process');
const path = require('path');

// 获取 electron 二进制路径
const electronPath = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe');

// 启动 electron，清除 ELECTRON_RUN_AS_NODE 环境变量
const child = spawn(electronPath, ['.'], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: undefined
  }
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
