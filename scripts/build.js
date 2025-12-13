const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔨 开始构建 Electron React 应用...');

// 确保 dist 目录存在
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 构建前端
console.log('📦 构建前端...');
const buildFrontend = spawn('pnpm', ['build'], {
  cwd: path.join(__dirname, '../frontend'),
  stdio: 'inherit',
  shell: true
});

buildFrontend.on('close', (code) => {
  if (code !== 0) {
    console.error('前端构建失败');
    process.exit(code);
  }
  
  console.log('✅ 前端构建完成');
  
  // 编译 TypeScript
  console.log('🔧 编译 TypeScript...');
  
  // 编译主进程
  const compileMain = spawn('tsc', ['-p', 'tsconfig.main.json'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true
  });
  
  compileMain.on('close', (mainCode) => {
    if (mainCode !== 0) {
      console.error('主进程编译失败');
      process.exit(mainCode);
    }
    
    console.log('✅ 主进程编译完成');
    
    // 编译服务器
    const compileServer = spawn('tsc', ['-p', 'tsconfig.server.json'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      shell: true
    });
    
    compileServer.on('close', (serverCode) => {
      if (serverCode !== 0) {
        console.error('服务器编译失败');
        process.exit(serverCode);
      }
      
      console.log('✅ 服务器编译完成');
      console.log('🎉 构建完成！');
      console.log('💡 运行 npm start 启动应用');
    });
  });
});