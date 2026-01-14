@echo off
chcp 65001
setlocal

echo [INFO] Building Electron Application with Forge...

:: 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    pause
    exit /b 1
)

:: 安装依赖
if not exist "node_modules" (
    echo [INFO] Installing root dependencies...
    call npm install
)
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    call pnpm install
    cd ..
)

:: 清理旧构建
if exist "out" rmdir /s /q "out"
if exist "dist" rmdir /s /q "dist"
if exist "frontend\dist" rmdir /s /q "frontend\dist"

:: 编译主进程 TypeScript
echo [INFO] Compiling main process TypeScript...
call npx tsc -p tsconfig.json --outDir dist
echo [SUCCESS] Main process compilation completed.

:: 代码混淆 (生产环境)
echo [INFO] Obfuscating main process code...
call npm run obfuscate
if %errorlevel% neq 0 (
    echo [ERROR] Obfuscation failed
    pause
    exit /b 1
)


:: 构建前端
echo [INFO] Building frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] electron-builder build failed
    pause
    exit /b 1
)
cd ..

:: 打包 Electron
echo [INFO] Building with electron-builder...
call npm run build:win

echo [SUCCESS] Build completed! Files in out\
dir out
pause