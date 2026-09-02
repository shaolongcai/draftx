/**
 * 笔记 md 文件服务
 *
 * 笔记以 .md 文件为事实来源（见 Agent.md）：
 * - 所有笔记存放于 pathConfig.get('notes')（~/.draftx/notes/）
 * - 图片等资源存放于 .asset 子目录
 * SQLite 仅存储元数据（path/title/mtime/hash），本模块负责一切文件读写
 */
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import pathConfig from './pathConfigs.js';
import { logger } from './logger.js';

/** 资源目录名（相对 notes 根目录） */
export const ASSET_DIR = '.asset';

export interface NoteFileInfo {
    /** 相对 notes 目录的路径（统一使用 posix 分隔符），如 "guide.md" */
    path: string;
    /** 文件修改时间（毫秒时间戳） */
    mtime: number;
}

/** 转为 posix 风格的相对路径 */
const toPosix = (p: string) => p.split(path.sep).join('/');

/** 相对路径转绝对路径 */
export const resolveNotePath = (relPath: string): string => {
    return path.join(pathConfig.get('notes'), ...relPath.split('/'));
}

/**
 * 递归扫描 notes 目录下的所有 .md 文件（跳过 .asset 目录）
 */
export const listMarkdownFiles = (): NoteFileInfo[] => {
    const root = pathConfig.get('notes');
    const result: NoteFileInfo[] = [];

    const walk = (dir: string) => {
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name === ASSET_DIR) continue;
                walk(full);
            } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
                const stat = fs.statSync(full);
                result.push({
                    path: toPosix(path.relative(root, full)),
                    mtime: Math.round(stat.mtimeMs),
                });
            }
        }
    };

    walk(root);
    return result;
}

/**
 * 读取笔记内容；文件不存在时返回 null
 */
export const readNote = (relPath: string): string | null => {
    try {
        return fs.readFileSync(resolveNotePath(relPath), 'utf-8');
    } catch {
        return null;
    }
}

/**
 * 写入笔记内容，返回文件修改时间（毫秒）
 */
export const writeNote = (relPath: string, content: string): number => {
    const abs = resolveNotePath(relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, 'utf-8');
    return Math.round(fs.statSync(abs).mtimeMs);
}

/**
 * 删除笔记文件（不存在的文件静默忽略）
 */
export const deleteNote = (relPath: string): void => {
    try {
        fs.rmSync(resolveNotePath(relPath), { force: true });
    } catch (error) {
        logger.error(`删除笔记文件失败: ${relPath}, ${error}`);
    }
}

/** Windows 文件系统不区分大小写，用于判断冲突文件是否就是当前文件 */
const isSameFilePath = (first: string, second: string): boolean => {
    const normalize = (value: string) => {
        const resolved = path.resolve(value);
        return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
    };
    return normalize(first) === normalize(second);
}

/** 拼接 notes 目录内的 posix 相对路径 */
const joinNotePath = (dirName: string, fileName: string): string => {
    return dirName === '.' ? fileName : `${dirName}/${fileName}`;
}

/**
 * 按标题重命名笔记文件，返回新的相对路径
 * - 空标题、文件不存在或重命名失败时返回 null，由调用方回退到原路径
 * - 目标文件名冲突时自动追加 -2、-3...，但不会把当前文件误判为冲突
 */
export const renameNote = (oldRelPath: string, title: string): string | null => {
    const nextBaseName = sanitizeFileName(title);
    if (!nextBaseName) return null;

    const oldPath = toPosix(oldRelPath);
    const oldAbsPath = resolveNotePath(oldPath);
    if (!fs.existsSync(oldAbsPath)) return null;

    const dirName = path.posix.dirname(oldPath);
    const currentBaseName = path.posix.basename(oldPath).replace(/\.md$/i, '');
    if (currentBaseName === nextBaseName) return oldPath;

    let candidateBaseName = nextBaseName;
    let candidatePath = joinNotePath(dirName, `${candidateBaseName}.md`);
    let candidateAbsPath = resolveNotePath(candidatePath);
    let counter = 2;

    while (fs.existsSync(candidateAbsPath) && !isSameFilePath(oldAbsPath, candidateAbsPath)) {
        candidateBaseName = `${nextBaseName}-${counter}`;
        candidatePath = joinNotePath(dirName, `${candidateBaseName}.md`);
        candidateAbsPath = resolveNotePath(candidatePath);
        counter++;
    }

    // 冲突避让后仍指向当前文件（例如目标名被其他笔记占用），无需重命名
    if (candidatePath === oldPath) return oldPath;

    try {
        fs.renameSync(oldAbsPath, candidateAbsPath);
        logger.info(`笔记文件已重命名: ${oldPath} -> ${candidatePath}`);
        return candidatePath;
    } catch (error) {
        logger.error(`重命名笔记文件失败: ${oldPath} -> ${candidatePath}, ${error}`);
        return null;
    }
}

/**
 * 计算内容 sha1 哈希
 */
export const hashContent = (content: string): string => {
    return crypto.createHash('sha1').update(content, 'utf-8').digest('hex');
}

/** 清理文件名中的非法字符 */
const sanitizeFileName = (name: string): string => {
    return name.replace(/[\\/:*?"<>|\r\n]+/g, ' ').replace(/^\.+/, '').trim();
}

/**
 * 为新笔记生成不冲突的相对路径
 * @param title 标题（可选），作为文件名；为空或纯占位时使用“未命名”
 * @param excludeUuid 已有同 uuid 的笔记不参与避让（由调用方保证）
 */
export const pathForNewNote = (title?: string): string => {
    const base = sanitizeFileName(title || '') || '未命名';
    const root = pathConfig.get('notes');

    let candidate = `${base}.md`;
    let counter = 2;
    while (fs.existsSync(path.join(root, candidate))) {
        candidate = `${base}-${counter}.md`;
        counter++;
    }
    return candidate;
}

/**
 * 从 markdown 内容提取标题（第一个一级标题）
 */
export const extractTitleFromMarkdown = (content: string): string => {
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : '';
}

/**
 * 保存图片等资源到 .asset 目录
 * @param data 文件内容
 * @param ext 扩展名（如 ".png"），为空默认 .png
 * @returns 相对 notes 目录的 posix 路径，如 ".asset/xxxx.png"
 */
export const saveAsset = (data: Buffer, ext?: string): string => {
    const safeExt = ext && /^\.[a-zA-Z0-9]+$/.test(ext) ? ext.toLowerCase() : '.png';
    const fileName = `${crypto.randomUUID()}${safeExt}`;
    const relPath = `${ASSET_DIR}/${fileName}`;
    const abs = path.join(pathConfig.get('notesAsset'), fileName);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, data);
    return relPath;
}
