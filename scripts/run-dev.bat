@echo off
chcp 65001
setlocal EnableDelayedExpansion

REM 颜色定义（Windows ANSI 转义序列）
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM 日志函数实现
set "log_info=echo %BLUE%[INFO]%NC%"
set "log_success=echo %GREEN%[SUCCESS]%NC%"
set "log_error=echo %RED%[ERROR]%NC%"
set "log_warning=echo %YELLOW%[WARNING]%NC%"

%log_info% Starting Electron Development Environment...


REM --- 切换到项目根目录 ---
set "PROJECT_ROOT=%~dp0.."
cd /d "%PROJECT_ROOT%"
%log_info% Working directory: %cd%

REM --- 检查 Node.js ---
node --version >nul 2>&1
if %errorlevel% neq 0 (
    %log_error% Node.js is not installed or not in PATH
    %log_error% Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM 显示 Node.js 版本
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
%log_info% Node.js version: !NODE_VERSION!

REM --- 安装根目录依赖 ---
if not exist "node_modules" (
    %log_info% Installing Electron dependencies...
    call npm install
    if %errorlevel% neq 0 (
        %log_error% Failed to install Electron dependencies
        pause
        exit /b 1
    )
) else (
    %log_info% Electron dependencies already installed
)

REM --- 安装前端依赖 ---
pushd "frontend"
if not exist "node_modules" (
    %log_info% Installing frontend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        %log_error% Failed to install frontend dependencies
        popd
        pause
        exit /b 1
    )
) else (
    %log_info% Frontend dependencies already installed
)
REM 返回根目录
popd

pushd "mcp-server"
if not exist "node_modules" (
    %log_info% Installing MCP server dependencies...
    call npm install
    if %errorlevel% neq 0 (
        %log_error% Failed to install MCP server dependencies
        popd
        pause
        exit /b 1
    )
) else (
    %log_info% MCP server dependencies already installed
)
popd

REM --- 清理之前编译的后端文件 ---
if exist "dist" (
    %log_info% Cleaning previously compiled backend...
    rmdir /s /q "dist"
)
if exist "mcp-server\dist" (
    %log_info% Cleaning previously compiled MCP server...
    rmdir /s /q "mcp-server\dist"
)

REM --- 编译TypeScript文件 ---
%log_info% Compiling TypeScript files...

REM REM 检查 npx 是否可用
call npx --version >nul 2>&1
if %errorlevel% equ 0 (
    REM 检查是否有 TypeScript 文件
    dir /s /b "src\*.ts" >nul 2>&1
    if %errorlevel% equ 0 (
        %log_info% Found TypeScript files, compiling with tsconfig.json...
        call npx tsc
        if %errorlevel% neq 0 (
            %log_error% Failed to compile TypeScript files
            pause
            exit /b 1
        )
        
        %log_success% TypeScript compilation completed

        %log_info% Building MCP server...
        call npm run build:mcp
        if %errorlevel% neq 0 (
            %log_error% Failed to build MCP server
            pause
            exit /b 1
        )

        %log_success% MCP server build completed
        
        REM --- 重新編譯 native 模塊 ---
        %log_info% Rebuilding native modules for Electron...
        call npm run rebuild
        if %errorlevel% neq 0 (
            %log_warning% Failed to rebuild native modules, but continuing...
        ) else (
            %log_success% Native modules rebuilt successfully
        )
        
        REM --- 复制resources目录到dist ---
        %log_info% Copying resources to dist...
        
        REM 检查dist目录是否存在
        if not exist "dist" (
            %log_info% Creating dist directory...
            mkdir "dist"
        )
        
        REM 复制整个resources目录
        if exist "src\main\resources" (
            %log_info% Copying src/main/resources to dist/resources...
            
            REM 如果目标目录存在，先删除
            if exist "dist\resources" (
                rmdir /s /q "dist\resources"
            )
            
            REM 复制整个resources目录
            xcopy "src\main\resources" "dist\resources" /E /I /Y >nul
            
            if %errorlevel% equ 0 (
                %log_success% Resources copied successfully
            ) else (
                %log_warning% Failed to copy some resources, but continuing...
            )
        ) else (
            %log_warning% src/main/resources directory not found, skipping copy
        )
        
        REM --- 复制native目录到dist ---
        %log_info% Copying native to dist...
        
        REM 复制整个native目录
        if exist "src\main\native" (
            %log_info% Copying src/main/native to dist/native...
            
            REM 如果目标目录存在，先删除
            if exist "dist\native" (
                rmdir /s /q "dist\native"
            )
            
            REM 复制整个native目录
            xcopy "src\main\native" "dist\native" /E /I /Y >nul
            
            if %errorlevel% equ 0 (
                %log_success% Native directory copied successfully
            ) else (
                %log_warning% Failed to copy some native files, but continuing...
            )
        ) else (
            %log_warning% src/main/native directory not found, skipping copy
        )
    ) else (
        %log_info% No TypeScript files found in src directory
    )
) else (
    %log_warning% npx not found, skipping TypeScript compilation
    %log_warning% Please ensure TypeScript is compiled manually
)

%log_success% Environment setup complete!
%log_info% Starting Electron in development mode...
echo.
%log_info% Frontend will be available at: http://localhost:5174
%log_info% Electron app will launch automatically
echo.

REM --- 启动Electron开发环境 ---
set NODE_ENV=development
call npm run electron:dev

%log_info% Development session ended

endlocal
pause
