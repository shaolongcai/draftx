/**
 * MCP Server 固定路径部署
 *
 * 打包后 mcp-server 位于 resources/mcp-server（安装目录可变，不适合写进 MCP 配置）。
 * 启动时将其同步到固定数据目录 ~/.draftx/mcp-server/，MCP 客户端配置即可永久指向：
 *   "args": ["<用户目录>/.draftx/mcp-server/dist/index.js"]
 * 通过 .version 版本戳对比，仅首次或 App 升级时才重新拷贝。
 */
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import pathConfig from '../core/pathConfigs.js';
import { logger } from '../core/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** 版本戳文件名（记录上次同步时的 App 版本） */
const VERSION_STAMP = '.version';

/** 获取 mcp-server 源目录：打包后读 resources，开发环境读仓库内 mcp-server */
const getSourceDir = (): string => {
    return app.isPackaged
        ? path.join(process.resourcesPath, 'mcp-server')
        : path.join(__dirname, '../../mcp-server');
}

/**
 * 同步 mcp-server 到固定数据目录
 * @returns 固定入口文件路径（同步失败时返回 null）
 */
export const syncMcpServer = (): string | null => {
    try {
        const sourceDir = getSourceDir();
        const targetDir = pathConfig.get('mcp');
        const entryPath = path.join(targetDir, 'dist', 'index.js');

        // 源目录必须存在且已构建（dist/index.js）
        if (!fs.existsSync(path.join(sourceDir, 'dist', 'index.js'))) {
            logger.error(`MCP Server 源文件不存在: ${sourceDir}（请先执行 npm run build:mcp）`);
            return null;
        }

        // 版本戳一致则跳过拷贝（避免每次启动覆盖 node_modules）
        const stampPath = path.join(targetDir, VERSION_STAMP);
        const currentVersion = app.getVersion();
        const syncedVersion = fs.existsSync(stampPath) ? fs.readFileSync(stampPath, 'utf-8').trim() : '';
        if (syncedVersion === currentVersion && fs.existsSync(entryPath)) {
            return entryPath;
        }

        // 清空旧目录后整体复制，避免残留旧版文件
        fs.rmSync(targetDir, { recursive: true, force: true });
        fs.cpSync(sourceDir, targetDir, { recursive: true });
        fs.writeFileSync(stampPath, currentVersion, 'utf-8');

        logger.info(`MCP Server 已同步到固定目录: ${entryPath}`);
        return entryPath;
    } catch (error) {
        logger.error(error);
        return null;
    }
}
