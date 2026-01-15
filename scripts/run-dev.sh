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

log_info "Starting Electron Development Environment..."

# --- 切换到项目根目录 ---
cd "$(dirname "$0")/.."
log_info "Working directory: $(pwd)"

# --- 检查 node_modules 权限 ---
if [ -d "node_modules" ]; then
    OWNER=$(ls -ld node_modules | awk '{print $3}')
    if [ "$OWNER" == "root" ]; then
        log_error "node_modules is owned by root. This will cause permission issues."
        log_error "Please run the following command to fix ownership:"
        log_error "  sudo chown -R \$(whoami) node_modules"
        exit 1
    fi
fi

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

# --- 清理之前编译的后端文件 ---
if [ -d "dist" ]; then
    log_info "Cleaning previously compiled backend..."
    rm -rf "dist"
fi

# --- 编译TypeScript文件 ---
log_info "Compiling TypeScript files..."

# 检查 npx 是否可用
if command -v npx &> /dev/null; then
    # 检查是否有 TypeScript 文件
    if [ -n "$(find src -name "*.ts" -print -quit 2>/dev/null)" ]; then
        log_info "Found TypeScript files, compiling with tsconfig.json..."
        npx tsc
        if [ $? -ne 0 ]; then
            log_error "Failed to compile TypeScript files"
            exit 1
        fi
        
        log_success "TypeScript compilation completed"
        
        # --- 重新編譯 native 模塊 ---
        log_info "Rebuilding native modules for Electron..."
        npm run rebuild
        if [ $? -ne 0 ]; then
            log_warning "Failed to rebuild native modules, but continuing..."
        else
            log_success "Native modules rebuilt successfully"
        fi

        # --- 复制resources目录到dist ---
        log_info "Copying resources to dist..."
        
        # 检查dist目录是否存在
        if [ ! -d "dist" ]; then
            log_info "Creating dist directory..."
            mkdir -p "dist"
        fi
        
        # 复制 src/main/resources
        if [ -d "src/main/resources" ]; then
            log_info "Copying src/main/resources to dist/resources..."
            
            # 如果目标目录存在，先删除
            if [ -d "dist/resources" ]; then
                rm -rf "dist/resources"
            fi
            
            # 复制整个resources目录
            cp -r "src/main/resources" "dist/resources"
            
            if [ $? -eq 0 ]; then
                log_success "Resources copied successfully"
            else
                log_warning "Failed to copy some resources, but continuing..."
            fi
        else
            log_warning "src/main/resources directory not found, skipping copy"
        fi

        # --- 复制native目录到dist ---
        log_info "Copying native to dist..."
        
        # 复制 src/main/native
        if [ -d "src/main/native" ]; then
            log_info "Copying src/main/native to dist/native..."
            
            # 如果目标目录存在，先删除
            if [ -d "dist/native" ]; then
                rm -rf "dist/native"
            fi
            
            # 复制整个native目录
            cp -r "src/main/native" "dist/native"
            
            if [ $? -eq 0 ]; then
                log_success "Native directory copied successfully"
            else
                log_warning "Failed to copy some native files, but continuing..."
            fi
        else
            log_warning "src/main/native directory not found, skipping copy"
        fi

    else
        log_info "No TypeScript files found in src directory"
    fi
else
    log_warning "npx not found, skipping TypeScript compilation"
    log_warning "Please ensure TypeScript is compiled manually"
fi

log_success "Environment setup complete!"
log_info "Starting Electron in development mode..."
echo
log_info "Frontend will be available at: http://localhost:5173"
log_info "Electron app will launch automatically"
echo

# --- 启动Electron开发环境 ---
export NODE_ENV=development
npm run electron:dev

log_info "Development session ended"
