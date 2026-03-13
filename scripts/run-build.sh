#!/bin/bash
set -e

# 颜色定义（ANSI 转义序列）
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数实现
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_info "Starting DraftX Build Process..."

# --- 切换到项目根目录 ---
cd "$(dirname "$0")/.."
log_info "Working directory: $(pwd)"

# --- 检查 Node.js ---
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed or not in PATH"
    log_error "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# 显示 Node.js 版本
NODE_VERSION=$(node --version)
log_info "Node.js version: $NODE_VERSION"

# --- 安装根目录依赖 ---
if [ ! -d "node_modules" ]; then
    log_info "Installing Electron dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        log_error "Failed to install Electron dependencies"
        exit 1
    fi
else
    log_info "Electron dependencies already installed"
fi

# --- 安装前端依赖 ---
cd frontend
if [ ! -d "node_modules" ]; then
    log_info "Installing frontend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        log_error "Failed to install frontend dependencies"
        cd ..
        exit 1
    fi
else
    log_info "Frontend dependencies already installed"
fi
# 返回根目录
cd ..

# --- 清理之前编译的文件 ---
log_info "Cleaning previous builds..."
rm -rf dist out

# --- 编译TypeScript文件 ---
log_info "Compiling TypeScript files..."
npm run compile
if [ $? -ne 0 ]; then
    log_error "Failed to compile TypeScript files"
    exit 1
fi
log_success "TypeScript compilation completed"

# --- 混淆主线程代码 (关键步骤) ---
log_info "Obfuscating main process code..."
if npm run obfuscate; then
    log_success "Main process code obfuscated successfully"
else
    log_error "Failed to obfuscate main process code"
    exit 1
fi

# --- 重新編譯 native 模塊 ---
log_info "Rebuilding native modules for Electron..."
npm run rebuild
if [ $? -ne 0 ]; then
    log_warning "Failed to rebuild native modules, but continuing..."
else
    log_success "Native modules rebuilt successfully"
fi

# --- 复制资源文件 ---
log_info "Copying resources to dist..."

# 检查dist目录是否存在
if [ ! -d "dist" ]; then
    mkdir -p "dist"
fi

# 复制 src/main/resources
if [ -d "src/main/resources" ]; then
    log_info "Copying src/main/resources to dist/resources..."
    cp -r "src/main/resources" "dist/resources"
else
    log_warning "src/main/resources directory not found"
fi

# 复制 src/main/native
if [ -d "src/main/native" ]; then
    log_info "Copying src/main/native to dist/native..."
    cp -r "src/main/native" "dist/native"
else
    log_warning "src/main/native directory not found"
fi

# --- 构建前端 ---
log_info "Building frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    log_error "Frontend build failed"
    cd ..
    exit 1
fi
cd ..
log_success "Frontend build completed"

# --- 打包应用 ---
log_info "Packaging application with electron-builder..."

# 检测是否在 macOS 上运行
if [[ "$OSTYPE" == "darwin"* ]]; then
    log_info "Detected macOS, checking for signing credentials..."

    # 检查必要的环境变量
    MISSING_ENV=0
    if [ -z "$APPLE_ID" ]; then
        log_warning "APPLE_ID is not set (Required for Notarization)"
        MISSING_ENV=1
    fi
    if [ -z "$APPLE_APP_SPECIFIC_PASSWORD" ]; then
        log_warning "APPLE_APP_SPECIFIC_PASSWORD is not set (Required for Notarization)"
        MISSING_ENV=1
    fi
    if [ -z "$APPLE_TEAM_ID" ]; then
        log_warning "APPLE_TEAM_ID is not set (Required for Notarization)"
        MISSING_ENV=1
    fi

    if [ $MISSING_ENV -eq 0 ]; then
        log_info "All signing credentials found. Building, Signing and Notarizing for macOS..."
        
        # 打印代理信息用于调试
        if [ -n "$https_proxy" ] || [ -n "$http_proxy" ]; then
            log_info "Proxy settings detected:"
            log_info "  http_proxy: $http_proxy"
            log_info "  https_proxy: $https_proxy"
        else
            log_warning "No proxy settings detected. Notarization might timeout in some regions."
        fi

        # 使用 --mac 参数明确指定构建 Mac 版本
        npx electron-builder --mac
    else
        log_warning "Missing one or more signing credentials."
        log_warning "Building for macOS without notarization (App may not run on other Macs)..."
        log_warning "To enable Notarization, please export APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, and APPLE_TEAM_ID."
        
        # 仍然尝试构建，但 electron-builder 可能会因为缺少配置跳过公证
        npx electron-builder --mac
    fi
else
    # 非 macOS 平台 (如 Linux/Windows)
    log_info "Building for current platform..."
    npx electron-builder
fi

# --- 不签名的打包 (备用) ---
# npx electron-builder -c.mac.identity=null

if [ $? -ne 0 ]; then
    log_error "Electron build failed"
    exit 1
fi

log_success "Build completed successfully!"
log_info "Built files are located in: out/"
